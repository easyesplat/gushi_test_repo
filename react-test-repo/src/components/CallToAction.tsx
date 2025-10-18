import React from 'react'

const CallToAction: React.FC = () => {
  return (
    <section className="cta section">
      <div className="container">
        <div className="cta-content">
          <div className="cta-text">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-description">
              Join thousands of developers who are already building amazing things. 
              Start your journey today with our free trial.
            </p>
          </div>
          <div className="cta-actions">
            <a href="#signup" className="btn btn-primary btn-large">
              Start Free Trial
            </a>
            <a href="#contact" className="btn btn-secondary btn-large">
              Contact Sales
            </a>
          </div>
        </div>
        
        <div className="cta-stats">
          <div className="stat">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
          <div className="stat">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Support</div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .cta {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        .cta::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
          opacity: 0.3;
        }
        
        .cta-content {
          text-align: center;
          margin-bottom: 60px;
          position: relative;
          z-index: 1;
        }
        
        .cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          background: linear-gradient(45deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .cta-description {
          font-size: 1.2rem;
          opacity: 0.9;
          margin-bottom: 40px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }
        
        .cta-actions {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .btn-large {
          padding: 16px 32px;
          font-size: 1.1rem;
        }
        
        .cta-stats {
          display: flex;
          justify-content: center;
          gap: 60px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        
        .stat {
          text-align: center;
        }
        
        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #667eea;
          margin-bottom: 8px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .stat-label {
          font-size: 1rem;
          opacity: 0.8;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .cta-title {
            font-size: 2rem;
          }
          
          .cta-description {
            font-size: 1.1rem;
          }
          
          .cta-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .cta-stats {
            gap: 40px;
          }
          
          .stat-number {
            font-size: 2rem;
          }
        }
      `}</style>
    </section>
  )
}

export default CallToAction
