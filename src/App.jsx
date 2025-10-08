// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SideNav from "./components/SideNav";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Auth from "./components/Auth";
import Servicescms from "./pages/Servicescms";


function App() {
  return (
    <Router>
      <div style={{ display: "flex" }}>
        <SideNav />
        <div style={{ flex: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/servicecms" element={<Servicescms />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;