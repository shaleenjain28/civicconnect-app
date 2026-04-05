import React, { useState } from 'react';
import { STATUS_COLORS } from '../../constants/theme';
import MapComponent from '../MapComponent';
import IssueModal from '../modals/IssueModal';
import { ProfileIcon } from '../icons/Icons';

const HomeScreen = ({ issues, handleUpvote, setActiveScreen }) => {
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [activeScope, setActiveScope] = useState('Local');
    const scopes = ['Local', 'City', 'State', 'Country'];

    const filteredIssues = issues
        .filter((issue) => issue.scope?.toLowerCase() === activeScope.toLowerCase())
        .sort((a, b) => b.upvotes - a.upvotes);

    return (
        <div className="container">
            <div className="appHeader">
                <img
                    src={`${process.env.PUBLIC_URL}/HomePage Logo.png`}
                    alt="CivicConnect"
                    className="headerTopLeftLogo"
                />
                <div className="headerIcon" onClick={() => setActiveScreen('Profile')} role="presentation">
                    <ProfileIcon active={false} />
                </div>
            </div>
            <MapComponent issues={issues} />

            <div className="issuesScopeContainer">
                <div className="scopeTabsContainer">
                    {scopes.map((scope) => (
                        <button
                            key={scope}
                            type="button"
                            className={`scopeTab ${activeScope === scope ? 'scopeTabActive' : ''}`}
                            onClick={() => setActiveScope(scope)}
                        >
                            {scope}
                        </button>
                    ))}
                </div>
                <div className="listScrollView noPadding">
                    {filteredIssues.length > 0 ? (
                        filteredIssues.map((item) => (
                            <div key={item.id} className="issueListItemV2" tabIndex={0} onClick={() => setSelectedIssue(item)} role="presentation">
                                <img src={item.image} className="issueListImageV2" alt={item.title} />
                                <div className="issueListInfoV2">
                                    <p className="issueListTitleV2">{item.title}</p>
                                    <p className="issueListCategoryV2">{item.category}</p>
                                    <div className="issueListFooterV2">
                                        <span style={{ background: STATUS_COLORS[item.status] || STATUS_COLORS.default }}>{item.status}</span>
                                        <span>{item.upvotes} upvotes</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', color: '#6B7280', marginTop: 40 }}>No issues found for this scope.</div>
                    )}
                </div>
            </div>

            {selectedIssue && (
                <IssueModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} onUpvote={handleUpvote} />
            )}
        </div>
    );
};

export default HomeScreen;
