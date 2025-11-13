import React from 'react';

const Pipelines: React.FC = () => {
  return (
    <div className="module-content">
      <h2>Pipelines Module</h2>
      <div className="pipelines-container">
        <div className="pipeline-card">
          <h3>CI/CD Pipeline</h3>
          <p>Continuous Integration and Deployment pipeline configuration</p>
          <div className="pipeline-status active">Active</div>
        </div>
        
        <div className="pipeline-card">
          <h3>Data Pipeline</h3>
          <p>ETL and data processing pipeline management</p>
          <div className="pipeline-status pending">Pending</div>
        </div>
        
        <div className="pipeline-card">
          <h3>ML Pipeline</h3>
          <p>Machine learning model training and deployment</p>
          <div className="pipeline-status inactive">Inactive</div>
        </div>
        
        <div className="pipeline-card">
          <h3>Security Pipeline</h3>
          <p>Security scanning and vulnerability assessment</p>
          <div className="pipeline-status active">Active</div>
        </div>
      </div>
    </div>
  );
};

export default Pipelines; 