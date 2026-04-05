import { initialIssues, ngos, municipalities } from '../data/mockData';

const STORAGE_KEY = 'civicConnectData';
const DATA_VERSION = 1;

export const storageService = {
    getData: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            const parsedData = data ? JSON.parse(data) : null;
            const defaultData = { issues: [...initialIssues], leaderboard: { ngos, municipalities }, version: DATA_VERSION };
            if (parsedData && parsedData.version === DATA_VERSION) {
                const userAddedIssues = parsedData.issues.filter(issue => !initialIssues.find(initial => initial.id === issue.id));
                const updatedInitialIssues = initialIssues.map(initial => {
                    const existing = parsedData.issues.find(issue => issue.id === initial.id);
                    return existing ? { ...initial, upvotes: existing.upvotes } : initial;
                });
                defaultData.issues = [...updatedInitialIssues, ...userAddedIssues];
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
            return defaultData;
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            return { issues: initialIssues, leaderboard: { ngos, municipalities }, version: DATA_VERSION };
        }
    },
    saveData: (data) => {
        try {
            const dataWithVersion = { ...data, version: DATA_VERSION };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithVersion));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },
};
