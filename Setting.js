import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Setting() {
    const navigate = useNavigate();
    const [product, setProduct] = useState('');
    const [productDelete, setProductDelete] = useState('');
    const [message, setMessage] = useState('');
    const [messageDel, setMessageDel] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        try {
            const res = await axios.post('/register-type', { product });
            setMessage(res.data.message); 
            setTimeout(() => setMessage(''), 3000); // Display message for 3 seconds
        } catch (error) {
            console.error('Submission error:', error);
            setMessage(error.response.data.message); 
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/deletepara', { product_name: productDelete });
            setMessageDel(response.data.message); // Set the confirmation message
            setTimeout(() => setMessageDel(''), 3000); // Display message for 3 seconds
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    return (
        <div className="register-type" style={{ marginTop: "150px", marginLeft: "250px" }}>
            <h2>Register Product Type</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="productreg">Product:</label>
                <input
                    type="text"
                    id="productreg"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    required
                />
                <button style={{ backgroundColor: "#6c757d", color: "white"}} type="submit" className='btn btn-success w-25 h-10 rounded-0'>Register</button>
                {message && <p>{message}</p>}
            </form>

            <h2>Remove Product Type</h2>
            <form onSubmit={handleDelete}>
                <label htmlFor="productdelete">Product:</label>
                <input
                    type="text"
                    id="productdelete"
                    value={productDelete}
                    onChange={(e) => setProductDelete(e.target.value)}
                    required
                />
                <button style={{ backgroundColor: "#6c757d", color: "white" }} type="submit" className='btn btn-success w-25 h-10 rounded-0'>Delete</button>
                {messageDel && <p>{messageDel}</p>}
            </form>
        </div>
    );
}

export default Setting;
