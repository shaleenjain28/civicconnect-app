import React, { useEffect, useState } from 'react';
import AppContent from './components/AppContent';
import SplashScreen from './components/SplashScreen';

const App = () => {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2500);
        return () => clearTimeout(timer);
    }, []);
    return <div className="phone-container">{loading ? <SplashScreen /> : <AppContent />}</div>;
};

export default App;
