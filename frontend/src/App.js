import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Timesheet from "./components/Timesheet";
import NewTimesheetEntry from "./components/NewTimesheetEntry"; 
import "./App.css";
import logo from './assets/logo.png'; // Add logo path

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} alt="Iceapple Logo" className="App-logo" />
        <h1>Iceapple Timesheet</h1>
        <Link to="/new-timesheet">
          <button className="btn-primary">New Timesheet Entry</button>
        </Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Timesheet />} />
          <Route path="/new-timesheet" element={<NewTimesheetEntry />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;