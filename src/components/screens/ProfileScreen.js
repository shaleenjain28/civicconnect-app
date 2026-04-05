import React from 'react';

const ProfileScreen = () => (
    <div className="container">
        <div className="header">
            <h1 className="headerTitle">Profile</h1>
        </div>
        <div className="profileContent">
            <div className="profileAvatar">
                <span className="profileAvatarText">A</span>
            </div>
            <h2 className="profileName">Ansh</h2>
            <p className="profileEmail">ansh.sih2024@test.com</p>
            <button type="button" className="profileButton">
                <span className="profileButtonText">Edit Profile</span>
            </button>
            <button type="button" className="profileButton">
                <span className="profileButtonText">Settings</span>
            </button>
            <button type="button" className="profileButton" style={{ borderColor: '#EF4444' }}>
                <span className="profileButtonText" style={{ color: '#EF4444' }}>
                    Log Out
                </span>
            </button>
        </div>
    </div>
);

export default ProfileScreen;
