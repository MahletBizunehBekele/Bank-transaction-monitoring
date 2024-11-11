// src/pages/HelpPage.js
import React from 'react';
import { Link } from 'react-router-dom'; // If using react-router-dom
import './HelpPage.css'; // Import your CSS file


const HelpPage = () => {
  return (
    <div className="help-page">
      <h1>Help Center</h1>
      <div className="nav-box">
        <h2>Quick Links</h2>
        <ul>
          <li><a href="#product-names">How to Enter Product Types</a></li>
          <li><a href="#parameters-page">How to Fill Out the Parameters Page</a></li>
          <li><a href="#parameters-update">How to Update threshold values of a product</a></li>
          <li><a href="#alert-logs">How to View Alert Logs</a></li>
          <li><a href="#atm-logs">How to View ATM or POS Alert Logs</a></li>
          <li><a href="#cash-logs">How to View ATM Cash Level Report</a></li>
          <li><a href="#user-registration">How to Register a New User</a></li>
        </ul>
      </div>
      <div id="product-names" className="help-section">
        <h2>How to Enter Product Types in the Settings Tab</h2>
        <ol>
          <li>Navigate to the <strong>Settings</strong> tab from the main menu.</li>
          <li>Locate the section to Register product types.</li>
          <li>Input the product name in the designated field.</li>
          <li>Click on <strong>Save</strong> to update the product list.</li>
        </ol>
      </div>
      <div id="parameters-page" className="help-section">
        <h2>How to fill Out the Parameters Page</h2>
        <ol>
          <li>Go to the <strong>Parameters</strong> page from the main menu.</li>
          <li>Select the product name in the <strong>Product Name</strong> field.</li>
          <li>Input the <strong>Expected transaction, Expected amount</strong> and <strong>Time</strong> in the fields.</li>
          <li>Click on <strong>Register</strong> to save the parameters threshold.</li>
        </ol>
      </div>
      <div id="parameters-update" className="help-section">
        <h2>How to Update threshold values of a given product</h2>
        <ol>
          <li>Go to the <strong>Parameters</strong> page from the main menu.</li>
          <li>Select the product name in the <strong>Product Name</strong> field.</li>
          <li>Input the updated <strong>Expected transaction, Expected amount</strong> and <strong>Time</strong> in the fields.</li>
          <li>Click on <strong>Register</strong> to update the parameters threshold.</li>
        </ol>
      </div>
      <div id="alert-logs" className="help-section">
        <h2>How to View ProductAlert Logs</h2>
        <ol>
          <li>Select the <strong>Report</strong> page from the main menu.</li>
          <li>Browse through the list of alert logs displayed.</li>
          <li>Click on any log entry to view more details.</li>
        </ol>
      </div>
      <div id="atm-logs" className="help-section">
        <h2>How to View POS or ATM Alert Logs</h2>
        <ol>
          <li>Navigate to the <strong>ATM&POS Registration</strong> page from the main menu.</li>
          <li>Find the Alert logs you wish to view.</li>
          <li>Click on a log entry to see the details.</li>
        </ol>
      </div>
      <div id="cash-logs" className="help-section">
        <h2>How to View ATM Cash Level Report</h2>
        <ol>
          <li>Navigate to the <strong>ATM Cash Level Report</strong> page from the main menu.</li>
          <li>Find the ATM cash logs you wish to view.</li>
          <li>Click on a log entry to see the details.</li>
        </ol>
      </div>
      <div id="user-registration" className="help-section">
        <h2>How to Register a New User</h2>
        <ol>
          <li>Go to the <strong>Register</strong> tab from the main menu.</li>
          <li>Fill in the following details:
            <ul>
              <li><strong>Name:</strong> Enter the user’s full name.</li>
              <li><strong>Username:</strong> Choose a unique username.</li>
              <li><strong>Password:</strong> Set a secure password.</li>
              <li><strong>Phone Number:</strong> Provide a contact number.</li>
            </ul>
          </li>
          <li>Click on <strong>Register</strong> to complete the process.</li>
          <li>If you are not registered, ask another user to log in and use their session to register you.</li>
        </ol>
      </div>
    </div>
  );
};

export default HelpPage;
