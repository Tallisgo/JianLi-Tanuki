import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface NotificationItem {
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
    time: Date;
    read: boolean;
    candidateId?: string;
    candidateName?: string;
}

interface NotificationContextType {
    notifications: NotificationItem[];
    unreadCount: number;
    addNotification: (notification: Omit<NotificationItem, 'id' | 'time' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
        // 从 localStorage 恢复通知
        const saved = localStorage.getItem('notifications');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((n: any) => ({ ...n, time: new Date(n.time) }));
            } catch {
                return [];
            }
        }
        return [];
    });

    // 保存到 localStorage
    const saveToStorage = useCallback((items: NotificationItem[]) => {
        localStorage.setItem('notifications', JSON.stringify(items));
    }, []);

    const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'time' | 'read'>) => {
        const newNotification: NotificationItem = {
            ...notification,
            id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            time: new Date(),
            read: false
        };
        setNotifications(prev => {
            const updated = [newNotification, ...prev].slice(0, 50); // 最多保留50条
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    const clearAll = useCallback(() => {
        setNotifications([]);
        localStorage.removeItem('notifications');
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            removeNotification,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

