import React, { useEffect, useState } from "react";
import Navbar from "./NavBar";
import "./patient.css";
import { db } from "../firebase/config";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import ChatbotWidget from "./ChatbotWidget";
import { Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const PatientProfile = ({ user, onLogout }) => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [gpAssessments, setGpAssessments] = useState([]);
  const [mobileAssessments, setMobileAssessments] = useState([]);
  const [loadingGpAssessments, setLoadingGpAssessments] = useState(true);
  const [loadingMobileAssessments, setLoadingMobileAssessments] = useState(true);
  const [editingGpAssessment, setEditingGpAssessment] = useState(null);
  const [editingMobileAssessment, setEditingMobileAssessment] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("gp");
  
  const loadPatient = async () => {
    try {
      const patientDoc = doc(db, "patient", id);
      const patientSnapshot = await getDoc(patientDoc);

      if (!patientSnapshot.exists()) {
        console.error("No such patient!");
        return;
      }
      const patientData = { firebaseId: patientSnapshot.id, ...patientSnapshot.data() };
      setPatient(patientData);
      
      if (patientData.patient_ID) {
        await loadGpAssessments(patientData.patient_ID);
        await loadMobileAssessments(patientData.patient_ID);
      }
    } catch (error) {
      console.error("Error loading patient: ", error);
    }
  };

  const loadGpAssessments = async (patientId) => {
    try {
      setLoadingGpAssessments(true);
      const assessmentsRef = collection(db, "gp_assessment");
      const q = query(assessmentsRef, where("patient_ID", "==", patientId));
      
      const querySnapshot = await getDocs(q);
      const assessmentsData = [];
      
      querySnapshot.forEach((doc) => {
        assessmentsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      assessmentsData.sort((a, b) => {
        const dateA = a.date?.seconds || 0;
        const dateB = b.date?.seconds || 0;
        return dateA - dateB; // Sort chronologically for progression view
      });
      
      setGpAssessments(assessmentsData);
    } catch (error) {
      console.error("Error loading GP assessments: ", error);
    } finally {
      setLoadingGpAssessments(false);
    }
  };

  const loadMobileAssessments = async (patientId) => {
    try {
      setLoadingMobileAssessments(true);
      const assessmentsRef = collection(db, "mobile_assessment");
      const q = query(assessmentsRef, where("patient_ID", "==", patientId));
      
      const querySnapshot = await getDocs(q);
      const assessmentsData = [];
      
      querySnapshot.forEach((doc) => {
        assessmentsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      assessmentsData.sort((a, b) => {
        const dateA = a.date?.seconds || 0;
        const dateB = b.date?.seconds || 0;
        return dateA - dateB; // Sort chronologically for progression view
      });
      
      setMobileAssessments(assessmentsData);
    } catch (error) {
      console.error("Error loading Mobile assessments: ", error);
    } finally {
      setLoadingMobileAssessments(false);
    }
  };

  const startEditingGp = (assessment) => {
    setEditingGpAssessment(assessment.id);
    setEditedValues({});
  };

  const startEditingMobile = (assessment) => {
    setEditingMobileAssessment(assessment.id);
    setEditedValues({});
  };

  const cancelEditing = () => {
    setEditingGpAssessment(null);
    setEditingMobileAssessment(null);
    setEditedValues({});
  };

  const handleValueChange = (field, value) => {
    setEditedValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveGpAssessment = async (assessmentId) => {
    await saveAssessment(assessmentId, "gp_assessment", gpAssessments, setGpAssessments);
  };

  const saveMobileAssessment = async (assessmentId) => {
    await saveAssessment(assessmentId, "mobile_assessment", mobileAssessments, setMobileAssessments);
  };

  const saveAssessment = async (assessmentId, collectionName, assessments, setAssessments) => {
    if (Object.keys(editedValues).length === 0) {
      cancelEditing();
      return;
    }

    try {
      setIsSaving(true);
      const assessmentRef = doc(db, collectionName, assessmentId);
      await updateDoc(assessmentRef, editedValues);
      
      setAssessments(prev => prev.map(assessment => {
        if (assessment.id === assessmentId) {
          return { ...assessment, ...editedValues };
        }
        return assessment;
      }));
      
      alert("Assessment updated successfully!");
      cancelEditing();
    } catch (error) {
      console.error("Error updating assessment:", error);
      alert("Error updating assessment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatFieldName = (field) => {
    return field
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, str => str.toUpperCase())
      .replace(/Apoe ε4/i, "APOE ε4");
  };

  const getFieldType = (field, value) => {
    if (field.includes("date")) return "date";
    if (field.includes("age") || field.includes("score") || field.includes("rate") || field.includes("weight") || field.includes("temperature")) return "number";
    if (field.includes("dementia") || field.includes("diabetic") || field.includes("depression") || field.includes("family_history") || field.includes("medication_history")) return "boolean";
    if (field.includes("email")) return "email";
    return "text";
  };

  // Function to create pie chart data for test_Score
  const createTestScoreChartData = (assessment) => {
    const testScore = assessment.test_Score || 0;
    const maxScore = assessment.max_score || 100;
    
    const remaining = maxScore - testScore;
    
    // colour change based on patients score
    const percentage = (testScore / maxScore) * 100;
    let backgroundColor;
    if (percentage >= 80) backgroundColor = "#27ae60";
    else if (percentage >= 60) backgroundColor = "#f39c12";
    else backgroundColor = "#e74c3c";
    
    return {
      labels: ["Correct Answers", "Wrong Answers"],
      datasets: [
        {
          label: "Test Score",
          data: [testScore, remaining],
          backgroundColor: [backgroundColor, "#ecf0f1"],
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    };
  };

  // Function to create line chart data for test score progression
  const createTestScoreProgressionData = () => {
    const validAssessments = mobileAssessments.filter(assessment => 
      (assessment.test_Score !== undefined || assessment.test_score !== undefined) && 
      assessment.date
    );
    
    if (validAssessments.length === 0) return null;
    
    // Sort chronologically
    validAssessments.sort((a, b) => {
      const dateA = a.date?.seconds || 0;
      const dateB = b.date?.seconds || 0;
      return dateA - dateB;
    });
    
    const labels = validAssessments.map((assessment, index) => {
      if (assessment.date) {
        const date = new Date(assessment.date.seconds * 1000);
        return `Assessment ${index + 1}\n${date.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric",
          year: "numeric"
        })}`;
      }
      return `Assessment ${index + 1}`;
    });
    
    const scores = validAssessments.map(assessment => 
      assessment.test_Score || assessment.test_score || 0
    );
    
    const maxScores = validAssessments.map(assessment => 
      assessment.max_score || 100
    );
    
    // Determine  color
    const getTrendColor = () => {
      if (scores.length < 2) return "#3498db";
      const firstScore = scores[0];
      const lastScore = scores[scores.length - 1];
      return lastScore >= firstScore ? "#27ae60" : "#e74c3c";
    };
    
    const trendColor = getTrendColor();
    
    return {
      labels,
      datasets: [
        {
          label: "Test Score",
          data: scores,
          borderColor: trendColor,
          backgroundColor: trendColor + "20", // 20% opacity
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: trendColor,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    };
  };

  // Line chart options 
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const assessment = mobileAssessments[context.dataIndex];
            const maxScore = assessment?.max_score || 100;
            return `Score: ${context.raw}/${maxScore}`;
          },
          afterLabel: function(context) {
            const assessment = mobileAssessments[context.dataIndex];
            const score = assessment?.test_Score || assessment?.test_score || 0;
            const maxScore = assessment?.max_score || 100;
            const percentage = Math.round((score / maxScore) * 100);
            return `Percentage: ${percentage}%`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Assessment Timeline",
        },
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0)"
        }
      },
      y: {
        title: {
          display: true,
          text: "Test Score",
        },
        min: 0,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0)"
        }
      }
    }
  };

  // Pie chart
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 12
          },
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  useEffect(() => {
    loadPatient();
  }, [id]);

  if (!patient) {
    return <p>Loading patient data...</p>;
  }

  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      <div className="patient-profile">
        <header>
          <h1 className="patient-name">
            {patient.first_name} {patient.last_name}
          </h1>
          <h3 id="patient-details">Patient Details</h3>
        </header>
        <div className="patient-info">    
          <p><strong>Email:</strong> {patient.email}</p>
          <p><strong>GP ID:</strong> {patient.gp_ID}</p>
          <p><strong>Patient ID:</strong> {patient.patient_ID}</p>
          <p><strong>UID:</strong> {patient.UID}</p>
        </div>
        
        {/* Assessment Type Toggle */}
        <div className="assessment-type-toggle">
          <button 
            className={`toggle-button ${activeSection === "gp" ? "active" : ""}`}
            onClick={() => setActiveSection("gp")}
          >
            GP Assessments ({gpAssessments.length})
          </button>
          <button 
            className={`toggle-button ${activeSection === "mobile" ? "active" : ""}`}
            onClick={() => setActiveSection("mobile")}
          >
            Mobile Assessments ({mobileAssessments.length})
          </button>
        </div>
        
        {/* GP Assessments Section */}
        {activeSection === "gp" && (
          <div className="assessments-section">
            <h3>GP Assessments ({gpAssessments.length})</h3>
            
            {gpAssessments.map((assessment, index) => (
              <div key={assessment.id || index} className="assessment-card">
                <div className="assessment-header">
                  <div>
                    <h4>GP Assessment #{index + 1}</h4>
                    <span className="assessment-date">
                      {assessment.date ? new Date(assessment.date.seconds * 1000).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      }) : "No date"}
                    </span>
                  </div>
                  <div className="assessment-actions">
                    {editingGpAssessment === assessment.id ? (
                      <>
                        <button 
                          className="save-button" 
                          onClick={() => saveGpAssessment(assessment.id)}
                          disabled={isSaving}
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                        <button 
                          className="cancel-button" 
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        className="edit-button" 
                        onClick={() => startEditingGp(assessment)}
                      >
                        Edit Assessment
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="assessment-details">
                  {/* Editable Fields Section */}
                  {editingGpAssessment === assessment.id && (
                    <div className="edit-fields-section">
                      <h5>Edit Missing/Incomplete Fields</h5>
                      <div className="edit-fields-grid">
                        {Object.entries(assessment).map(([field, value]) => {
                          if (field === "id" || field === "date" || field === "firebaseId" || field === "patient_ID") return null;
                          
                          const isEmpty = 
                            value === undefined || 
                            value === null || 
                            value === "" || 
                            (typeof value === "number" && value === 0) ||
                            (typeof value === "string" && value.trim() === "");
                          
                          if (!isEmpty) return null;
                          
                          const fieldType = getFieldType(field, value);
                          const fieldName = formatFieldName(field);
                          const currentValue = editedValues[field] !== undefined ? editedValues[field] : "";
                          
                          return (
                            <div key={field} className="edit-field">
                              <label htmlFor={`gp-${assessment.id}-${field}`}>
                                {fieldName}:
                              </label>
                              {fieldType === "boolean" ? (
                                <select
                                  id={`gp-${assessment.id}-${field}`}
                                  value={currentValue}
                                  onChange={(e) => handleValueChange(field, e.target.value === "true")}
                                >
                                  <option value="">Select...</option>
                                  <option value="true">Yes</option>
                                  <option value="false">No</option>
                                </select>
                              ) : fieldType === "number" ? (
                                <input
                                  type="number"
                                  id={`gp-${assessment.id}-${field}`}
                                  value={currentValue}
                                  onChange={(e) => handleValueChange(field, parseFloat(e.target.value))}
                                  placeholder={`Enter ${fieldName.toLowerCase()}`}
                                />
                              ) : (
                                <input
                                  type="text"
                                  id={`gp-${assessment.id}-${field}`}
                                  value={currentValue}
                                  onChange={(e) => handleValueChange(field, e.target.value)}
                                  placeholder={`Enter ${fieldName.toLowerCase()}`}
                                />
                              )}
                            </div>
                          );
                        })}
                        
                        {Object.keys(editedValues).length === 0 && (
                          <p className="no-empty-fields">All fields are complete for this assessment.</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Display Assessment Data - Grouped into Boxes */}
                  <div className="gp-assessment-details">
                    {/* Health Metrics Box */}
                    <div className="gp-box gp-metrics-box">
                    <div className="gp-box-header">
                        <h5>
                          <i className="bi bi-heart-pulse me-2"></i>
                          Health Metrics
                        </h5>
                      </div>
                      <div className="gp-box-content">
                        <div className="gp-field">
                          <span className="gp-field-label">Age:</span>
                          <span className="gp-field-value">
                            {assessment.age || <span className="missing-value">Missing</span>}
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Heart Rate:</span>
                          <span className="gp-field-value">
                            {assessment.heart_rate || <span className="missing-value">Missing</span>} bpm
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Body Temperature:</span>
                          <span className="gp-field-value">
                            {assessment.body_temperature || <span className="missing-value">Missing</span>}°C
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Blood Oxygen:</span>
                          <span className="gp-field-value">
                            {assessment.blood_oxygen_level || <span className="missing-value">Missing</span>}%
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Weight:</span>
                          <span className="gp-field-value">
                            {assessment.weight || <span className="missing-value">Missing</span>} kg
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Medical Information Box */}
                    <div className="gp-box gp-medical-box">
                      <div className="gp-box-header">
                        <h5>
                          <i className="bi bi-clipboard-pulse me-2"></i>
                          Medical Information
                        </h5>
                      </div>
                      <div className="gp-box-content">
                        <div className="gp-field">
                          <span className="gp-field-label">APOE ε4:</span>
                          <span className={`gp-field-value ${assessment.APOE_ε4 === "Positive" ? "status-positive" : "status-negative"}`}>
                            {assessment.APOE_ε4 || "N/A"}
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Dementia:</span>
                          <span className={`gp-field-value ${assessment.dementia ? "status-positive" : "status-negative"}`}>
                            {assessment.dementia !== undefined ? (assessment.dementia ? "Yes" : "No") : "N/A"}
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Depression:</span>
                          <span className={`gp-field-value ${assessment.depression_status ? "status-positive" : "status-negative"}`}>
                            {assessment.depression_status !== undefined ? (assessment.depression_status ? "Yes" : "No") : "N/A"}
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Diabetic:</span>
                          <span className={`gp-field-value ${assessment.diabetic ? "status-positive" : "status-negative"}`}>
                            {assessment.diabetic !== undefined ? (assessment.diabetic ? "Yes" : "No") : "N/A"}
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Gender:</span>
                          <span className="gp-field-value">{assessment.gender || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cognitive & Lifestyle Box */}
                    <div className="gp-box gp-cognitive-box">
                      <div className="gp-box-header">
                        <h5>
                          <i className="bi bi-brain me-2"></i>
                          Cognitive & Lifestyle
                        </h5>
                      </div>
                      <div className="gp-box-content">
                        <div className="gp-field">
                          <span className="gp-field-label">Cognitive Score:</span>
                          <span className={`gp-field-value ${assessment.cognitive_test_scores < 5 ? "score-low" : "score-normal"}`}>
                            {assessment.cognitive_test_scores || "N/A"}/10
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Alcohol Level:</span>
                          <span className="gp-field-value">{assessment.alcohol_level || "N/A"}</span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Sleep Quality:</span>
                          <span className="gp-field-value">{assessment.sleep_quality || "N/A"}</span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Physical Activity:</span>
                          <span className="gp-field-value">{assessment.physical_activity || "N/A"}</span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Smoking Status:</span>
                          <span className="gp-field-value">{assessment.smoking_status || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Details Box */}
                    <div className="gp-box gp-additional-box">
                      <div className="gp-box-header">
                        <h5>
                          <i className="bi bi-info-circle me-2"></i>
                          Additional Details
                        </h5>
                      </div>
                      <div className="gp-box-content">
                        <div className="gp-field">
                          <span className="gp-field-label">Chronic Conditions:</span>
                          <span className="gp-field-value">{assessment.chronic_health_conditions || "N/A"}</span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Medication History:</span>
                          <span className="gp-field-value">
                            {assessment.medication_history !== undefined ? (assessment.medication_history ? "Yes" : "No") : "N/A"}
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Family History:</span>
                          <span className="gp-field-value">
                            {assessment.family_history !== undefined ? (assessment.family_history ? "Yes" : "No") : "N/A"}
                          </span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Nutrition Diet:</span>
                          <span className="gp-field-value">{assessment.nutrition_diet || "N/A"}</span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Education Level:</span>
                          <span className="gp-field-value">{assessment.education_level || "N/A"}</span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">Dominant Hand:</span>
                          <span className="gp-field-value">{assessment.dominant_hand || "N/A"}</span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">MRI Delay:</span>
                          <span className="gp-field-value">{assessment.mri_delay || "N/A"}</span>
                        </div>
                        <div className="gp-field">
                          <span className="gp-field-label">GP Assess ID:</span>
                          <span className="gp-field-value">{assessment.gpassess_ID || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Prescription Box (Conditional) */}
                    {(assessment.prescription || assessment.dosage) && (
                      <div className="gp-box gp-prescription-box">
                        <div className="gp-box-header">
                          <h5>
                            <i className="bi bi-prescription2 me-2"></i>
                            Prescription
                          </h5>
                        </div>
                        <div className="gp-box-content">
                          <div className="gp-field">
                            <span className="gp-field-label">Medication:</span>
                            <span className="gp-field-value">{assessment.prescription || "N/A"}</span>
                          </div>
                          <div className="gp-field">
                            <span className="gp-field-label">Dosage:</span>
                            <span className="gp-field-value">{assessment.dosage || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Mobile Assessments Section */}
        {activeSection === "mobile" && (
          <div className="assessments-section">
            <h3>Mobile Assessments ({mobileAssessments.length})</h3>
            
            {/* Test Score Progression Chart */}
            {(() => {
              const progressionData = createTestScoreProgressionData();
              const hasTestScores = mobileAssessments.some(assessment => 
                assessment.test_Score !== undefined || assessment.test_score !== undefined
              );
              
              if (hasTestScores && progressionData) {
                // Calculate change from first to last
                const scores = progressionData.datasets[0].data;
                const firstScore = scores[0];
                const lastScore = scores[scores.length - 1];
                const scoreChange = lastScore - firstScore;
                const percentageChange = firstScore > 0 ? Math.round((scoreChange / firstScore) * 100) : 0;
                
                return (
                  <div className="assessment-card mb-4">
                    <div className="assessment-header">
                      <div>
                        <h4>
                          <i className="bi bi-graph-up me-2"></i>
                          Test Score Progression
                        </h4>
                        <span className="assessment-date">
                          {scores.length} assessments tracked over time
                        </span>
                      </div>
                    </div>
                    <div className="test-score-chart-container" style={{ height: "300px" }}>
                      <Line 
                        data={progressionData} 
                        options={lineChartOptions}
                      />
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-3">
                        <div className="card bg-light border-0">
                          <div className="card-body text-center">
                            <h6 className="card-title text-muted small">Assessments</h6>
                            <h3 className="text-primary">{scores.length}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-light border-0">
                          <div className="card-body text-center">
                            <h6 className="card-title text-muted small">First Score</h6>
                            <h3 className="text-info">{firstScore}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-light border-0">
                          <div className="card-body text-center">
                            <h6 className="card-title text-muted small">Latest Score</h6>
                            <h3 className="text-success">{lastScore}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-light border-0">
                          <div className="card-body text-center">
                            <h6 className="card-title text-muted small">Change</h6>
                            <h3 className={scoreChange >= 0 ? "text-success" : "text-danger"}>
                              {scoreChange >= 0 ? "+" : ""}{scoreChange} 
                              <small className="d-block text-muted">{percentageChange >= 0 ? "+" : ""}{percentageChange}%</small>
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else if (hasTestScores) {
                return (
                  <div className="alert alert-info mb-4">
                    <i className="bi bi-info-circle me-2"></i>
                    Test scores are available but need date information to show progression timeline.
                  </div>
                );
              }
              return null;
            })()}
            
            {loadingMobileAssessments ? (
              <p>Loading mobile assessments...</p>
            ) : mobileAssessments.length === 0 ? (
              <p>No mobile assessments found for this patient.</p>
            ) : (
              <div className="assessments-list">
                {mobileAssessments.map((assessment, index) => (
                  <div key={assessment.id || index} className="assessment-card">
                    <div className="assessment-header">
                      <div>
                        <h4>Mobile Assessment #{index + 1}</h4>
                        <span className="assessment-date">
                          {assessment.date ? new Date(assessment.date.seconds * 1000).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          }) : "No date"}
                        </span>
                      </div>
                      <div className="assessment-actions">
                        {editingMobileAssessment === assessment.id ? (
                          <>
                            <button 
                              className="btn btn-success btn-sm" 
                              onClick={() => saveMobileAssessment(assessment.id)}
                              disabled={isSaving}
                            >
                              {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={cancelEditing}
                              disabled={isSaving}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => startEditingMobile(assessment)}
                          >
                            Edit Assessment
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="row">
                      {/* Test Score Pie Chart Column */}
                      {(assessment.test_Score !== undefined || assessment.test_score !== undefined) && (
                        <div className="col-md-4 mb-3">
                          <div className="card h-100">
                            <div className="card-header bg-info text-white">
                              <h5 className="mb-0">
                                <i className="bi bi-pie-chart me-2"></i>
                                Test Score Visualization
                              </h5>
                            </div>
                            <div className="card-body d-flex flex-column">
                              <div style={{ height: "250px", position: "relative" }}>
                                <Pie 
                                  data={createTestScoreChartData({
                                    ...assessment,
                                    test_Score: assessment.test_Score || assessment.test_score,
                                    max_score: assessment.max_score || 100
                                  })} 
                                  options={pieChartOptions}
                                />
                              </div>
                              <div className="mt-3">
                                <h6 className="text-center">
                                  Score: <strong>{assessment.test_Score || assessment.test_score || 0}</strong> / {assessment.max_score || 100}
                                </h6>
                                <div className="progress mt-2" style={{ height: "10px" }}>
                                  <div 
                                    className="progress-bar" 
                                    role="progressbar" 
                                    style={{ 
                                      width: `${((assessment.test_Score || assessment.test_score || 0) / (assessment.max_score || 100)) * 100}%`,
                                      backgroundColor: createTestScoreChartData({
                                        ...assessment,
                                        test_Score: assessment.test_Score || assessment.test_score,
                                        max_score: assessment.max_score || 100
                                      }).datasets[0].backgroundColor[0]
                                    }}
                                    aria-valuenow={assessment.test_Score || assessment.test_score || 0}
                                    aria-valuemin="0"
                                    aria-valuemax={assessment.max_score || 100}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Assessment Details Column */}
                      <div className={`${(assessment.test_Score !== undefined || assessment.test_score !== undefined) ? "col-md-8" : "col-12"}`}>
                        <div className="card h-100">
                          <div className="card-header bg-light">
                            <h5 className="mb-0">Assessment Details</h5>
                          </div>
                          <div className="card-body">
                            {/* Editable Fields Section */}
                            {editingMobileAssessment === assessment.id && (
                              <div className="edit-fields-section mb-4 p-3 border rounded bg-light">
                                <h5 className="text-primary">
                                  <i className="bi bi-pencil-square me-2"></i>
                                  Edit Missing/Incomplete Fields
                                </h5>
                                <div className="row g-3 mt-2">
                                  {Object.entries(assessment).map(([field, value]) => {
                                    if (field === "id" || field === "date" || field === "firebaseId" || field === "test_Score" || field === "test_score") return null;
                                    
                                    const isEmpty = 
                                      value === undefined || 
                                      value === null || 
                                      value === "" || 
                                      (typeof value === "number" && value === 0) ||
                                      (typeof value === "string" && value.trim() === "");
                                    
                                    if (!isEmpty) return null;
                                    
                                    const fieldType = getFieldType(field, value);
                                    const fieldName = formatFieldName(field);
                                    const currentValue = editedValues[field] !== undefined ? editedValues[field] : "";
                                    
                                    return (
                                      <div key={field} className="col-md-6">
                                        <div className="mb-3">
                                          <label htmlFor={`mobile-${assessment.id}-${field}`} className="form-label">
                                            {fieldName}
                                          </label>
                                          {fieldType === "boolean" ? (
                                            <select
                                              id={`mobile-${assessment.id}-${field}`}
                                              className="form-select"
                                              value={currentValue}
                                              onChange={(e) => handleValueChange(field, e.target.value === "true")}
                                            >
                                              <option value="">Select...</option>
                                              <option value="true">Yes</option>
                                              <option value="false">No</option>
                                            </select>
                                          ) : fieldType === "number" ? (
                                            <input
                                              type="number"
                                              id={`mobile-${assessment.id}-${field}`}
                                              className="form-control"
                                              value={currentValue}
                                              onChange={(e) => handleValueChange(field, parseFloat(e.target.value))}
                                              placeholder={`Enter ${fieldName.toLowerCase()}`}
                                            />
                                          ) : (
                                            <input
                                              type="text"
                                              id={`mobile-${assessment.id}-${field}`}
                                              className="form-control"
                                              value={currentValue}
                                              onChange={(e) => handleValueChange(field, e.target.value)}
                                              placeholder={`Enter ${fieldName.toLowerCase()}`}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  
                                  {Object.keys(editedValues).length === 0 && (
                                    <div className="col-12">
                                      <div className="alert alert-success">
                                        <i className="bi bi-check-circle me-2"></i>
                                        All fields are complete for this assessment.
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Display Assessment Data */}
                            <div className="row g-3">
                              {Object.entries(assessment).map(([field, value]) => {
                                if (field === "id" || field === "date" || field === "firebaseId" || field === "test_Score" || field === "test_score") return null;
                                
                                const fieldName = formatFieldName(field);
                                
                                return (
                                  <div key={field} className="col-md-6 col-lg-4">
                                    <div className="field-item card h-100">
                                      <div className="card-body p-3">
                                        <h6 className="card-subtitle mb-1 text-muted small">
                                          {fieldName}
                                        </h6>
                                        <p className="card-text">
                                          {value === undefined || value === null || value === "" 
                                            ? <span className="badge bg-danger">Missing</span>
                                            : typeof value === "boolean"
                                              ? <span className={`badge ${value ? "bg-success" : "bg-secondary"}`}>
                                                  {value ? "Yes" : "No"}
                                                </span>
                                              : <span className="text-dark">{value.toString()}</span>
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Test Score Details (if exists but not in pie chart column) */}
                            {(assessment.test_Score !== undefined || assessment.test_score !== undefined) && (
                              <div className="row mt-3">
                                <div className="col-12">
                                  <div className="card bg-light">
                                    <div className="card-body">
                                      <h6 className="card-title">
                                        <i className="bi bi-clipboard-data me-2"></i>
                                        Test Score Details
                                      </h6>
                                      <div className="row">
                                        <div className="col-md-4">
                                          <p className="mb-1"><strong>Test Score:</strong></p>
                                          <h4 className="text-primary">
                                            {assessment.test_Score || assessment.test_score || 0}
                                          </h4>
                                        </div>
                                        <div className="col-md-4">
                                          <p className="mb-1"><strong>Max Score:</strong></p>
                                          <h4 className="text-secondary">
                                            {assessment.max_score || 100}
                                          </h4>
                                        </div>
                                        <div className="col-md-4">
                                          <p className="mb-1"><strong>Percentage:</strong></p>
                                          <h4 className="text-info">
                                            {Math.round(((assessment.test_Score || assessment.test_score || 0) / (assessment.max_score || 100)) * 100)}%
                                          </h4>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <button className="btn btn-secondary back-button" onClick={() => window.history.back()}>
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </button>
        <ChatbotWidget />
      </div>
    </>
  );
};

export default PatientProfile;