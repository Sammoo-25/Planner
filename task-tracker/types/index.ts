export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Status = 'To Do' | 'In Progress' | 'Done';

export interface Task {
    id: string;
    title: string;
    category: string;
    priority: Priority;
    deadline: string; // ISO Date
    status: Status;
    isOverdue?: boolean;
    startTime?: string | null;
    duration?: number;
    completedAt?: string; // ISO Date for heatmap/history
    subtaskCount?: number;
    completedSubtaskCount?: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    unlockedAt: string;
    icon: string;
}

export interface FocusSession {
    id: string;
    taskId: string;
    duration: number; // minutes
    xpEarned: number;
    timestamp: string;
}

export interface PlayerStats {
    level: number;
    currentExp: number;
    maxExp: number;
    health: number; // 0-100
    streak: number;
    totalXP: number;
    xpHistory: { date: string, amount: number }[]; // For LineChart
    achievements: Achievement[];
    avatarUrl: string;
    focusStats: {
        totalSessions: number;
        totalMinutes: number;
        history: FocusSession[];
    };
}

export const INITIAL_STATS: PlayerStats = {
    level: 1,
    currentExp: 0,
    maxExp: 100,
    health: 100,
    streak: 0,
    totalXP: 0,
    avatarUrl: "/hero-avatar.png",
    xpHistory: [],
    achievements: [],
    focusStats: {
        totalSessions: 0,
        totalMinutes: 0,
        history: []
    }
};
