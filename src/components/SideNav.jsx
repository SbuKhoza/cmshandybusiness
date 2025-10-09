// src/components/SideNav.js
import React from "react";
import { Link } from "react-router-dom";

function SideNav() {
  return (
    <nav style={{ width: "200px", background: "#f4f4f4", padding: "20px" }}>
      <h2>SideNav</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/projects">Projects</Link></li>
        <li><Link to="/auth">Log out</Link></li>
        <li><Link to="/servicecms">Services</Link></li>
        <li><Link to="/navbarcms">Nav</Link></li>
      </ul>
    </nav>
  );
}

export default SideNav;
