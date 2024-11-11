const express = require('express');
const session = require('express-session');
const MSSQLStore = require('connect-mssql-v2');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer =  require('nodemailer');
const cors = require('cors');
const app = express();

const { sql, pool, config } = require('./database'); 
const store = new MSSQLStore({
    ...config,
    createDatabaseTable: false
});

const generateUniqueSessionId = () => {
    return uuidv4();
};

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    store: store, 
    cookie: { 
        maxAge:  365*24*60*60*1000, 
        secure: false 
    },
}))


app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    next();
});

// Set storage engine
const storage = multer.diskStorage({
    destination: './MACHINEPHOTOS',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

// Initialize upload
const upload = multer({
    storage: storage,
}).single('file');

app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error uploading file', error: err.message });
        }
        res.status(200).json({ message: 'File uploaded successfully', filePath: `MACHINEPHOTOS/${req.file.filename}` });
    });
});


const getColumnNames = async (tableName) => {
    try {
        // Connect to the database
        await sql.connect(config);

        // Query to get column names
        const result = await sql.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${tableName}'
        `);

        // Log column names
        const columns = result.recordset.map(row => row.COLUMN_NAME);

        // Close the connection
        await sql.close();
    } catch (err) {
        console.error('Error retrieving column names:', err);
    }
};

getColumnNames(store.table)
app.post('/login', async (req, res) => {
    const sqlQuery = "SELECT * FROM log WHERE username = @username";
    const userId = req.body.username;
    const sessionId = generateUniqueSessionId();

    try {
        const request = pool.request();

        // Check if the user exists
        const result = await request
            .input('username', sql.VarChar, req.body.username)
            .query(sqlQuery);

        if (result.recordset.length === 0) {
            res.status(401).json({ error: "true", message: "Failed" });
            return;
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(req.body.password, user.password);

        if (isMatch) {
            // Find existing sessions for this user
            const existingUser = await request
                .query(`
                    select sid FROM sessions
                    WHERE JSON_VALUE(session, '$.username') = @username
                `);
            console.log("1-------------", existingUser)

            await request
                .query(`
                    DELETE FROM sessions
                    WHERE JSON_VALUE(session, '$.username') = @username
                `);

            const existinguser = await request
                .query(`
                    select sid FROM sessions
                    WHERE JSON_VALUE(session, '$.username') = @username
                `);
            console.log("2---------------------", existinguser)

            // Set up new session
            req.session.isLoggedIn = true;
            req.session.username = req.body.username;
            req.session.FullName = req.body.name;
            req.session.userId = userId;
            req.session.sessionId = sessionId;

            // Save the new session
            await request
                .input('new_sid', sql.VarChar, sessionId)
                .input('expires', sql.DateTime, new Date(Date.now() + 365*24*60*60*1000))
                .input('session_data', sql.Text, JSON.stringify(req.session))
                .query("INSERT INTO sessions (sid, expires, session) VALUES (@new_sid, @expires, @session_data)");

            res.status(200).json({ error: "false", message: "Success", data: req.session });
        } else {
            req.session.isLoggedIn = false;
            res.status(401).json({ error: "true", message: "Failed" });
        }
    } catch (e) {
        console.error("Error: ", e);
        res.status(500).json({ error: "true", message: "Internal Server Error" });
    }
});


app.post('/logout',(req, res) => {
    req.session.isLoggedIn = false;

    console.log("Session Data:", req.session);
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session:", err);
        res.status(500).json({ error: true, message: "Failed to logout" });
      } 
      else{
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ error: false, message: "Logged out successfully" });
      }
    });
    console.log("Session Data:", req.session);
});
app.get('/user', async (req, res) => {
    console.log("------------------------user---------------------");

    // Check if the user is logged in and the session data is present
    if (!req.session.isLoggedIn || !req.session.username) {
        console.log("User is not logged in");
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const request = pool.request();

        // Verify if the session is still valid
        const sessionCheck = await request
            .input('sessionId', sql.VarChar, req.session.sessionId)
            .input('username', sql.VarChar, req.session.username)
            .query(`
                SELECT 1
                FROM sessions
                WHERE sid = @sessionId
                  AND JSON_VALUE(session, '$.username') = @username
                  AND expires > GETDATE()  -- Check if the session is still valid
            `);

        if (sessionCheck.recordset.length === 0) {
            // If the session does not exist or is expired, destroy the session
            req.session.destroy(err => {
                if (err) {
                    console.error('Error destroying session:', err);
                    return res.status(500).json({ message: 'Server error' });
                }
                console.log("Session destroyed, user logged out");
                res.status(401).json({ message: 'Session expired, please log in again' });
            });
            return; // Ensure no further code is executed after destroying the session
        }

        // Query the database for user data
        const result = await request
            .query('SELECT FullName FROM log WHERE username = @username');

        // Extract full name from query result
        const fullName = result.recordset[0]?.FullName || 'No full name found';

        console.log("Session Data:", req.session);
        console.log("FullName:", fullName);
        console.log("Username:", req.session.username);

        // Send user data as JSON including the full name
        res.json({ username: req.session.username, fullName });
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/check-session', (req, res) => {
    if (req.session.username) {
      console.log(req.session.username)
      res.json({ isAuthenticated: true });
    } else {
      res.json({ isAuthenticated: false });
    }
  });
  

app.post('/signup', async (req, res) => {
    console.log("Connecting to database.");

    try {
        const { name, username, password, phonenumber } = req.body;

        // Validate input values
        
        if (!name || !username || !password || !phonenumber) {
            return res.status(400).json({ error: "true", message: "Missing required fields" });
        }

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: true, message: "Name must be a non-empty string" });
        }
        
        const usernameRegex = /^[a-zA-Z0-9@]+$/;
        if (!username || !usernameRegex.test(username)) {
            return res.status(400).json({ error: "true", message: "Username must consist of only letters, numbers, and '@'" });
        }
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).json({
                error: "true", message: "Password must be 8-16 characters long, with at least one uppercase letter, one lowercase letter, one digit, and one special character"
            });
        }
        
        const phoneRegex = /^09\d{8}$/;
        if (!phonenumber || !phoneRegex.test(phonenumber)) {
            return res.status(400).json({ error: "true", message: "Phone number must start with '09' followed by 8 digits" });
        }       

        // Hash the password
        const hashedPassword = await bcrypt.hash(password.toString(), 10);

        // Validate and format phone number
        const formattedPhoneNumber = parseFloat(phonenumber);

        if (isNaN(formattedPhoneNumber)) {
            return res.status(400).json({ error: "true", message: "Invalid phone number format" });
        }

        console.log("FullName:", name);
        console.log("Username:", username);
        console.log("Password:", hashedPassword);
        console.log("PhoneNumber:", formattedPhoneNumber);

        const existingUser = 'SELECT * FROM log WHERE username = @username';

        const request = pool.request();
        const existinguser = await request 
                        .input('username', sql.VarChar, username.toString())
                        .query(existingUser)
        console.log(existinguser)
        if(existinguser.recordset.length != 0){
            return res.status(409).json({error: "true"});
        }
        const myquery = "INSERT INTO log (FullName, username, password, PhoneNumber, user_type) VALUES (@FullName, @username, @password, @PhoneNumber, @user_type)";
    
        // Execute the query with parameters
        await request
            .input('FullName', sql.VarChar, name.toString())
            .input('password', sql.VarChar, hashedPassword.toString())
            .input('PhoneNumber', sql.Decimal(18, 0), formattedPhoneNumber)
            .input('user_type', sql.VarChar , 'admin')
            .query(myquery);

        console.log("User successfully registered.");
        res.status(200).json({ error: "false", message: "User successfully registered" });
    } catch (e) {
        console.error("Error: ", e);
        res.status(500).json({ error: "true", message: "Internal Server Error" });
    }
});
app.post('/parameters', async (req, res) => {
    console.log("Connecting to database.");

    try {
        // Get the request body and session data
        const { product, transaction, amount, time } = req.body;
        const email = req.session.username;

        console.log(time[0]);
        // Get a connection from the pool
        const request = pool.request();

        // Check if the product exists
        const myquery = 'SELECT * FROM product WHERE product_name = @product_name';
        const result = await request
            .input('product_name', sql.VarChar, product.toString())
            .query(myquery);

        const existingProduct = result.recordset;

        if (existingProduct.length > 0) {
            if (time[0] === "WorkingHours") {
                await request
                    .input('transaction', sql.Decimal, transaction)
                    .input('email', sql.VarChar, email.toString())
                    .input('amount', sql.Decimal, amount)
                    .query(`UPDATE product 
                            SET transactions_workinghour = @transaction, 
                                email = @email, 
                                Amount_Working = @amount, 
                                time_taken = GETDATE()
                            WHERE product_name = @product_name`);
            } else if (time[0] === "NonWorkingHours") {
                console.log("NonWorkingHours");
                await request
                    .input('transaction', sql.Decimal, transaction)
                    .input('email', sql.VarChar, email.toString())
                    .input('amount', sql.Decimal, amount)
                    .query(`UPDATE product 
                            SET transactions_Nonworkinghour = @transaction, 
                                email = @email, 
                                Amount_NonWorking = @amount, 
                                time_taken = GETDATE()
                            WHERE product_name = @product_name`);
            }

            console.log("Product updated successfully.");
            res.status(200).json({ error: "false", message: "Product has been updated successfully!" });

        } else {
            console.log("time");
            if (time[0] === "WorkingHours") {
                console.log("WorkingHours");
                await request
                    .input('transaction', sql.Int, transaction)
                    .input('email', sql.VarChar, email.toString())
                    .input('amount', sql.Decimal, amount)
                    .query(`INSERT INTO product (product_name, transactions_workinghour, email, Amount_Working, time_taken) 
                            VALUES (@product_name, @transaction, @email, @amount, GETDATE())`);
            } else if (time[0] === "NonWorkingHours") {
                console.log("NonWorkingHours");
                await request
                .input('transaction', sql.Int, transaction)
                .input('email', sql.VarChar, email.toString())
                .input('amount', sql.Decimal, amount)
                .query(`
                    INSERT INTO product (product_name, transactions_Nonworkinghour, email, Amount_NonWorking, time_taken) 
                    VALUES (@product_name, @transaction, @email, @amount, GETDATE())
                `);
            }

            console.log("Product inserted successfully.");
            res.status(200).json({ error: "false", message: "Product has been registered successfully!" });
        }
    } catch (e) {
        console.error("Error: ", e);
        res.status(500).json({ error: "true", message: "Internal Server Error" });
    }
});


app.post('/register-type', async(req, res)=>{
    console.log("Connecting to database");
    try{
        const {product} = req.body
        const request = pool.request();
        await request
        .input('product', sql.VarChar, product.toString())
        .query('INSERT INTO type (code) VALUES (@product)');
        console.log("Product-type registered successfully");
        res.status(200).json({error: "false", message:"Product-type registered successfully"});
    }catch(e){
        console.log("Error: ",e);
        res.status(500).json({error: "true", message: "Product already exists"})
    }
})

app.get('/product-types', async (req, res) => {
    try {
        const request = pool.request();
        // Execute the query with parameters
        const result = await request.query('SELECT * FROM type');
        const product_types = result.recordset;
        console.log(product_types);
        res.status(200).json({ error: "false", data: product_types });
    } catch (e) {
        console.log("Error:", e);
        res.status(500).json({ error: "true", message: "Server error" });
    }
});


app.post('/deletepara', async (req, res) => {
    console.log("Connecting to database.");
    try {
        const {product_name} = req.body;
        console.log(product_name);
        // Check if the product exists
        const request = pool.request();
        const result = await request
                        .input('code', sql.VarChar, product_name)
                        .query('SELECT * FROM type WHERE code = @code')
        existingProduct = result.recordset;

        if (existingProduct.length > 0) {
            // Update the existing product's transaction
            await request
            .query(`DELETE from type WHERE code = @code`)
            console.log("Product deleted successfully.");
            res.status(200).json({error: "false", message: "Product has been deleted successfully!"});

        } else {
            res.status(200).json({error: "false", message: "Product does not exist!"});
        }
    } catch (e) {
        console.error("Error: ", e);
        res.status(500).json({ error: "true", message: "Internal Server Error" });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log(email);

    try {
        const request = pool.request();
        const result = await request
            .input('email', sql.VarChar, email.toString())
            .query('SELECT * FROM log WHERE username = @email');

        const rows = result.recordset;
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

        console.log(resetToken);
        console.log(resetTokenExpiry);

        // Store the reset token and expiry in the database
        await request
            .input('resetToken', sql.VarChar, resetToken)
            .input('resetTokenExpiry', sql.BigInt, resetTokenExpiry)
            .query('UPDATE log SET resetToken = @resetToken, resetTokenExpiry = @resetTokenExpiry WHERE username = @email');

        // Send reset email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'mtool267@gmail.com',
                pass: 'oyzr lwnm uwvv lbvm',
            },
        });

        const mailOptions = {
            from: 'no-reply@mtool267.com',
            to: email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click the following link to reset your password: 
                   http://localhost:3001/reset-password?token=${resetToken}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Reset link sent to your email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
})

app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const request = pool.request();

        // Find user with the provided reset token
        const result = await request
            .input('token', sql.VarChar, token)
            .input('currentTime', sql.BigInt, Date.now())
            .query('SELECT * FROM log WHERE resetToken = @token AND resetTokenExpiry > @currentTime');

        const rows = result.recordset;
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const user = rows[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password and clear the reset token
        await request
            .input('hashedPassword', sql.VarChar, hashedPassword)
            .query('UPDATE log SET password = @hashedPassword, resetToken = NULL, resetTokenExpiry = NULL WHERE resetToken = @token');

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Add this route to your Node.js server
app.get('/alert-recipients', async (req, res) => {
    try {
        const request = pool.request();
        const result = await request
            .input('user_type',sql.VarChar, 'admin')
            .query('SELECT username FROM log WHERE user_type = @user_type')
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching recipients:', error);
        res.status(500).json({ message: 'Error fetching recipients' });
    }
});

app.post('/atmreg', async (req, res) => {
    const { atm_name, ip_address, minimum_amount, primaryemail, secondaryemail, description } = req.body;

    console.log( atm_name, ip_address, minimum_amount, primaryemail, secondaryemail, description )
    try {
        const request = pool.request();

        const existingIp = await request
                            .input('ip', sql.VarChar, ip_address)
                            .query('SELECT * FROM ATM_ipaddress WHERE ip_address = @ip')
        
        console.log(existingIp)
        if(existingIp.recordset.length > 0){
            const result = await request
                    .input('atm_name', sql.VarChar, atm_name)
                    .input('minimum_amount', sql.Int, minimum_amount)
                    .input('primary_email', sql.VarChar, primaryemail)
                    .input('secondary_email', sql.VarChar, secondaryemail)
                    .input('desc', sql.VarChar, description || '')
                    .query('UPDATE ATM_ipaddress SET atm_name= @atm_name , minimum_amount=  @minimum_amount, Email_one = @primary_email , Email_two =  @secondary_email, [desc] = @desc WHERE ip_address = @ip ');
            res.status(200).json({ message: 'ATM Info is updated successfully!' });
            return;
        }
        // Step 1: Retrieve the last atmID from the table
        const lastAtmIDResult = await request.query('SELECT TOP 1 atmID FROM ATM_ipaddress ORDER BY atmID DESC');
        let newAtmID = '1'; // Default value if no rows exist

        if (lastAtmIDResult.recordset.length > 0) {
            const lastAtmID = lastAtmIDResult.recordset[0].atmID;
            const lastAtmIDInt = parseInt(lastAtmID, 10);
            newAtmID = (lastAtmIDInt + 1).toString();
        }

        // Step 2: Insert the new record with the incremented atmID
        const result = await request
            .input('atmID', sql.VarChar, newAtmID)
            .input('atm_name', sql.VarChar, atm_name)
            .input('ip_address', sql.VarChar, ip_address)
            .input('minimum_amount', sql.Int, minimum_amount)
            .input('primary_email', sql.VarChar, primaryemail)
            .input('secondary_email', sql.VarChar, secondaryemail)
            .input('desc', sql.VarChar, description || '')
            .query('INSERT INTO ATM_ipaddress (atmID, atm_name, ip_address, minimum_amount, Email_one, Email_two, [desc]) VALUES (@atmID, @atm_name, @ip_address, @minimum_amount, @primary_email, @secondary_email, @desc)');
        res.status(200).json({ message: 'Registration done!' });
    } catch (error) {
        console.log("Error: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/posreg', async (req, res) => {
    const { POS_name, ip_address, primaryemail, secondaryemail, description } = req.body;

    console.log(POS_name, ip_address, primaryemail, secondaryemail, description)
    try {
        const request = pool.request();

        const existingIp = await request
                            .input('ip', sql.VarChar, ip_address)
                            .query('SELECT * FROM POS_ipaddress WHERE ip_address = @ip')
        
        console.log(existingIp)
        if(existingIp.recordset.length > 0){
            const result = await request
                    .input('POS_name', sql.VarChar, POS_name)
                    .input('primary_email', sql.VarChar, primaryemail)
                    .input('secondary_email', sql.VarChar, secondaryemail)
                    .input('desc', sql.VarChar, description || '')
                    .query('UPDATE POS_ipaddress SET POS_name= @POS_name , Email_one = @primary_email , Email_two =  @secondary_email, [desc] = @desc WHERE ip_address = @ip ');
            res.status(200).json({ message: 'POS Info is updated successfully!' });
            return;
        }
        const lastAtmIDResult = await request.query('SELECT TOP 1 posId FROM POS_ipaddress ORDER BY posId DESC');
        let newAtmID = '1'; // Default value if no rows exist

        if (lastAtmIDResult.recordset.length > 0) {
            const lastAtmID = lastAtmIDResult.recordset[0].posId;
            const lastAtmIDInt = parseInt(lastAtmID, 10);
            newAtmID = (lastAtmIDInt + 1).toString();
        }

        // Step 2: Insert the new record with the incremented atmID
        const result = await request
            .input('posId', sql.VarChar, newAtmID)
            .input('POS_name', sql.VarChar, POS_name)
            .input('ip_address', sql.VarChar, ip_address)
            .input('primary_email', sql.VarChar, primaryemail)
            .input('secondary_email', sql.VarChar, secondaryemail)
            .input('desc', sql.VarChar, description || '')
            .query('INSERT INTO POS_ipaddress (posId, POS_name, ip_address , Email_one, Email_two, [desc]) VALUES (@posId, @POS_name, @ip_address, @primary_email, @secondary_email, @desc)');
        res.status(200).json({ message: 'Registration done!' });
    } catch (error) {
        console.log("Error: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
app.get('/retrieveATMIp', async(req, res)=>{
   try{ const request = pool.request()
        const result = await request
                    .query('SELECT * FROM ATM_ipaddress')
        res.status(200).json(result.recordset)
        }
    catch(error){
        console.log("Error: ", error)
    }
})

app.get('/retrievePosip', async(req, res)=>{
    try{ const request = pool.request()
         const result = await request
                     .query('SELECT * FROM POS_ipaddress')
         res.status(200).json(result.recordset)
         }
     catch(error){
         console.log("Error: ", error)
     }
 })

app.get('/retrieveATMCurrent', async(req, res) =>{
    try{
        const request = pool.request()
        const result = await request
                        .query('SELECT *  FROM ATM_CurrentLog')
        res.status(200).json(result.recordset)               
    }
    catch(error){
        console.log("Error: ", error)
    }
})

app.post('/updateStatus', async(req, res) =>{
    const id= req.query.id;
    const status = req.query.status;
    console.log(id, status)
    try{
        const request = pool.request()
        await request   
            .input('status', sql.VarChar, status)
            .input('id', sql.VarChar, id)
            .query('UPDATE ATM_CurrentLog SET status = @status WHERE atm_id = @id')

        res.status(200).json({message: "success"})
    }
    catch(error){
        console.log("Error: ", error)
    }
})

app.post('/logalertforATM', async (req, res) => {
    console.log('Request Body:', req.body);

    const { emails, alertmsg, ipaddress, status, hostname } = req.body;

    console.log(emails)
    // Function to get current time formatted for Africa/Nairobi and keep it in SQL-friendly format
    const getCurrentTimeInTimezone = (timeZone) => {
        const options = {
            timeZone: timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };

        const formatter = new Intl.DateTimeFormat('en-GB', options);
        const parts = formatter.formatToParts(new Date());

        // Extract and format date parts to match SQL DateTime format (YYYY-MM-DD HH:MM:SS)
        const date = `${parts[4].value}-${parts[2].value}-${parts[0].value}`;
        const time = `${parts[6].value}:${parts[8].value}:${parts[10].value}`;

        return `${date} ${time}`;
    };

    // Get the current time formatted for East Africa Time (EAT)
    const currentTimeEAT = getCurrentTimeInTimezone('Africa/Nairobi');

    const failedTime = status === 'FAILED' ? currentTimeEAT : null;
    const startTime = status === 'RUNNING' ? currentTimeEAT : null;

    console.log(failedTime)
    console.log(startTime)
    const delimitedString = emails[0];
    console.log(delimitedString);

    try {
        const request = await pool.request();

        if (status === 'FAILED') {
            await request
                .input('alertmsg', sql.VarChar, alertmsg.toString())
                .input('email', sql.VarChar(sql.MAX), delimitedString)
                .input('ipaddress', sql.VarChar, ipaddress)
                .input('status', sql.VarChar, status)
                .input('failedTime', sql.VarChar, failedTime)
                .input('startTime', sql.VarChar, startTime)
                .input('atm_name', sql.VarChar, hostname)
                .query(`INSERT INTO ATMalertlog 
                    (email, message_sent, Ip_address, status, Failed_time, Start_time, atm_name) 
                    VALUES (@email, @alertmsg, @ipaddress, @status, @failedTime, @startTime, @atm_name)`);
        } else if (status === 'RUNNING') {
            // Update the last record for this IP address if status is 'RUNNING'
            await request
                .input('ipaddress', sql.VarChar, ipaddress)
                .input('startTime', sql.VarChar, startTime)
                .input('status', sql.VarChar, status)
                .query(`UPDATE ATMalertlog
                    SET Start_time = @startTime, status = @status
                    WHERE Ip_address = @ipaddress AND Start_time IS NULL
                    `);
        }

        res.status(200).json({ message: 'Alert logged successfully' });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({ message: 'Error logging ping alerts' });
    }
});

app.post('/logalertforPOS', async (req, res) => {
    console.log('Request Body:', req.body);

    const { emails, alertmsg, ipaddress, status, hostname } = req.body;

    // Function to get current time formatted for Africa/Nairobi and keep it in SQL-friendly format
    const getCurrentTimeInTimezone = (timeZone) => {
        const options = {
            timeZone: timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };

        const formatter = new Intl.DateTimeFormat('en-GB', options);
        const parts = formatter.formatToParts(new Date());

        // Extract and format date parts to match SQL DateTime format (YYYY-MM-DD HH:MM:SS)
        const date = `${parts[4].value}-${parts[2].value}-${parts[0].value}`;
        const time = `${parts[6].value}:${parts[8].value}:${parts[10].value}`;

        return `${date} ${time}`;
    };

    // Get the current time formatted for East Africa Time (EAT)
    const currentTimeEAT = getCurrentTimeInTimezone('Africa/Nairobi');

    const failedTime = status === 'FAILED' ? currentTimeEAT : null;
    const startTime = status === 'RUNNING' ? currentTimeEAT : null;

    const delimitedString = emails[0];
    console.log("delimitedString",delimitedString)
    try {
        const request = await pool.request();

        if (status === 'FAILED') {
            await request
                .input('alertmsg', sql.VarChar, alertmsg.toString())
                .input('email', sql.VarChar(sql.MAX), delimitedString)
                .input('ipaddress', sql.VarChar, ipaddress)
                .input('status', sql.VarChar, status)
                .input('failedTime', sql.VarChar, failedTime)
                .input('startTime', sql.VarChar, startTime)
                .input('POS_name', sql.VarChar, hostname)
                .query(`INSERT INTO POSalertlog 
                    (recipient_emails, messagesent, ip_address, status, Failed_time, Start_time, POS_name) 
                    VALUES (@email, @alertmsg, @ipaddress, @status, @failedTime, @startTime, @POS_name)`);
        } else if (status === 'RUNNING') {
            // Update the last record for this IP address if status is 'RUNNING'
            await request
                .input('ipaddress', sql.VarChar, ipaddress)
                .input('startTime', sql.VarChar, startTime)
                .input('status', sql.VarChar, status)
                .query(`UPDATE POSalertlog
                    SET Start_time = @startTime, status = @status
                    WHERE ip_address = @ipaddress AND Start_time IS NULL
                    `);
        }

        res.status(200).json({ message: 'Alert logged successfully' });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({ message: 'Error logging ping alerts' });
    }
});

app.get('/registered-ip', async(req,res)=>{
    const { ip } = req.query; // Use req.query for GET requests
    try {
        const request = await pool.request();
        const result = await request
            .input('ip', sql.VarChar, ip) 
            .input('status', sql.VarChar, "FAILED")
            .query('SELECT * FROM ATMalertlog WHERE Ip_address = @ip and status = @status');
        
        const isRegistered = result.recordset.length > 0;
        console.log(ip, isRegistered)
        res.status(200).json( isRegistered ); 
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({ message: 'Error fetching ping alerts data' });
    }
})

app.get('/registered-POSip', async(req,res)=>{
    const { ip } = req.query; // Use req.query for GET requests
    try {
        const request = await pool.request();
        const result = await request
            .input('ip', sql.VarChar, ip) 
            .input('status', sql.VarChar, "FAILED")
            .query('SELECT * FROM POSalertlog WHERE Ip_address = @ip and status = @status');
        
        const isRegistered = result.recordset.length > 0;
        console.log(ip, isRegistered)
        res.status(200).json( isRegistered ); 
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({ message: 'Error fetching ping alerts data' });
    }
})

app.get('/retrieveATMDownTime', async(req, res)=>{
    try{
        const request = pool.request()
        const result = await request
                        .query('SELECT TOP 5 atm_name,downtime FROM ATMalertlog where downtime IS NOT NULL ORDER BY downtime DESC')
        console.log(result.recordset)
        res.status(200).json(result.recordset)
    }
    catch(error){
        console.log("Error: ", error)
    }
})

app.get('/retrievePOSDownTime', async(req, res)=>{
    try{
        const request = pool.request()
        const result = await request
                        .query('SELECT TOP 5 POS_name,downtime FROM POSalertlog where downtime IS NOT NULL ORDER BY downtime DESC')
        console.log(result.recordset)
        res.status(200).json(result.recordset)
    }
    catch(error){
        console.log("Error: ", error)
    }
})

app.get('/retrieveProductsTop', async(req, res)=>{
    try{
        const request = pool.request()
        const result = await request
                        .query('SELECT TOP 5 product,breachamount FROM alert ORDER BY breachamount DESC')
        console.log(result.recordset)
        res.status(200).json(result.recordset)
    }
    catch(error){
        console.log("Error: ", error)
    }
})

app.get('/productAlert', async(req, res) =>{
    try{
        const request = pool.request()
        const result = await request    
                        .input('status', sql.VarChar, "UNSENT")
                        .query('SELECT product, breachamount FROM alert WHERE status = @status');    
        console.log(result.recordset)
        res.status(200).json(result.recordset);
    }
    catch(error){
        console.log("Error: ", error)
        res.status(500).json({message: 'Error fetching product Alert data'})
    }
})


app.post('/update-product-status', async (req, res) => {
    const { product_name, breach_amount } = req.body;
    try {
        const request = await pool.request();
        await request
            .input('product_name', sql.VarChar, product_name)
            .input('breach_amount', sql.Int, breach_amount)
            .input('status', sql.VarChar, "SENT")
            .query('UPDATE alert SET status = @status, alertdate = GETDATE() WHERE product = @product_name AND breachamount = @breach_amount');
        
        res.status(200).json({ message: 'Product status updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error updating product status' });
    }
});

app.get('/alertslog', async(req, res) =>{
    try{
        const request = pool.request()
        const result = await request
                        .query('SELECT * FROM alert')
        res.status(200).json(result.recordset)

    }
    catch(error){
        console.log("error, ", error)
    }
})

app.get('/alertcount', async(req, res) =>{
    try{
        console.log('alertcoutn')
        const request = pool.request()
        const result = await request
                        .query('SELECT product,count(product) noalert from alert group by product')
        console.log(result.recordset)
        res.status(200).json(result.recordset)                

    }
    catch(error){
        console.log("Error: ", error)
    }
})

app.get('/ATMalertslog', async(req, res) =>{
    const request = pool.request()
    const result = await request   
                .query('SELECT * from ATMalertlog')
    res.status(200).json(result.recordset)        
})
app.get('/POSalertslog', async(req, res) =>{
    const request = pool.request()
    const result = await request   
                .query('SELECT * from POSalertlog')
    res.status(200).json(result.recordset)        
})

app.get('/productslog/:productName', async(req, res) => {
    const { productName } = req.params;
    console.log(productName)
    const request = pool.request()
    const result = await request
                    .input('productName', sql.Char, productName)  
                    .query('SELECT * from alert WHERE product = @productName')
       
    console.log(result.recordset)
    if (result.length != 0) {
        res.json(result.recordset);
    } else {
        res.status(404).send('Product not found');
    }
});

app.use((req, res, next) => {
    res.status(404).json({ message: "Endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});