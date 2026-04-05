export const mockApiService = {
    getAverageResponseTime: async (pincode) =>
        new Promise((resolve) => setTimeout(() => resolve({ days: Math.floor(Math.random() * 5) + 2 }), 1000)),
};
