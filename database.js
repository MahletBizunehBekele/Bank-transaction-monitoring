const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST, // You can also use an IP address
    database: process.env.DB_DATABASE,
    port: 1433,
    options: {
        encrypt: true, // Use this if you're on Azure
        trustServerCertificate: true // Use this for local development
    }


};

// Create a single connection instance
const pool = new sql.ConnectionPool(config);

pool.connect()
    .then(() => {
        console.log('Connected to database');
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    });

module.exports = {
    sql,
    pool, 
    config
};