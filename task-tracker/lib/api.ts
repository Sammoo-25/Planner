const API_URL = 'http://127.0.0.1:5005/api';

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
