import React from "react";

const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="loading-spinner">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">{text}</span>
    </div>
  </div>
);

export default LoadingSpinner;
