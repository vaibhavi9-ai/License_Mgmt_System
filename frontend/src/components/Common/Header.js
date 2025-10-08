import React from "react";
const Header = ({ title }) => (
  <header className="py-3 bg-primary text-white mb-4">
    <div className="container">
      <h1>{title}</h1>
    </div>
  </header>
);
export default Header;
