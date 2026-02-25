import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavBar";
import "./Settings.css";
import { auth, db } from "../firebase/config";
import { 
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

const Settings = ({ user, onLogout }) => {
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      alert("Please enter a new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      // Update password in Firebase Authentication
      await updatePassword(auth.currentUser, newPassword);

      alert("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error("Error changing password:", error);
      
      if (error.code === "auth/weak-password") {
        alert("Password is too weak. Use at least 6 characters.");
      } else if (error.code === "auth/requires-recent-login") {
        alert("Session expired. Please log out and log in again before changing password.");
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleCustomizeClick = () => {
    setIsCustomizeOpen(!isCustomizeOpen);
    setIsEditProfileOpen(false);
  };

  const handleEditProfileClick = () => {
    setIsEditProfileOpen(!isEditProfileOpen);
    setIsCustomizeOpen(false);
  };

  const handlePrimaryCardClick = () => {
    if (isAdmin) {
      navigate("/manage-users");
    } else {
      handleEditProfileClick();
    }
  };

  const closeEditProfile = () => {
    setIsEditProfileOpen(false);
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="settings">
      <Navbar user={user} onLogout={onLogout} />

      <div className="content">
        <header>
          <h1>Settings</h1>
          <p>Manage your preferences</p>
        </header>

        <div className="settings-grid">
          <div className="setting-card">
            <h3>{isAdmin ? "Manage User Accounts" : "Profile Settings"}</h3>
            <p>
              {isAdmin
                ? "View and manage staff accounts"
                : "Update your personal information"}
            </p>

            <button className="open-button" onClick={handlePrimaryCardClick}>
              {isAdmin ? "Open User Management" : "Edit Profile"}
            </button>

            {!isAdmin && isEditProfileOpen && (
              <div className="edit-box">
                <div className="edit-box-header">
                  <h2>Edit Profile</h2>
                  <button
                    className="close-button"
                    onClick={closeEditProfile}
                  >
                    Close
                  </button>
                </div>
                
                <h3>Change Password</h3>
                
                <div className="form-group">
                  <label htmlFor="newPassword">
                    New Password (min 6 characters):
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  
                  <label htmlFor="confirmPassword">
                    Confirm New Password:
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  
                  <button 
                    onClick={handleChangePassword}
                    className="change-password-btn"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="setting-card">
            <h3>Customize</h3>
            <p>Adjust your dashboard preferences</p>

            <button className="customize-button" onClick={handleCustomizeClick}>
              Customize
            </button>

            {isCustomizeOpen && (
              <button
                className="close-button"
                onClick={() => setIsCustomizeOpen(false)}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;