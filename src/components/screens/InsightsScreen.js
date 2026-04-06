import React, { useState } from 'react';

const INSIGHTS_DATA = {
  municipalities: [
    { id: 1, name: 'Surat Municipal Corporation', state: 'Gujarat', resolved: 445, total: 520, avgResponse: '3d', satisfaction: 85 },
    { id: 2, name: 'Pune Municipal Corporation', state: 'Maharashtra', resolved: 389, total: 475, avgResponse: '4d', satisfaction: 82 },
    { id: 3, name: 'Jaipur Municipal Corporation', state: 'Rajasthan', resolved: 234, total: 312, avgResponse: '5d', satisfaction: 78 },
    { id: 4, name: 'Ahmedabad Municipal Corporation', state: 'Gujarat', resolved: 312, total: 420, avgResponse: '4d', satisfaction: 74 },
    { id: 5, name: 'Lucknow Municipal Corporation', state: 'Uttar Pradesh', resolved: 198, total: 290, avgResponse: '6d', satisfaction: 68 },
  ],
  ngos: [
    { id: 1, name: 'Swachh Bharat Mission', category: 'Sanitation & Cleanliness', completed: 156, active: 23, impact: 92 },
    { id: 2, name: 'Urban Infrastructure Development', category: 'Infrastructure', completed: 89, active: 15, impact: 88 },
    { id: 3, name: 'Clean Water Initiative', category: 'Water Supply', completed: 67, active: 12, impact: 85 },
    { id: 4, name: 'Green City Foundation', category: 'Environment', completed: 54, active: 8, impact: 81 },
    { id: 5, name: 'Road Safety Alliance', category: 'Traffic & Roads', completed: 43, active: 11, impact: 77 },
  ],
  cities: [
    { id: 1, name: 'Delhi', state: 'Delhi', highPriority: 234, totalIssues: 1245, population: '32.9M', severity: 19, issuesPer100k: 3.8 },
    { id: 2, name: 'Mumbai', state: 'Maharashtra', highPriority: 189, totalIssues: 987, population: '20.4M', severity: 19, issuesPer100k: 4.8 },
    { id: 3, name: 'Bengaluru', state: 'Karnataka', highPriority: 156, totalIssues: 834, population: '12.3M', severity: 18, issuesPer100k: 6.7 },
    { id: 4, name: 'Chennai', state: 'Tamil Nadu', highPriority: 123, totalIssues: 678, population: '10.9M', severity: 18, issuesPer100k: 6.2 },
    { id: 5, name: 'Kolkata', state: 'West Bengal', highPriority: 98, totalIssues: 543, population: '14.8M', severity: 18, issuesPer100k: 3.7 },
  ],
};

const InsightsScreen = () => {
  const [activeTab, setActiveTab] = useState('municipalities');

  const tabs = [
    { id: 'municipalities', label: 'Municipalities', icon: '🏛️' },
    { id: 'ngos', label: 'Top NGOs', icon: '❤️' },
    { id: 'cities', label: 'Most Affected Cities', icon: '📍' },
  ];

  return (
    <div className="container">
      <div className="header">
        <h1 className="headerTitle">Insights</h1>
      </div>

      {/* Tabs */}
      <div className="insightsTabs">
        {tabs.map(tab => (
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

      {/* Tab Content */}
      <div className="listScrollView" style={{ padding: '0 16px' }}>
        {activeTab === 'municipalities' && <MunicipalitiesTab />}
        {activeTab === 'ngos' && <NGOsTab />}
        {activeTab === 'cities' && <CitiesTab />}
      </div>
    </div>
  );
};

/* ==================== MUNICIPALITIES TAB ==================== */
const MunicipalitiesTab = () => (
  <div className="insightsContent">
    <h2 className="insightsHeading">Top Performing Municipalities</h2>
    <p className="insightsSubheading">Ranked by resolution rate, response time, and citizen satisfaction</p>
    {INSIGHTS_DATA.municipalities.map((m, idx) => {
      const rate = Math.round((m.resolved / m.total) * 100);
      return (
        <div key={m.id} className="insightsCard">
          <div className="insightsCardHeader">
            <div className="insightsCardLeft">
              <div className="insightsRankBadge">
                <span className="insightsRankIcon">🏆</span>
                <span className="insightsRankText">#{idx + 1}</span>
              </div>
              <div>
                <h3 className="insightsCardTitle">{m.name}</h3>
                <p className="insightsCardSubtitle">{m.state}</p>
              </div>
            </div>
            <div className="insightsScoreBadge">{m.satisfaction}%</div>
          </div>

          <div className="insightsStatsRow">
            <div className="insightsStat">
              <span className="insightsStatIcon">✅</span>
              <div>
                <span className="insightsStatValue">{m.resolved}</span>
                <span className="insightsStatLabel">Resolved</span>
              </div>
            </div>
            <div className="insightsStat">
              <span className="insightsStatIcon">📊</span>
              <div>
                <span className="insightsStatValue">{m.total}</span>
                <span className="insightsStatLabel">Total Issues</span>
              </div>
            </div>
            <div className="insightsStat">
              <span className="insightsStatIcon">⏱️</span>
              <div>
                <span className="insightsStatValue">{m.avgResponse}</span>
                <span className="insightsStatLabel">Avg Response</span>
              </div>
            </div>
          </div>

          <div className="insightsBarContainer">
            <span className="insightsBarLabel">Resolution Rate</span>
            <span className="insightsBarValue">{rate}%</span>
          </div>
          <div className="insightsBar">
            <div
              className="insightsBarFill"
              style={{
                width: `${rate}%`,
                background: rate >= 80 ? 'linear-gradient(90deg, #10B981, #34D399)' :
                            rate >= 60 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' :
                                         'linear-gradient(90deg, #EF4444, #F87171)',
              }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

/* ==================== NGOs TAB ==================== */
const NGOsTab = () => (
  <div className="insightsContent">
    <h2 className="insightsHeading">Top Performing NGOs</h2>
    <p className="insightsSubheading">Ranked by project completion rate and community impact</p>
    {INSIGHTS_DATA.ngos.map((ngo, idx) => (
      <div key={ngo.id} className="insightsCard">
        <div className="insightsCardHeader">
          <div className="insightsCardLeft">
            <div className="insightsRankBadge">
              <span className="insightsRankIcon">🏆</span>
              <span className="insightsRankText">#{idx + 1}</span>
            </div>
            <div>
              <h3 className="insightsCardTitle">{ngo.name}</h3>
              <p className="insightsCardSubtitle">{ngo.category}</p>
            </div>
          </div>
          <div className="insightsScoreBadge insightsScoreGreen">{ngo.impact}%</div>
        </div>

        <div className="insightsStatsRow">
          <div className="insightsStat">
            <span className="insightsStatIcon">✅</span>
            <div>
              <span className="insightsStatValue">{ngo.completed}</span>
              <span className="insightsStatLabel">Projects Completed</span>
            </div>
          </div>
          <div className="insightsStat">
            <span className="insightsStatIcon">📊</span>
            <div>
              <span className="insightsStatValue">{ngo.active}</span>
              <span className="insightsStatLabel">Active Projects</span>
            </div>
          </div>
        </div>

        <div className="insightsImpactRow">
          <span className="insightsImpactLabel">Community Impact</span>
          <span className="insightsImpactValue">❤️ {ngo.impact}% Positive</span>
        </div>
      </div>
    ))}
  </div>
);

/* ==================== MOST AFFECTED CITIES TAB ==================== */
const CitiesTab = () => (
  <div className="insightsContent">
    <h2 className="insightsHeading">Most Affected Cities</h2>
    <p className="insightsSubheading">Cities with highest number of high-severity unresolved issues</p>
    {INSIGHTS_DATA.cities.map((city, idx) => (
      <div key={city.id} className="insightsCard insightsCardCity">
        <div className="insightsCardHeader">
          <div className="insightsCardLeft">
            <div className="insightsRankBadge insightsRankDanger">
              <span className="insightsRankText">#{idx + 1}</span>
            </div>
            <div>
              <h3 className="insightsCardTitle">{city.name}</h3>
              <p className="insightsCardSubtitle">{city.state}</p>
            </div>
          </div>
          <div className="insightsCityHighPriority">
            <span className="insightsCityCount">{city.highPriority}</span>
            <span className="insightsCityLabel">High Priority</span>
          </div>
        </div>

        <div className="insightsStatsRow">
          <div className="insightsStat">
            <span className="insightsStatIcon">📊</span>
            <div>
              <span className="insightsStatValue">{city.totalIssues}</span>
              <span className="insightsStatLabel">Total Issues</span>
            </div>
          </div>
          <div className="insightsStat">
            <span className="insightsStatIcon">👥</span>
            <div>
              <span className="insightsStatValue">{city.population}</span>
              <span className="insightsStatLabel">Population</span>
            </div>
          </div>
        </div>

        <div className="insightsSeverityRow">
          <div className="insightsBarContainer">
            <span className="insightsBarLabel">Issue Severity Ratio</span>
            <span className="insightsBarValue insightsDangerText">{city.severity}% High Priority</span>
          </div>
          <div className="insightsBar">
            <div className="insightsBarFill insightsBarDanger" style={{ width: `${city.severity}%` }} />
          </div>
          <p className="insightsCityFooter">{city.issuesPer100k} issues per 100K residents</p>
        </div>
      </div>
    ))}
  </div>
);

export default InsightsScreen;
