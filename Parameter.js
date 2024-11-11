import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';


function Parameter(){
    const [values, setValues] = useState({
        product: '',
        transaction: '',
        amount: '',
        time: '',
        
    })
    const [email, setEmail]= useState('');
    const [types, setTypes] = useState([])

    const navigate = useNavigate();
    const[errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const handleInput = (event) =>{
        setValues(prev => ({...prev, [event.target.name]: [event.target.value]}))
    }
    
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('/user');
                setEmail(response.data.username);
            } catch (err) {
                setEmail(null);
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        const fetchProductTypes = async () => {
            try {
                const response = await axios.get('/product-types'); // Changed to GET request
                if (response.data.error === "false") {
                    setTypes(response.data.data || []); // Ensure data is an array
                } else {
                    console.error("Error fetching product types:", response.data.message);
                }
            } catch (e) {
                console.error("Error: ", e);
            }
        }        
        fetchProductTypes();
    }, []);

    const handleSubmit = (event) => {
        console.log("Parameters");
       
        event.preventDefault();
        try{
             const response = axios.post('/parameters', values,{ params: { email } })
            .then(res => { 
                setMessage(res.data.message); // Set the confirmation message
                setTimeout(() => setMessage(''), 1000);         
               })
            .catch(err => console.log(err));
        }catch(e){
            console.error("Error: ",e);
        }
    };

   
    return(
        <div className='d-flex justify-content-center align-items-center bg-light vh-100'>
            <div style={{maxWidth: '400px', color: "white", marginRight:"150px", marginTop:"50px"}} className='bg-light rounded w-50 p-3'>
                <h2 className='text-dark mb-4'>Product Registration</h2>
                <form action="">
                <div className="mb-3 text-secondary">
                        <label htmlFor="product"><strong>Product</strong></label>
                        <select
                            id="product"
                            name="product"
                            onChange={handleInput}
                            className="form-control rounded-0"
                        >
                            <option value="">Select product</option>
                            {types.map((type, index) => (
                                <option key={index} value={type.id}> {/* Assuming each type has an 'id' field */}
                                    {type.code} {/* Assuming each type has a 'name' field */}
                                </option>
                            ))}
                            </select>
                        {errors.name && <span className='text-danger'>{errors.name}</span>}
                        </div>
                <div className="mb-3 text-secondary">
                    <label htmlFor="transaction"><strong>Expected Transaction</strong></label>
                        <input
                            type="number"
                            id="transaction"
                            placeholder="Enter transaction"
                            name='transaction'
                            onChange={handleInput}
                            className='form-control rounded-0'
                        />
                    {errors.username && <span className='text-danger'>{errors.username}</span>}
                </div>
                <div className="mb-3 text-secondary">
                    <label htmlFor="amount"><strong>Expected Amount</strong></label>
                        <input
                            type="number"
                            id="amount"
                            placeholder="Enter amount"
                            name='amount'
                            onChange={handleInput}
                            className='form-control rounded-0'
                        />
                    {errors.username && <span className='text-danger'>{errors.username}</span>}
                </div>
                <div className="mb-3 text-secondary">
                        <label htmlFor="time"><strong>Time</strong></label>
                        <select
                            id="time"
                            name='time'
                            onChange={handleInput}
                            className='form-control rounded-0'
                        >
                            <option value="">Select Time</option>
                            <option value="WorkingHours">Working Hours (8AM-5PM)</option>
                            <option value="NonWorkingHours">Non-Working Hours (6PM-7AM)</option>
                        </select>
                        {errors.time && <span className='text-danger'>{errors.time}</span>}
                    </div>
                <button onClick = {handleSubmit} style={{backgroundColor: "#6c757d", color: "white"}} type ="submit" className='btn btn-success w-100 rounded-0'>Register</button>
                <p className='text-dark'>You agree to our terms and policies</p>
                </form>
                {message && <p className='text-success'>{message}</p>} {/* Render the confirmation message */}
            </div> 
        </div>
    );
}



export default Parameter;