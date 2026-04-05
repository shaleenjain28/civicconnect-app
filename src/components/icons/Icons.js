import React from 'react';

export const UserLogo = () => (
    <img src="/logo.png" alt="CivicConnect Logo" className="splash-logo" />
);

export const HomeIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={active ? '#4F46E5' : '#6B7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 22V12h6v10" stroke={active ? '#4F46E5' : '#6B7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const IssuesIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke={active ? '#4F46E5' : '#6B7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const LeaderboardIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 20V10M18 20V4M6 20v-4" stroke={active ? '#4F46E5' : '#6B7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ProfileIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={active ? '#4F46E5' : '#111827'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={active ? '#4F46E5' : '#111827'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
