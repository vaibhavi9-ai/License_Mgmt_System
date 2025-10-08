import React from "react";

const Sidebar = ({ links }) => (
  <nav className="sidebar">
    <ul>
      {links.map(link => (
        <li key={link.to}>
          <a href={link.to}>{link.label}</a>
        </li>
      ))}
    </ul>
  </nav>
);

export default Sidebar;
