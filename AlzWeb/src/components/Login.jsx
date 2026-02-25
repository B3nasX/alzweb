import React, { useState } from "react";
import { collection,doc, getDoc} from "firebase/firestore";
import { db ,auth } from "../firebase/config"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";
import logo from "../assets/beaslogo.png";


const Login = ({ onLogin }) => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");


  const admin = {
    id: "admin",
    password: "admin",
    name: "Admin",
    role: "admin",
    email: "admin@hospital.com"
  };

  const handleIdChange = (e) => {
    setId(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (id === admin.id && password === admin.password) {
        onLogin(admin);
        return;
      }
     let EmailToUse = id;
     let profileData = null;
     if (!id.includes("@")) {
      const gpRef = doc(db, "gp", id);
      const gpSnap = await getDoc(gpRef);

      if (!gpSnap.exists) {
        alert("User not found for this ID.");
        return;
      }
      profileData = gpSnap.data();
      EmailToUse = profileData.email;
      if (!EmailToUse) {
        alert("Email not found for this ID.");
        return;
      }
     }

     const userCredential = await signInWithEmailAndPassword(
        auth,
        EmailToUse,
        password
      );
      const user = userCredential.user;
      const uid = user.uid;

      if (!profileData) {
        const gpRef = doc(db, "gp", uid);
        const gpSnap = await getDoc(gpRef);
        if (!gpSnap.exists) {
          alert("Gp profile not found.");
          return;
        }
        profileData = gpSnap.data();
      }
      const firstName = profileData.first_name || "";
      const lastName = profileData.last_name || "";
      const role = profileData.role || "";
      onLogin({
        uid,
        gpId : uid,
        firstName,
        lastName,
        role: profileData.role,
        email: user.email
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === "auth/user-not-found") {
        alert("User not found.");
      } else if (error.code === "auth/wrong-password") {
        alert("Incorrect password.");
        } else if (error.code === "auth/invalid-email") {
        alert("Invalid email format.");
        } else if (error.code === "auth/invalid-credentials") {
        alert("Invalid credentials provided.");
      } else {
        alert("Login failed. Please try again.");
      }
    }
    };
  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Welcome to Bea's Clinic Website!</h2>
        <img src={logo} alt="Bea's Clinic Logo" className="login-logo" />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="text"
              name="id"
              value={id}
              onChange={handleIdChange}
              placeholder="Enter your Email"
              required         
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;