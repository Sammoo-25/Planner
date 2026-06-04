const getApiUrl = () => {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5005/api';
    // Remove trailing slash if present
    let url = rawUrl.replace(/\/$/, '');
    // Ensure it ends with /api
    if (!url.endsWith('/api')) {
        url += '/api';
    }
    return url;
};

const API_URL = getApiUrl();

async function handleResponse(response: Response) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/signin';
                    return new Promise(() => {}); // Halt execution to prevent red screen while redirecting
                }
            }
            throw new Error(data.message || 'API Error');
        }
        return data;
    } else {
        const text = await response.text();
        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/signin';
                    return new Promise(() => {});
                }
            }
            throw new Error(text || 'API Error');
        }
        return text;
    }
}

export const api = {
    async signup(userData: any) {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return handleResponse(response);
    },

    async signin(credentials: any) {
        const response = await fetch(`${API_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        return handleResponse(response);
    },

    async getTasks() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return handleResponse(response);
    },

    async createTask(taskData: any) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData),
        });
        return handleResponse(response);
    },

    async updateTask(id: string, taskData: any) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData),
        });
        return handleResponse(response);
    },

    async deleteTask(id: string) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return handleResponse(response);
    },

    async getStats() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return handleResponse(response);
    },

    async updateStats(statsData: any) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/stats`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(statsData),
        });
        return handleResponse(response);
    },

    // --- Subtasks ---
    async getSubtasks(taskId: string) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/tasks/${taskId}/subtasks`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return handleResponse(response);
    },

    async addSubtask(taskId: string, title: string) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/subtasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ task_id: taskId, title })
        });
        return handleResponse(response);
    },

    async updateSubtask(subtaskId: string, updates: { title?: string, is_completed?: boolean }) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/subtasks/${subtaskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        return handleResponse(response);
    },

    async deleteSubtask(subtaskId: string) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/subtasks/${subtaskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return handleResponse(response);
    },

    // --- Focus Sessions ---

    async saveFocusSession(taskId: string | null, durationMinutes: number, xpEarned: number) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/focus-sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ task_id: taskId, duration_minutes: durationMinutes, xp_earned: xpEarned })
        });
        return handleResponse(response);
    },

    async getFocusSessions(limit = 50) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/focus-sessions?limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // --- Daily Quests ---

    async getDailyQuests() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/daily-quests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async completeDailyQuest(questId: string) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/daily-quests/${questId}/complete`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    // --- Achievements ---

    async getAchievements() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/achievements`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async unlockAchievement(key: string, title: string, description: string, xpReward: number) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/achievements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ achievement_key: key, achievement_title: title, achievement_description: description, xp_reward: xpReward })
        });
        return handleResponse(response);
    },

    // --- Preferences ---

    async getPreferences() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/preferences`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async updatePreferences(prefs: Record<string, unknown>) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(prefs)
        });
        return handleResponse(response);
    },

    // --- Habits ---

    async getHabits() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/habits`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async createHabit(habitData: Record<string, unknown>) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/habits`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(habitData)
        });
        return handleResponse(response);
    },

    async checkinHabit(habitId: string, notes?: string) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/habits/${habitId}/checkin`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notes: notes || null })
        });
        return handleResponse(response);
    },

    async updateHabit(habitId: string, updates: Record<string, unknown>) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/habits/${habitId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        return handleResponse(response);
    },

    // --- Agent API ---

    async agentChat(message: string) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/agent/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message })
        });
        return handleResponse(response);
    },

    async getAgentInsights(timeRange: '7d' | '30d' | 'all' = '30d') {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/agent/insights?time_range=${timeRange}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async getAgentDailyQuests() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/agent/daily-quests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async getAgentSchedule(date: string) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/agent/schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ date })
        });
        return handleResponse(response);
    },

    async getAgentCompanion() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/agent/companion`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async getAgentHabits() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/agent/habits`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async getAgentFocus() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/agent/focus`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async getAgentAchievements() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/agent/achievements`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    async getQuestBoard() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/agent/quest-board`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse(response);
    },

    setToken(token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
    },

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    },

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
};
