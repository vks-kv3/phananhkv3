
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './views/Home';
import { ReportForm } from './views/ReportForm';
import { AdminDashboard } from './views/AdminDashboard';
import { Login } from './views/Login';
import { TrackReport } from './views/TrackReport';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Component bảo vệ tuyến đường Admin
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'vksndthixabadon@gmail.com') {
        setIsLoggedIn(true);
        sessionStorage.setItem('isLoggedIn', 'true');
      } else {
        setIsLoggedIn(false);
        sessionStorage.removeItem('isLoggedIn');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-red-900/30 border-t-red-900 rounded-full animate-spin" />
      </div>
    );
  }

  return isLoggedIn ? <>{children}</> : <Navigate to="/login" />;
};

// Fix: Changed App to a standard functional component to avoid potential children-related TS issues
const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportForm />} />
          <Route path="/tra-cuu" element={<TrackReport />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
