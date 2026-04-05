import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import AddIssueModal from './modals/AddIssueModal';
import HomeScreen from './screens/HomeScreen';
import MyIssuesScreen from './screens/MyIssuesScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import { HomeIcon, IssuesIcon, LeaderboardIcon, PlusIcon } from './icons/Icons';

const AppContent = () => {
    const [activeScreen, setActiveScreen] = useState('Home');
    const [showAddIssueModal, setShowAddIssueModal] = useState(false);
    const [appData, setAppData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const data = storageService.getData();
        setAppData(data);
        setIsLoading(false);
    }, []);

    const handleDataUpdate = (newAppData) => {
        setAppData(newAppData);
        storageService.saveData(newAppData);
    };

    const handleUpvote = (issueId) => {
        const updatedIssues = appData.issues.map((issue) =>
            issue.id === issueId ? { ...issue, upvotes: issue.upvotes + 1 } : issue
        );
        handleDataUpdate({ ...appData, issues: updatedIssues });
    };

    const handleAddIssue = (newIssue) => {
        const newIssueWithId = {
            ...newIssue,
            id: Date.now(),
            upvotes: 0,
            status: 'Pending',
            reporter: 'user1',
            date: new Date().toISOString().slice(0, 10),
        };
        const updatedIssues = [newIssueWithId, ...appData.issues];
        handleDataUpdate({ ...appData, issues: updatedIssues });
        setShowAddIssueModal(false);
    };

    if (isLoading || !appData) {
        return (
            <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div
                    className="spinner geminiSpinner"
                    style={{ width: 50, height: 50, borderColor: '#4F46E5', borderTopColor: 'transparent' }}
                />
            </div>
        );
    }

    const renderScreen = () => {
        switch (activeScreen) {
            case 'Home':
                return <HomeScreen issues={appData.issues} handleUpvote={handleUpvote} setActiveScreen={setActiveScreen} />;
            case 'My Issues':
                return <MyIssuesScreen allIssues={appData.issues} />;
            case 'Leaderboard':
                return <LeaderboardScreen data={appData.leaderboard} />;
            case 'Profile':
                return <ProfileScreen />;
            default:
                return <HomeScreen issues={appData.issues} handleUpvote={handleUpvote} setActiveScreen={setActiveScreen} />;
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
                <NavItem screenName="Home" Icon={HomeIcon} label="Home" />
                <NavItem screenName="My Issues" Icon={IssuesIcon} label="My Issues" />
                <NavItem screenName="Leaderboard" Icon={LeaderboardIcon} label="Ranks" />
            </div>
            {showAddIssueModal && <AddIssueModal onClose={() => setShowAddIssueModal(false)} onAddIssue={handleAddIssue} />}
        </div>
    );
};

export default AppContent;
