import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./NavBar";
import "./Dashboard.css";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const Dashboard = ({ user, onLogout }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfessionalNews = async () => {
      try {
        const response = await fetch("http://164.92.157.146:8000/professional-dementia-news");
        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }
        const data = await response.json();
        setArticles(data.articles || []);
      } catch (err) {
        console.error("Error fetching professional news:", err);
        setError("Unable to load latest clinical updates at this time.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalNews();
  }, []);

  return (
    <div className="dashboard">
      <Navbar user={user} onLogout={onLogout} />

      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>
            Welcome, {user.firstName} {user.lastName}
          </h1>
          <p>Role: {user.role.toUpperCase()}</p>
        </header>

        <div className="dashboard-grid">
          <Link to="/patients" className="dashboard-card">
            <h3>Patient Profiles</h3>
            <p>View and manage patient information</p>
          </Link>


          {user.role === "admin" && (
            <Link to="/manage-users" className="dashboard-card">
              <h3>User Management</h3>
              <p>Manage staff accounts</p>
            </Link>
          )}
        </div>

        {/* Professional Dementia News Section */}
        <div className="recent-news" style={{ marginTop: "40px" }}>
          <h2 style={{ fontSize: "26px", color: "#004d99", marginBottom: "16px" }}>
            Latest Research & Clinical Updates in Dementia/Alzheimer's
          </h2>
          <p style={{ color: "#555", marginBottom: "24px", fontSize: "15px" }}>
            Curated for doctors, nurses, and healthcare professionals from peer-reviewed sources.
          </p>

          {loading && <p>Loading latest updates...</p>}

          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && !error && articles.length === 0 && (
            <p>No recent clinical updates available.</p>
          )}

          {!loading && !error && articles.length > 0 && (
            <div className="news-list">
              <ul style={{ listStyle: "none", padding: 0 }}>
                {articles.map((art, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "24px",
                      paddingBottom: "20px",
                      borderBottom:
                        index < articles.length - 1 ? "1px solid #eee" : "none",
                    }}
                  >
                    <a
                      href={art.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "19px",
                        fontWeight: "bold",
                        color: "#004d99",
                        textDecoration: "none",
                      }}
                    >
                      {art.title}
                    </a>
                    {art.source && (
                      <span style={{ fontSize: "14px", color: "#777", marginLeft: "10px" }}>
                        ({art.source})
                      </span>
                    )}
                    <p
                      style={{
                        fontSize: "15px",
                        color: "#333",
                        margin: "10px 0",
                        lineHeight: "1.5",
                      }}
                    >
                      {art.summary}
                    </p>
                    <small style={{ color: "#999" }}>{art.published}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p style={{ fontSize: "13px", color: "#999", marginTop: "32px" }}>
            Sources: ScienceDaily, Nature, NEJM Journal Watch, Alzforum, and other professional research outlets.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;