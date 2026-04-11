// ─── Updated AppContent ───
// Main app shell with bottom navigation, FAB, and screen switching.

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { locationService } from '../services/locationService';
import AddIssueModal from './modals/AddIssueModal';
import HomeScreen from './screens/HomeScreen';
import MyIssuesScreen from './screens/MyIssuesScreen';
import InsightsScreen from './screens/InsightsScreen';
import ProfileScreen from './screens/ProfileScreen';
import DepartmentIssuesScreen from './screens/DepartmentIssuesScreen';
import { HomeIcon, IssuesIcon, InsightsIcon, ProfileIcon, PlusIcon } from './icons/Icons';

const AppContent = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeScreen, setActiveScreen] = useState('Home');
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Get user location on mount
  useEffect(() => {
    locationService.getCurrentPosition()
      .then((loc) => {
        setUserLocation(loc);
        locationService.saveLocation(loc);
      })
      .catch(() => {
        setUserLocation(locationService.getSavedLocation());
      });
  }, []);

  // Fetch issues when location is available
  useEffect(() => {
    if (userLocation) {
      loadNearbyIssues();
    } else {
      loadAllIssues();
    }
  }, [userLocation]);

  const loadNearbyIssues = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/issues/nearby', {
        lat: userLocation.lat,
        lon: userLocation.lon,
        radius: 5000,
        limit: 50,
      });
      setIssues(data.data || []);
    } catch {
      loadAllIssues();
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllIssues = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/issues', { limit: 50, sort: 'newest' });
      setIssues(data.data || []);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async (issueId) => {
    try {
      const issue = issues.find((i) => i.id === issueId);
      if (issue?.hasVoted) {
        await api.delete(`/issues/${issueId}/vote`);
      } else {
        await api.post(`/issues/${issueId}/vote`);
      }
      // Refresh issues
      if (userLocation) loadNearbyIssues();
      else loadAllIssues();
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleAddIssue = async (newIssue) => {
    try {
      await api.post('/issues', newIssue);
      setShowAddIssueModal(false);
      // Refresh
      if (userLocation) loadNearbyIssues();
      else loadAllIssues();
    } catch (err) {
      alert('Failed to submit issue: ' + err.message);
    }
  };

  const handleDepartmentClick = (dept) => {
    setSelectedDepartment(dept);
    setActiveScreen('DepartmentIssues');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Home':
        return (
          <HomeScreen
            issues={issues}
            handleUpvote={handleUpvote}
            setActiveScreen={setActiveScreen}
            userLocation={userLocation}
            isLoading={isLoading}
            onRefresh={userLocation ? loadNearbyIssues : loadAllIssues}
          />
        );
      case 'My Issues':
        return <MyIssuesScreen />;
      case 'Insights':
        return <InsightsScreen onDepartmentClick={handleDepartmentClick} />;
      case 'DepartmentIssues':
        return (
          <DepartmentIssuesScreen
            department={selectedDepartment}
            onBack={() => setActiveScreen('Insights')}
          />
        );
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen issues={issues} handleUpvote={handleUpvote} setActiveScreen={setActiveScreen} userLocation={userLocation} isLoading={isLoading} />;
    }
  };

  const NavItem = ({ screenName, Icon, label }) => (
    <div className="navItem" onClick={() => setActiveScreen(screenName)} role="presentation">
      <Icon active={activeScreen === screenName} />
      <span className={`navLabel ${activeScreen === screenName ? 'navLabelActive' : ''}`}>{label}</span>
    </div>
  );

  return (
    <div className="phone-container">
      <div className="safeArea">{renderScreen()}</div>
      <div className="fab" onClick={() => setShowAddIssueModal(true)} role="presentation">
        <PlusIcon />
      </div>
      <div className="navBar">
        <NavItem screenName="Home" Icon={HomeIcon} label={t('home')} />
        <NavItem screenName="My Issues" Icon={IssuesIcon} label={t('myIssues')} />
        <NavItem screenName="Insights" Icon={InsightsIcon} label={t('insights')} />
        <NavItem screenName="Profile" Icon={ProfileIcon} label={t('profile')} />
      </div>
      {showAddIssueModal && (
        <AddIssueModal
          onClose={() => setShowAddIssueModal(false)}
          onAddIssue={handleAddIssue}
          userLocation={userLocation}
        />
      )}
    </div>
  );
};

export default AppContent;
