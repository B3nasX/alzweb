import React, { useEffect,useState } from "react";
import Navbar from "./NavBar";
import "./PatientsProfiles.css";
import { db } from "../firebase/config";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ChatbotWidget from "./ChatbotWidget";
const PatientProfiles = ({ user, onLogout }) => {
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  const loadPatients = async () => {
  try {
    const patientsCol = collection(db, "patient");
    const patientSnapshot = await getDocs(patientsCol);
    const patientList = patientSnapshot.docs.map((doc) => ({
      firebaseId : doc.id,
      ...doc.data(),
    }));
    setPatients(patientList);
  } catch (error) {
    console.error("Error loading patients: ", error);
  }
};
  useEffect(() => {
    loadPatients();
  }, []);

  return (
    <div className="patient-profiles">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="content">
        <header>
          <h1>Patient Profiles</h1>
          <p>Manage and view patient information</p>
        </header>

        <div className="patients-grid">
          {patients.map(patient => (
            <div key={patient.firebaseId} className="patient-card">
              <div className="patient-header">
                <h3>{patient.first_name} {patient.last_name}</h3>
              </div>
              <div className="patient-actions">
            <button className= "click-button" onClick={() => navigate(`/patient/${patient.firebaseId}`)}>View Profile</button>
              </div>
            </div>
          ))}
          {patients.length === 0 && (<p>No patients found.</p>)}
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
};

export default PatientProfiles;