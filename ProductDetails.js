import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './ATM&POS/TableStyles.css'
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});


function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  const formattedTime = 
    `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()} ` +
    `at ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` +
    `.${milliseconds.toString().padStart(3, '0')}${ampm}`;

  return formattedTime;
}

const ProductDetails = () => {
  const { productName } = useParams();
  const [data, setData] = useState([]);

useEffect(() => {
    const fetchProductData = async () => {
        try {
            const response = await apiClient.get(`/productslog/${encodeURIComponent(productName)}`);
            setData(response.data);
        } catch (err) {
            console.log("Error: ", err);
        }
    };
    fetchProductData();
}, [productName]);


  return (
    <div>
      <h2>{productName} Details</h2>
      <div className = "table-container">
      <table className="table" style = {{marginTop:"80px"}}>
        <thead>
          <tr>
          <th>Product</th>
          <th>Breach Amount</th>
          <th>Alert Date</th>
          <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
              <tr key={index}>
                        <td>{item.product}</td>
                        <td>{item.breachamount}</td>
                        <td>{item.alertdate ? formatTimestamp(item.alertdate) : 'NULL'}</td>
                        <td>{item.status}</td>
              </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default ProductDetails;
