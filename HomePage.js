import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';
import ATM from '../../Assets/atm.png';
import POS from '../../Assets/POS.png';
import IB from '../../Assets/IB.png';
import mobile from '../../Assets/mobile.png';
import Branch from '../../Assets/Branch.png';
import Card from '../../Cards/Cards';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    ArcElement,
    BarElement,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const HomePage = () => {
    const [ATMalerts, setATMalerts] = useState([]);
    const [POSalerts, setPOSalerts] = useState([]);
    const [productsalerts, setproductsalerts] = useState([]);
    const [ATMtables, setATMtables] = useState([]);
    const [POStables, setPOStables] = useState([]);
    const [producttables, setproducttables] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();
    const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    // Top 10 products for the bar chart
    const topProducts = productsalerts
        .sort((a, b) => b.breachamount - a.breachamount)
        .slice(0, 10);
    
    const barchartdata = {
        labels: topProducts.map(alert => alert.product),
        datasets: [{
            label: 'Breach Amount',
            data: topProducts.map(alert => alert.breachamount),
            backgroundColor: '#D30033',
        }],
    };

    const barChartOptions = {
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => `${value}`,
                },
            },
            x: {
                ticks: {
                    autoSkip: false,
                    maxRotation: 45,
                    minRotation: 45,
                    callback: (value) => value.length > 10 ? value.substring(0, 10) + '...' : value,
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.label}: ${context.raw}`,
                },
            },
        },
    };

    // Pie charts data for ATM and POS
    const ATMPiechart = {
        labels: ['FAILED', 'RUNNING'],
        datasets: [{
            data: [
                ATMalerts.filter(item => item.status === 'FAILED').length,
                ATMalerts.filter(item => item.status === 'RUNNING').length
            ],
            backgroundColor: ['#D30033', '#000000'],
        }],
    };

    const POSPiechart = {
        labels: ['FAILED', 'RUNNING'],
        datasets: [{
            data: [
                POSalerts.filter(item => item.status === 'FAILED').length,
                POSalerts.filter(item => item.status === 'RUNNING').length
            ],
            backgroundColor: ['#D30033', '#000000'],
        }],
    };

    // Aggregate data for the line chart
    const aggregateDataByMonth = (data, field) => {
        const monthlyTotals = new Array(12).fill(0);
        data.forEach(alert => {
            if (alert.alertdate) {  // Check if alertdate exists
                const datePart = alert.alertdate.split(' ')[0]; // Extract the date part (YYYY-MM-DD)
                const alertDate = new Date(datePart); // Create a Date object from YYYY-MM-DD
                const month = alertDate.getMonth(); // Get the month (0-11)
    
                if (!isNaN(month)) {  // Check if the date is valid
                    monthlyTotals[month] += parseFloat(alert[field] || 0); // Add value or 0 if undefined
                }
            }
            else if (alert.Failed_time) {  // Check if alertdate exists
                const datePart = alert.Failed_time.split(' ')[0]; // Extract the date part (YYYY-MM-DD)
                const alertDate = new Date(datePart); // Create a Date object from YYYY-MM-DD
                const month = alertDate.getMonth(); // Get the month (0-11)
    
                if (!isNaN(month)) {  // Check if the date is valid
                    monthlyTotals[month] += parseFloat(alert[field] || 0); // Add value or 0 if undefined
                }
            }
        });
        console.log(monthlyTotals)
        return monthlyTotals;
    };
    
    

    const chartData = {
        labels: monthLabels,
        datasets: [
            {
                label: 'ATM Downtime',
                data: aggregateDataByMonth(ATMalerts, 'downtime'),
                backgroundColor: 'rgb(115, 113, 113)',
            },
                        {
                label: 'Product Breach Amount',
                data: aggregateDataByMonth(productsalerts, 'breachamount'),
                backgroundColor: '#D30033',
            },

            {
                label: 'POS Downtime',
                data: aggregateDataByMonth(POSalerts, 'downtime'),
                backgroundColor: '#333333',
            },
        ],

    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/ATMalertslog');
                setATMalerts(response.data);
            } catch (error) {
                console.error('Error fetching ATM alerts:', error);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/POSalertslog');
                setPOSalerts(response.data);
            } catch (error) {
                console.error('Error fetching POS alerts:', error);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/alertslog');
                setproductsalerts(response.data);
            } catch (error) {
                console.error('Error fetching product alerts:', error);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/retrieveATMDownTime');
                console.log(response);
                setATMtables(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, []);
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/retrievePOSDownTime');
                console.log(response);
                setPOStables(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, []);
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/retrieveProductsTop');
                console.log(response);
                setproducttables(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, []);
    const chartOptions = {
        responsive: true,
        legend: {
            position: 'bottom',
            align: 'center',
            labels: {
                fontColor: '#000', // Set label color if needed
                padding: 20,      // Add padding to space them out
                boxWidth: 20,     // Adjust box size next to the labels
            }
        },
        layout: {
            padding: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            }
        }
    };
    return (
        <div className="homepage-container">
            <div className="product-list">
                <div className="card pie-chart-card">
                    <h3>ATM Status</h3>
                    <Pie data={ATMPiechart} options={{chartOptions}} />
                </div>
                <div className="card pie-chart-card">
                    <h3>Products Breach Amount</h3>
                    <Bar data={barchartdata} options={barChartOptions} />
                </div>
                <div className="card pie-chart-card">
                    <h3>POS Status</h3>
                    <Pie data={POSPiechart} options={{ maintainAspectRatio: false }} />
                </div>
                <Card title="Overall Status" chartData={chartData} />
            </div>
            <div className='tablecards'  style={{ maxHeight: "800px", overflow: "hidden", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)", backgroundColor: "#fff" }}>
                    <h5 style={{ color: "#D30033", textAlign: "center", marginBottom: "20px" }}>Products with higher breach amount</h5>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ backgroundColor: "#D30033", color: "#fff", textAlign: "left" }}>
                            <tr>
                                <th style={{ padding: "5px", borderBottom: "2px solid #D30033" }}>Product</th>
                                <th style={{ padding: "5px", borderBottom: "2px solid #D30033" }}>Breach Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {producttables.map((alert, index) => (
                                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff" }}>
                                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{alert.product}</td>
                                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{alert.breachamount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className='tablecards' style={{ maxHeight: "800px", overflow: "hidden", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)", backgroundColor: "#fff" }}>
                    <h5 style={{ color: "#D30033", marginBottom: "20px" }}>Top 5 ATM machines with longest downtime</h5>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ backgroundColor: "#D30033", color: "#fff", textAlign: "left" }}>
                            <tr>
                                <th style={{ padding: "5px", borderBottom: "2px solid #D30033" }}>ATM Name</th>
                                <th style={{ padding: "5px", borderBottom: "2px solid #D30033" }}>Down Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ATMtables.map((alert, index) => (
                                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff" }}>
                                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{alert.atm_name}</td>
                                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{alert.downtime}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className='tablecards' style={{ maxHeight: "800px", overflow: "hidden", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)", backgroundColor: "#fff" }}>
                    <h5 style={{ color: "#D30033", textAlign: "center", marginBottom: "20px" }}>Top 5 pos machines with longest downtime</h5>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ backgroundColor: "#D30033", color: "#fff", textAlign: "left" }}>
                            <tr>
                                <th style={{ padding: "5px", borderBottom: "2px solid #D30033" }}>POS Name</th>
                                <th style={{ padding: "5px", borderBottom: "2px solid #D30033" }}>Down Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {POStables.map((alert, index) => (
                                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff" }}>
                                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{alert.POS_name}</td>
                                    <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>{alert.downtime}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
    );
};

export default HomePage;
