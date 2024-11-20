import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import Transaction from './Transaction';
import Storage from './Storage';
import Login from './Login'; 
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        
        <Routes>
          <Route path="/" element={<Login />} /> 
          <Route path="/home" element={<Home />} /> 
          <Route path="/transaction" element={<Transaction />} />
          <Route path="/storage" element={<Storage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;