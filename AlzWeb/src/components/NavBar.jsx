import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./NavBar.css";
import logo from "../assets/beaslogo.png";

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <img src={logo} alt="Bea's Clinic Logo" className="nav-logo" />
        <h2>Bea's Clinic</h2>
        <img src={logo} alt="Bea's Clinic Logo" className="nav-logo" />
      </div>

      <div className={`nav-links ${isMenuOpen ? "nav-links-active" : ""}`}>
        <Link 
          to="/dashboard" 
          className={location.pathname === "/dashboard" ? "active" : ""}
        >
          Dashboard
        </Link>
        <Link 
          to="/patients" 
          className={location.pathname === "/patients" ? "active" : ""}
        >
          Patients
        </Link>
  
        <Link 
          to="/settings" 
          className={location.pathname === "/settings" ? "active" : ""}
        >
          Settings
        </Link>
      </div>

      <div className="nav-user">
        <span>{user.firstName}</span>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      
    </nav>
  );
};

export default Navbar;