// ─── Insights Screen ───
// Shows department cards (clickable → drill-down), municipalities, and NGOs.

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';

const InsightsScreen = ({ onDepartmentClick }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/departments')
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'departments', label: t('departments'), icon: '🏛️' },
    { id: 'municipalities', label: t('municipalities'), icon: '🏛️' },
    { id: 'ngos', label: t('topNGOs'), icon: '❤️' },
  ];

  return (
    <div className="container">
      <div className="header">
        <h1 className="headerTitle">{t('insights')}</h1>
      </div>

      <div className="insightsTabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`insightsTab ${activeTab === tab.id ? 'insightsTabActive' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="insightsTabIcon">{tab.icon}</span>
            <span className="insightsTabLabel">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="listScrollView" style={{ padding: '0 16px' }}>
        {activeTab === 'departments' && (
          <DepartmentsTab departments={departments} loading={loading} onDepartmentClick={onDepartmentClick} />
        )}
        {activeTab === 'municipalities' && <MunicipalitiesTab />}
        {activeTab === 'ngos' && <NGOsTab />}
      </div>
    </div>
  );
};

// ─── Departments Tab (Clickable Cards) ───
const DepartmentsTab = ({ departments, loading, onDepartmentClick }) => {
  if (loading) {
    return (
      <div className="dept-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton dept-card-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="insightsContent">
      <h2 className="insightsHeading">Government Departments</h2>
      <p className="insightsSubheading">Tap a department to see its issues</p>
      <div className="dept-grid">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="dept-card"
            style={{ borderTopColor: dept.color }}
            onClick={() => onDepartmentClick(dept)}
            role="button"
            tabIndex={0}
          >
            <span className="dept-card-icon">{dept.icon}</span>
            <h3 className="dept-card-name">{dept.name}</h3>
            <div className="dept-card-stats">
              <span className="dept-card-total">{dept.totalIssues} issues</span>
              <div className="dept-card-breakdown">
                <span className="dept-pending">{dept.pendingCount} pending</span>
                <span className="dept-resolved">{dept.resolvedCount} resolved</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Municipalities Tab ───
const MUNICIPALITIES = [
  { id: 1, name: 'Surat Municipal Corporation', state: 'Gujarat', resolved: 445, total: 520, satisfaction: 85 },
  { id: 2, name: 'Pune Municipal Corporation', state: 'Maharashtra', resolved: 389, total: 475, satisfaction: 82 },
  { id: 3, name: 'Jaipur Municipal Corporation', state: 'Rajasthan', resolved: 234, total: 312, satisfaction: 78 },
  { id: 4, name: 'Ahmedabad Municipal Corporation', state: 'Gujarat', resolved: 312, total: 420, satisfaction: 74 },
  { id: 5, name: 'Lucknow Municipal Corporation', state: 'Uttar Pradesh', resolved: 198, total: 290, satisfaction: 68 },
];

const MunicipalitiesTab = () => (
  <div className="insightsContent">
    <h2 className="insightsHeading">Top Municipalities</h2>
    <p className="insightsSubheading">Ranked by resolution rate & satisfaction</p>
    {MUNICIPALITIES.map((m, idx) => {
      const rate = Math.round((m.resolved / m.total) * 100);
      return (
        <div key={m.id} className="insightsCard">
          <div className="insightsCardHeader">
            <div className="insightsCardLeft">
              <div className="insightsRankBadge"><span className="insightsRankText">#{idx + 1}</span></div>
              <div><h3 className="insightsCardTitle">{m.name}</h3><p className="insightsCardSubtitle">{m.state}</p></div>
            </div>
            <div className="insightsScoreBadge">{m.satisfaction}%</div>
          </div>
          <div className="insightsStatsRow">
            <div className="insightsStat"><div><span className="insightsStatValue">{m.resolved}</span><span className="insightsStatLabel">Resolved</span></div></div>
            <div className="insightsStat"><div><span className="insightsStatValue">{m.total}</span><span className="insightsStatLabel">Total</span></div></div>
          </div>
          <div className="insightsBarContainer"><span className="insightsBarLabel">Resolution Rate</span><span className="insightsBarValue">{rate}%</span></div>
          <div className="insightsBar"><div className="insightsBarFill" style={{ width: `${rate}%`, background: rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444' }} /></div>
        </div>
      );
    })}
  </div>
);

// ─── NGOs Tab ───
const NGOS = [
  { id: 1, name: 'Swachh Bharat Mission', category: 'Sanitation', completed: 156, impact: 92 },
  { id: 2, name: 'Urban Infrastructure Dev', category: 'Infrastructure', completed: 89, impact: 88 },
  { id: 3, name: 'Clean Water Initiative', category: 'Water Supply', completed: 67, impact: 85 },
  { id: 4, name: 'Green City Foundation', category: 'Environment', completed: 54, impact: 81 },
  { id: 5, name: 'Road Safety Alliance', category: 'Traffic & Roads', completed: 43, impact: 77 },
];

const NGOsTab = () => (
  <div className="insightsContent">
    <h2 className="insightsHeading">Top NGOs</h2>
    <p className="insightsSubheading">Ranked by impact & projects completed</p>
    {NGOS.map((ngo, idx) => (
      <div key={ngo.id} className="insightsCard">
        <div className="insightsCardHeader">
          <div className="insightsCardLeft">
            <div className="insightsRankBadge"><span className="insightsRankText">#{idx + 1}</span></div>
            <div><h3 className="insightsCardTitle">{ngo.name}</h3><p className="insightsCardSubtitle">{ngo.category}</p></div>
          </div>
          <div className="insightsScoreBadge insightsScoreGreen">{ngo.impact}%</div>
        </div>
        <div className="insightsStatsRow">
          <div className="insightsStat"><div><span className="insightsStatValue">{ngo.completed}</span><span className="insightsStatLabel">Completed</span></div></div>
        </div>
        <div className="insightsImpactRow"><span className="insightsImpactLabel">Impact</span><span className="insightsImpactValue">❤️ {ngo.impact}%</span></div>
      </div>
    ))}
  </div>
);

export default InsightsScreen;
