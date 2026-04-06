/**
 * Data service — reads from the same localStorage key as the citizen app,
 * enriched with extra dashboard-specific fields.
 */

const STORAGE_KEY = 'civicConnectData';

// Default problems when citizen app hasn't been run yet
const DEFAULT_PROBLEMS = [
  {
    id: 1, title: 'Large pothole on Main Street',
    description: 'Deep pothole causing damage to vehicles. Located at the intersection near the university main gate.',
    location: 'Main St & 5th Ave', type: 'Pothole', status: 'Pending', priority: 'High',
    votes: 23, reportedDate: '2024-01-15', lat: 26.852, lon: 75.802, reporter: 'user1',
    image: 'https://images.pexels.com/photos/19131580/pexels-photo-19131580/free-photo-of-a-man-riding-a-scooter-on-a-dirt-road.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 2, title: 'Water leak on residential street',
    description: 'Water main leak causing flooding on the sidewalk. Residents are complaining about water damage.',
    location: 'Elm Street', type: 'Water', status: 'Pending', priority: 'High',
    votes: 19, reportedDate: '2024-01-15', lat: 26.855, lon: 75.805, reporter: 'user2',
    image: 'https://images.pexels.com/photos/2059045/pexels-photo-2059045.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 3, title: 'Broken streetlight',
    description: 'Streetlight has been out for over a week, creating a safety hazard for pedestrians at night.',
    location: 'Oak Avenue near Park', type: 'Streetlight', status: 'In Progress', priority: 'Medium',
    votes: 15, reportedDate: '2024-01-15', lat: 26.860, lon: 75.810, reporter: 'user1',
    image: 'https://images.pexels.com/photos/1519753/pexels-photo-1519753.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 4, title: 'Overflowing garbage bin',
    description: 'Public garbage bin is overflowing and attracting pests. Needs immediate collection and cleaning.',
    location: 'Central Park District', type: 'Garbage', status: 'Resolved', priority: 'Low',
    votes: 8, reportedDate: '2024-01-13', lat: 26.848, lon: 75.798, reporter: 'user3',
    image: 'https://images.pexels.com/photos/208349/pexels-photo-208349.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 5, title: 'Cracked sidewalk near school',
    description: 'The sidewalk near the elementary school has significant cracks, posing a trip hazard for children.',
    location: 'School Rd & 3rd Ave', type: 'Pothole', status: 'Pending', priority: 'High',
    votes: 31, reportedDate: '2024-01-14', lat: 26.857, lon: 75.807, reporter: 'user4',
    image: 'https://images.pexels.com/photos/533451/pexels-photo-533451.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 6, title: 'Illegal dumping site',
    description: 'An area behind the warehouse has become an illegal dump site with construction debris and old tires.',
    location: 'Industrial Blvd', type: 'Garbage', status: 'Pending', priority: 'Medium',
    votes: 12, reportedDate: '2024-01-12', lat: 26.845, lon: 75.795, reporter: 'user5',
    image: 'https://images.pexels.com/photos/208349/pexels-photo-208349.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 7, title: 'Malfunctioning traffic signal',
    description: 'Traffic signal stuck on red, causing massive delays during peak hours at the main intersection.',
    location: 'University Gate Road', type: 'Streetlight', status: 'In Progress', priority: 'High',
    votes: 27, reportedDate: '2024-01-16', lat: 26.862, lon: 75.812, reporter: 'user1',
    image: 'https://images.pexels.com/photos/356830/pexels-photo-356830.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 8, title: 'Leaking fire hydrant',
    description: 'Fire hydrant on 7th street is leaking water continuously. Causing water wastage and slippery road.',
    location: '7th Street', type: 'Water', status: 'Resolved', priority: 'Medium',
    votes: 9, reportedDate: '2024-01-10', lat: 26.850, lon: 75.800, reporter: 'user6',
    image: 'https://images.pexels.com/photos/2059045/pexels-photo-2059045.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

/**
 * Tries to load data from citizen app localStorage. Falls back to defaults.
 */
function loadProblems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.issues && parsed.issues.length > 0) {
        // Map citizen-app issue format to dashboard format
        return parsed.issues.map((issue, idx) => ({
          id: issue.id,
          title: issue.title,
          description: issue.description || `Reported issue at ${issue.location || 'unknown location'}.`,
          location: issue.location || `Lat: ${issue.lat}, Lon: ${issue.lon}`,
          type: mapCategory(issue.category),
          status: mapStatus(issue.status),
          priority: derivePriority(issue.upvotes || issue.votes || 0),
          votes: issue.upvotes || issue.votes || 0,
          reportedDate: issue.date || issue.reportedDate || '2024-01-15',
          lat: issue.lat || 26.85 + (idx * 0.003),
          lon: issue.lon || 75.80 + (idx * 0.003),
          reporter: issue.reporter || 'citizen',
          image: issue.image || '',
        }));
      }
    }
  } catch (err) {
    console.warn('Could not read citizen app data:', err);
  }
  return [...DEFAULT_PROBLEMS];
}

function mapCategory(cat) {
  const map = { Roads: 'Pothole', Utilities: 'Streetlight', Waste: 'Garbage', Traffic: 'Streetlight' };
  return map[cat] || cat || 'Other';
}

function mapStatus(s) {
  if (!s) return 'Pending';
  if (s === 'Active') return 'Pending';
  if (s === 'In Progress') return 'In Progress';
  if (s === 'Resolved') return 'Resolved';
  return s;
}

function derivePriority(votes) {
  if (votes >= 20) return 'High';
  if (votes >= 10) return 'Medium';
  return 'Low';
}

/** Save updated problems array back to localStorage */
function saveProblems(problems) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let data = raw ? JSON.parse(raw) : {};
    // Update issues in citizen app format
    data.issues = problems.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      location: p.location,
      category: p.type === 'Pothole' ? 'Roads' : p.type === 'Water' ? 'Utilities' : p.type === 'Garbage' ? 'Waste' : p.type === 'Streetlight' ? 'Utilities' : 'Roads',
      status: p.status === 'Pending' ? 'Active' : p.status,
      upvotes: p.votes,
      date: p.reportedDate,
      lat: p.lat,
      lon: p.lon,
      reporter: p.reporter,
      image: p.image,
      scope: 'local',
    }));
    data.version = 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving problems:', err);
  }
}

export const dataService = {
  getProblems() {
    return loadProblems();
  },

  updateProblemStatus(problemId, newStatus) {
    const problems = loadProblems();
    const idx = problems.findIndex(p => p.id === problemId);
    if (idx === -1) return problems;
    problems[idx] = { ...problems[idx], status: newStatus };
    saveProblems(problems);
    return problems;
  },

  getStats() {
    const problems = loadProblems();
    const total = problems.length;
    const resolved = problems.filter(p => p.status === 'Resolved').length;
    const pending = problems.filter(p => p.status === 'Pending').length;
    const inProgress = problems.filter(p => p.status === 'In Progress').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, resolved, pending, inProgress, resolutionRate: rate };
  },

  getMonthlyData() {
    return [
      { month: 'Jan', reported: 45, resolved: 30 },
      { month: 'Feb', reported: 52, resolved: 38 },
      { month: 'Mar', reported: 38, resolved: 35 },
      { month: 'Apr', reported: 41, resolved: 33 },
      { month: 'May', reported: 36, resolved: 28 },
      { month: 'Jun', reported: 35, resolved: 25 },
    ];
  },

  getTypeDistribution() {
    const problems = loadProblems();
    const types = {};
    problems.forEach(p => {
      types[p.type] = (types[p.type] || 0) + 1;
    });
    return Object.entries(types).map(([name, count]) => ({ name, count }));
  },

  getTopTypes() {
    const dist = dataService.getTypeDistribution();
    dist.sort((a, b) => b.count - a.count);
    return dist;
  },
};
