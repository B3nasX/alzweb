import React from 'react';
import './footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Contact Information</h3>
          <div className="contact-info">
            <div className="contact-item">
              <svg className="contact-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span className="contact-text">Phone: 087 777 6767</span>
            </div>
            
            <div className="contact-item">
              <svg className="contact-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <span className="contact-text">Email: beasclinic@support.com</span>
            </div>
          </div>
        </div>
        
        
        
        </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Bea's Clinic. All rights reserved.</p>
        <p className="names">Emily, Aubrey, Sean, Benas</p>
      </div>
    </footer>
  );
};

export default Footer;