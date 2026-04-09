import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import AuthScreen from './components/screens/AuthScreen';
import AppContent from './components/AppContent';
import SplashScreen from './components/SplashScreen';

function AppInner() {
  const { isAuthenticated, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;
  if (loading) {
    return (
      <div className="phone-container">
        <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="phone-container">
      {isAuthenticated ? <AppContent /> : <AuthScreen />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </AuthProvider>
  );
}
