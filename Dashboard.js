import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation, Link, useMatch, useResolvedPath, Outlet } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import zemen_icon from '../Assets/Z logo White (1).png';
import home_icon from '../Assets/home_16dp_5F6368_FILL0_wght400_GRAD0_opsz20.png';
import para_icon from '../Assets/parameter.png';
import user_icon from '../Assets/UserManagement.png';
import setting_icon from '../Assets/settings_16dp_5F6368_FILL0_wght400_GRAD0_opsz20.png';
import report_icon from '../Assets/summarize_16dp_5F6368_FILL0_wght400_GRAD0_opsz20.png';
import atmreport_icon from '../Assets/lab_profile_24dp_5F6368_FILL0_wght400_GRAD0_opsz24.png';
import help_icon from '../Assets/help_16dp_5F6368_FILL0_wght400_GRAD0_opsz20.png';
import person_icon from '../Assets/person_16dp_5F6368_FILL0_wght400_GRAD0_opsz20.png';
import atmpos from '../Assets/inventory_16dp_5F6368_FILL0_wght400_GRAD0_opsz20.png'
import { AuthContext } from '../Login&Signup/AuthContext';
import useIdleTimer from './useIdleTimer'; 
import {Container,Nav,Button, Navbar as NavbarBs} from 'react-bootstrap'
import { NavLink } from 'react-router-dom';


const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});

function Dashboard() {
  const navigate = useNavigate();
  const { logoutt } = useContext(AuthContext);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const menuRef = useRef();
  const imgRef = useRef();

  const logout = async () => {
    try {
      await apiClient.post('/logout');
      logoutt();
      setIsAuthenticated(false);
      sessionStorage.removeItem('isAuthenticated');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const Menus = [
    { name: 'Change-password', path: '/forgot-password' },
    { name: 'Logout', action: logout },
  ];

  const handleToggle = () => {
    setOpen(!open);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/user');
        if (response.status === 200) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
        console.error('Error checking authentication:', err);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleMenuClick = (menu) => {
    if (menu.path) {
      navigate(menu.path);
    } else if (menu.action) {
      menu.action();
    }
    setOpen(false);
  };

  const handleTimeout = () => {
    // Logic to logout the user on idle timeout
    console.log("User is idle, logging out...");
    logout(); // redirect to login page
  };

  useIdleTimer(15*60*1000, handleTimeout);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/');
    }
  }, [location.pathname, navigate]);

  if (isAuthenticated === null) {
    return <p>Loading...</p>;
  }

  sessionStorage.setItem('isAuthenticated', 'true');

  return (
    <>
      <div className="top-bar">
        <div className="hamburger" onClick={toggleSidebar}>
          &#9776;
        </div>
        <img src={zemen_icon} alt="Logo" />
        <h2 className='Alert'></h2><h1>Z-Alert</h1>
        <div className={`profile-container ${open ? 'open' : ''} `} >
          <img
            ref={imgRef}
            onClick={handleToggle}
            src={person_icon}
            className="profile-icon"
            alt="person"
          />
          {open && (
            <div ref={menuRef} className="dropdown-menu">
              <ul className="menu-list">
                {Menus.map((menu) => (
                  <li
                    onClick={() => handleMenuClick(menu)}
                    className="menu-item"
                    key={menu.name}
                  >
                    {menu.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
                                    
      <nav className={`nav ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <ul className="nav-item">
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
          <SidebarItem to="/home" icon={home_icon} isExpanded={isExpanded}>
            Home
          </SidebarItem>
          <SidebarItem to="/parameters" icon={para_icon} isExpanded={isExpanded}>
            Parameters
          </SidebarItem>
          <SidebarItem to="/report" icon={report_icon} isExpanded={isExpanded}>
            Products Report
          </SidebarItem>
          <SidebarItem to="/chooseregister" icon={atmpos} isExpanded={isExpanded}>
            ATM & POS Registeration
          </SidebarItem>
          <SidebarItem to="/choosereport" icon={atmreport_icon} isExpanded={isExpanded}>
            ATM & POS Report
          </SidebarItem>
          <SidebarItem to="/atmcashreport" icon={atmreport_icon} isExpanded={isExpanded}>
            ATM Cash Level Report
          </SidebarItem>
          <SidebarItem to="/signup" icon={user_icon} isExpanded={isExpanded}>
            User Registeration
          </SidebarItem>
          <SidebarItem to="/settings" icon={setting_icon} isExpanded={isExpanded}>
            Settings
          </SidebarItem>
          <SidebarItem to="/help" icon={help_icon} isExpanded={isExpanded}>
            Help
          </SidebarItem>
        </ul>
      </nav>

      <div className="main-content">
        <Outlet />
      </div>
    </>
  );
}

function SidebarItem({ to, icon, isExpanded, children }) {
  const resolvedPath = useResolvedPath(to);
  const isActive = useMatch({ path: resolvedPath.pathname, end: false });

  return (
    <li className={isActive ? 'active' : ''}>
      <Link to={to}>
        <img src={icon} alt="" />
        {isExpanded && <span>{children}</span>}
      </Link>
    </li>
  );
}




export default Dashboard;
