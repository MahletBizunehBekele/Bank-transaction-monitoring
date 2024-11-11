import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import FilterComponent from './FilterComponent';
import { format } from 'date-fns';

import './ATM&POS/TableStyles.css'

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
function Report() {
    const [alertsLog, setAlertsLog] = useState([]);
    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await apiClient.get('/alertslog');
                setAlertsLog(response.data);
                setFilteredData(response.data);
            } catch (err) {
                console.log("Error: ", err);
            }
        };
        fetchAlerts();
    }, []);

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(alertsLog);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'AlertsLog');
        XLSX.writeFile(wb, 'AlertsLog.xlsx');
    };
       
    const handleApplyFilters = (filters) => {
        const filtered = alertsLog.filter((item) => {
            return Object.keys(filters).every((key) => {
                if (!filters[key]) return true;
                if (key === 'status') {
                    return item[key]?.toLowerCase() === filters[key].toLowerCase();
                }
                return item[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());
            });
        });

        setFilteredData(filtered);
    };

    const columns = [
        { key: 'product', placeholder: 'Product' },
        { key: 'breachamount', placeholder: 'Breach Amount' },
        { key: 'alertdate', placeholder: 'Alert Date and Time', type: 'date' },
        { key: 'status', placeholder: 'Status', type: 'text' },
    ];

    return (
            <div className="table-container" style={{marginTop: "100px"}}>
            <h2>Alerts Report</h2>
            <FilterComponent columns={columns} onApplyFilters={handleApplyFilters} />
            <button onClick={handleExport} style={{ marginTop: "40px", display: "block", marginLeft: "auto", marginRight: "auto" }}>
               Export to Excel
            </button>
            <table className="table">
               <thead>
                  <tr>
                        <th>Product</th>
                        <th>Breach Amount</th>
                        <th>Alert Date and Time</th>
                        <th>Status</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredData.map((alert, index) => (
                        <tr key={index}>
                           <td>{alert.product}</td>
                           <td>{alert.breachamount}</td>
                           <td>{alert.alertdate ? formatTimestamp(alert.alertdate) : 'NULL'}</td>
                           <td>{alert.status}</td>
                        </tr>
                  ))}
               </tbody>
            </table>
      </div>
    );
}

export default Report;
