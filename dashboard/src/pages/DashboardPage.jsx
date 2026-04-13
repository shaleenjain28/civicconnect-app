import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  ArrowUpRight, MapPin, ShieldAlert, Building2, Eye,
} from 'lucide-react';
import { dataService } from '../services/dataService';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [deptDist, setDeptDist] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [escalated, setEscalated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, dd, sd, issues, esc] = await Promise.all([
          dataService.getStats(),
          dataService.getTypeDistribution(),
          dataService.getStatusDistribution(),
          dataService.getProblems({ limit: 5, sort: 'urgency' }),
          dataService.getEscalated(),
        ]);
        setStats(s);
        setDeptDist(dd);
        setStatusDist(sd);
        setRecentIssues(issues);
        setEscalated(esc);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  // Chart: Department Distribution (Doughnut)
  const doughnutData = {
    labels: deptDist.map(d => d.name),
    datasets: [{
      data: deptDist.map(d => d.count),
      backgroundColor: deptDist.map(d => d.color),
      borderWidth: 2,
      borderColor: 'var(--bg-card)',
      hoverOffset: 8,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, padding: 14, font: { family: 'Inter', size: 12, weight: '500' } } },
    },
    cutout: '60%',
  };

  // Chart: Status Distribution (Bar)
  const barData = {
    labels: statusDist.map(s => s.name),
    datasets: [{
      label: 'Issues',
      data: statusDist.map(s => s.count),
      backgroundColor: statusDist.map(s => s.color),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleFont: { family: 'Inter', size: 13, weight: '600' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12, cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 } } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: 'Inter', size: 11 } } },
    },
  };

  const statCards = [
    { label: 'Total Problems', value: stats?.total || 0, icon: AlertTriangle, color: 'green', trend: stats?.total || 0, bg: '#2e7d32' },
    { label: 'Resolved', value: stats?.resolved || 0, icon: CheckCircle, color: 'blue', trend: stats?.resolved || 0, bg: '#1976d2' },
    { label: 'Pending', value: stats?.pending || 0, icon: Clock, color: 'orange', trend: stats?.pending || 0, bg: '#f57c00' },
    { label: 'Resolution Rate', value: `${stats?.resolutionRate || 0}%`, icon: TrendingUp, color: 'purple', trend: stats?.resolutionRate || 0, bg: '#7b1fa2' },
  ];

  return (
    <>
      {/* Stat Cards */}
      <div className="stat-cards-grid">
        {statCards.map((card, i) => (
          <div key={card.label} className={`card stat-card stagger-${i + 1}`}>
            <div className="stat-card-inner">
              <div className="stat-card-header">
                <span className="stat-card-label">{card.label}</span>
                <div className={`stat-card-icon ${card.color}`}>
                  <card.icon size={20} />
                </div>
              </div>
              <div className="stat-card-value">{card.value}</div>
              {stats?.escalated > 0 && card.label === 'Pending' && (
                <div className="stat-card-trend down">
                  <ShieldAlert size={12} />
                  {stats.escalated} escalated
                </div>
              )}
            </div>
            <div className="stat-card-decoration" style={{ background: card.bg }} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Issues by Status</div>
            <div className="card-subtitle">Current distribution</div>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 280 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">By Department</div>
            <div className="card-subtitle">Issue distribution across departments</div>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 280 }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="bottom-grid">
        {/* Recent High-Urgency */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔥 Top Urgency Issues</div>
            <div className="card-subtitle">Sorted by urgency score</div>
          </div>
          <div className="card-body">
            {recentIssues.length === 0 ? (
              <div className="empty-state"><p className="empty-state-text">No issues yet</p></div>
            ) : (
              recentIssues.map(issue => (
                <div key={issue.id} className="activity-item">
                  <div className="activity-icon">
                    <span style={{ fontSize: 18 }}>{issue.department?.icon || '📋'}</span>
                  </div>
                  <div className="activity-info">
                    <div className="activity-title">{issue.title}</div>
                    <div className="activity-meta">
                      <MapPin size={11} /> {issue.locationText || 'Jaipur'}
                      <span>• Score: {issue.urgencyScore}</span>
                    </div>
                  </div>
                  <span className="activity-status" style={{ background: dataService.getCriticalityColor(issue.criticality) }}>
                    {issue.criticality}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Departments Overview */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Building2 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Department Breakdown
            </div>
            <div className="card-subtitle">{deptDist.length} active departments</div>
          </div>
          <div className="card-body">
            {deptDist.map(dept => (
              <div key={dept.name} className="top-category-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{dept.icon}</span>
                  <span className="top-category-name">{dept.fullName}</span>
                </div>
                <div className="top-category-count">
                  <span className="top-category-number" style={{ color: dept.color }}>{dept.count}</span>
                  <span className="top-category-label">Issues</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Escalated Alert */}
      {escalated.length > 0 && (
        <div className="card" style={{ marginTop: 24, borderLeft: '4px solid #EF4444' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: '#EF4444' }}>
              🚨 Escalated Issues ({escalated.length})
            </div>
            <div className="card-subtitle">These issues have passed their deadlines</div>
          </div>
          <div className="card-body">
            {escalated.slice(0, 3).map(issue => (
              <div key={issue.id} className="activity-item">
                <div className="activity-icon" style={{ background: '#FEE2E2' }}>
                  <ShieldAlert size={18} style={{ color: '#EF4444' }} />
                </div>
                <div className="activity-info">
                  <div className="activity-title">{issue.title}</div>
                  <div className="activity-meta">
                    {issue.department?.name} • {issue.locationText || 'Jaipur'}
                  </div>
                </div>
                <span className="activity-status" style={{ background: '#EF4444' }}>
                  Overdue
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
