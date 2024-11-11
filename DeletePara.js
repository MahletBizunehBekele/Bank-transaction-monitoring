import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
// import Validation from './SignupValidation.js';
import axios from 'axios';


function DeletePara(){
    const [values, setValues] = useState({
        product: '',
        time: '',
    })

    const navigate = useNavigate();
    const[errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const handleInput = (event) =>{
        setValues(prev => ({...prev, [event.target.name]: [event.target.value]}))
    }
    
    
    const handleDelete = (event) => {
        console.log("Delete Parameter");
       
        event.preventDefault();
        try{
             const response = axios.post('/deleteparameter', values)
            .then(res => { 
                setMessage(res.data.message); // Set the confirmation message
                setTimeout(() => setMessage(''), 1000);            })
            .catch(err => console.log(err));
        }catch(e){
            console.error("Error: ",e);
        }
    };

    return(
        <div className='d-flex justify-content-center align-items-center bg-light vh-100'>
            <div style={{maxWidth: '400px', color: "white"}} className='bg-danger rounded w-50 p-3'>
                <h2 className='text-white mb-4'>Product Registration</h2>
                <form action="">
                <div className="mb-3">
                        <label htmlFor="product"><strong>Product</strong></label>
                        <select
                            type="text"
                            id="product"
                            placeholder="Enter Product"
                            name='product'
                            onChange={handleInput}
                            className='form-control rounded-0'
                        >
                        <option value="">Select product</option>
                        <option value="ATM">ATM</option>
                        <option value="POS">POS</option>
                        <option value="Mobile Banking">Mobile Banking</option>
                        <option value="Internet Banking">Internet Banking</option>
                        <option value="In-Person">In-Person</option>
                        </select>
                        {errors.name && <span className='text-danger'>{errors.name}</span>}
                </div>

                <button onClick = {handleDelete} style={{backgroundColor: "#6c757d", color: "white"}} type ="submit" className='btn btn-success w-100 rounded-0'>Delete</button>
                <p>You agree to our terms and policies</p>
                </form>
                {message && <p className='text-success'>{message}</p>} {/* Render the confirmation message */}
            </div> 
        </div>
    );
}

export default DeletePara;