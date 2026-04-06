import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  ArrowUpRight, ArrowDownRight, MapPin, Calendar,
} from 'lucide-react';
import { dataService } from '../services/dataService';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

export default function DashboardPage() {
  const stats = useMemo(() => dataService.getStats(), []);
  const monthly = useMemo(() => dataService.getMonthlyData(), []);
  const typeDist = useMemo(() => dataService.getTypeDistribution(), []);
  const topTypes = useMemo(() => dataService.getTopTypes(), []);
  const problems = useMemo(() => dataService.getProblems(), []);

  const recentProblems = problems.slice(0, 4);

  // Chart Data — Bar
  const barData = {
    labels: monthly.map(m => m.month),
    datasets: [
      {
        label: 'Reported',
        data: monthly.map(m => m.reported),
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-800').trim() || '#2e7d32',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Resolved',
        data: monthly.map(m => m.resolved),
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--gray-700').trim() || '#424242',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, padding: 16, font: { family: 'Inter', size: 12, weight: '500' } } },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleFont: { family: 'Inter', size: 13, weight: '600' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'Inter', size: 12 } } },
    },
  };

  // Chart Data — Doughnut
  const typeColors = ['#2e7d32', '#ff9800', '#2196f3', '#9c27b0', '#f44336', '#607d8b'];
  const doughnutData = {
    labels: typeDist.map(t => t.name),
    datasets: [{
      data: typeDist.map(t => t.count),
      backgroundColor: typeColors.slice(0, typeDist.length),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, padding: 14, font: { family: 'Inter', size: 12, weight: '500' } },
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleFont: { family: 'Inter', size: 13, weight: '600' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = Math.round((ctx.raw / total) * 100);
            return ` ${ctx.label}: ${pct}%`;
          },
        },
      },
    },
  };

  const statusColor = (status) => {
    switch (status) {
      case 'Pending': return 'var(--status-pending)';
      case 'In Progress': return 'var(--status-inprogress)';
      case 'Resolved': return 'var(--status-resolved)';
      default: return 'var(--gray-500)';
    }
  };

  const statusClass = (status) => {
    switch (status) {
      case 'Pending': return 'badge badge-pending';
      case 'In Progress': return 'badge badge-inprogress';
      case 'Resolved': return 'badge badge-resolved';
      default: return 'badge';
    }
  };

  return (
    <div className="fade-in">
      {/* Stat Cards */}
      <div className="stat-cards-grid">
        <StatCard
          label="Total Problems" value={stats.total}
          trend="+12%" trendDir="up" trendLabel="from last month"
          icon={<AlertTriangle size={20} />} iconClass="green"
          decorationColor="var(--primary-500)" stagger="1"
        />
        <StatCard
          label="Resolved" value={stats.resolved}
          trend="+8%" trendDir="up" trendLabel="from last month"
          icon={<CheckCircle size={20} />} iconClass="blue"
          decorationColor="#2196f3" stagger="2"
        />
        <StatCard
          label="Pending" value={stats.pending}
          trend="-3%" trendDir="down" trendLabel="from last month"
          icon={<Clock size={20} />} iconClass="orange"
          decorationColor="var(--accent-500)" stagger="3"
        />
        <StatCard
          label="Resolution Rate" value={`${stats.resolutionRate}%`}
          icon={<TrendingUp size={20} />} iconClass="purple"
          decorationColor="#9c27b0" stagger="4"
          extra={
            <div className="resolution-bar" style={{ marginTop: 8 }}>
              <div className="resolution-bar-fill" style={{ width: `${stats.resolutionRate}%` }} />
            </div>
          }
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Problems Over Time</h3>
            <p className="card-subtitle">Monthly reported vs resolved problems</p>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 280 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Problems by Type</h3>
            <p className="card-subtitle">Distribution of problem categories</p>
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
        {/* Recent Problems */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Problems</h3>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            {recentProblems.map((p) => (
              <div key={p.id} className="activity-item">
                <div className="activity-icon">
                  <AlertTriangle size={18} style={{ color: 'var(--primary-600)' }} />
                </div>
                <div className="activity-info">
                  <div className="activity-title">{p.title}</div>
                  <div className="activity-meta">
                    <MapPin size={12} /> {p.location}
                    <span>•</span>
                    <Calendar size={12} /> {p.reportedDate}
                  </div>
                </div>
                <span className={statusClass(p.status)}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Problem Types */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Problem Types</h3>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            {topTypes.map((t) => (
              <div key={t.name} className="top-category-item">
                <span className="top-category-name">{t.name}</span>
                <div className="top-category-count">
                  <span className="top-category-number">{t.count}</span>
                  <span className="top-category-label">reports</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, trendDir, trendLabel, icon, iconClass, decorationColor, stagger, extra }) {
  return (
    <div className={`card stat-card fade-in stagger-${stagger}`}>
      <div className="stat-card-inner">
        <div className="stat-card-header">
          <span className="stat-card-label">{label}</span>
          <div className={`stat-card-icon ${iconClass}`}>{icon}</div>
        </div>
        <div className="stat-card-value">{value}</div>
        {trend && (
          <div className={`stat-card-trend ${trendDir}`}>
            {trendDir === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{trend}</span>
            {trendLabel && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{trendLabel}</span>}
          </div>
        )}
        {extra}
      </div>
      <div className="stat-card-decoration" style={{ backgroundColor: decorationColor }} />
    </div>
  );
}
