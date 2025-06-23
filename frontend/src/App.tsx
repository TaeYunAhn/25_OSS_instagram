import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import FeedsPage from './pages/FeedsPage';
import ProfilePage from './pages/ProfilePage';
import NavBar from './components/NavBar';

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/feeds" element={<FeedsPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/feeds" />} />
      </Routes>
    </Router>
  );
}

export default App;
