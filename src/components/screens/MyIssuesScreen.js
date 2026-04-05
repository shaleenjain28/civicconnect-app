import React, { useEffect, useRef, useState } from 'react';
import { STATUS_COLORS } from '../../constants/theme';
import Toast from '../Toast';
import MyIssueDetailModal from '../modals/MyIssueDetailModal';

const MyIssuesScreen = ({ allIssues }) => {
    const [filter, setFilter] = useState('All');
    const sort = 'Newest';
    const [search, setSearch] = useState('');
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [toast, setToast] = useState(null);
    const searchRef = useRef();
    useEffect(() => {
        if (searchRef.current) searchRef.current.focus();
    }, []);

    const authorities = [
        { id: 1, name: 'Jaipur Mun Corp.' },
        { id: 2, name: 'Clean Foundation' },
        { id: 3, name: 'Urban Trust' },
    ];
    const getStatusHistory = (issue) => [
        { status: 'Active', date: issue.date },
        ...(issue.status !== 'Active'
            ? [{ status: issue.status, date: new Date(new Date(issue.date).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }]
            : []),
    ];
    const getComments = (issue) => [
        { user: 'Authority', text: 'We have received your complaint.', date: issue.date },
        ...(issue.status !== 'Active'
            ? [{ user: 'Authority', text: 'Work is in progress.', date: new Date(new Date(issue.date).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }]
            : []),
    ];

    let userIssues = allIssues?.filter((i) => i.reporter === 'user1');
    if (filter !== 'All') userIssues = userIssues.filter((issue) => issue.status === filter);
    if (search) userIssues = userIssues.filter((issue) => issue.title.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'Newest') userIssues?.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sort === 'Oldest') userIssues?.sort((a, b) => new Date(a.date) - new Date(b.date));

    const filters = ['All', 'Active', 'In Progress', 'Pending', 'Resolved'];

    return (
        <div className="container" aria-label="My Reported Issues">
            <div className="header">
                <h1 className="headerTitle">My Reported Issues</h1>
            </div>
            <div style={{ padding: '0 20px', marginBottom: 18 }}>
                <input
                    ref={searchRef}
                    className="addIssueInput"
                    placeholder="Search by title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="filterContainer">
                {filters.map((f) => (
                    <button key={f} type="button" className={`filterButton ${filter === f ? 'filterButtonActive' : ''}`} onClick={() => setFilter(f)}>
                        <span className={`filterButtonText ${filter === f ? 'filterButtonTextActive' : ''}`}>{f}</span>
                    </button>
                ))}
            </div>
            <div className="listScrollView" role="list">
                {userIssues?.length > 0 ? (
                    userIssues.map((item) => (
                        <div key={item.id} className="issueListItemV2" tabIndex={0} role="listitem" onClick={() => setSelectedIssue(item)}>
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
                    <div style={{ textAlign: 'center', color: '#6B7280', marginTop: 40 }}>No issues found.</div>
                )}
            </div>
            {selectedIssue && (
                <MyIssueDetailModal
                    issue={selectedIssue}
                    onClose={() => setSelectedIssue(null)}
                    statusHistory={getStatusHistory(selectedIssue)}
                    comments={getComments(selectedIssue)}
                    authority={authorities[selectedIssue.id % authorities.length]}
                    showToast={setToast}
                />
            )}
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
};

export default MyIssuesScreen;
