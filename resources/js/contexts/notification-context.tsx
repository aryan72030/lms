import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';
import { Notification } from '@/components/ui/notification';

interface NotificationData {
    id: string;
    type: 'success' | 'error' | 'info';
    title?: string;
    message: string;
    duration?: number;
}

interface NotificationContextType {
    showNotification: (notification: Omit<NotificationData, 'id'>) => void;
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showInfo: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
    undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);

    const showNotification = (notification: Omit<NotificationData, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = { ...notification, id };

        setNotifications((prev) => [...prev, newNotification]);
    };

    const showSuccess = (message: string, title?: string) => {
        showNotification({ type: 'success', message, title });
    };

    const showError = (message: string, title?: string) => {
        showNotification({ type: 'error', message, title });
    };

    const showInfo = (message: string, title?: string) => {
        showNotification({ type: 'info', message, title });
    };

    const removeNotification = (id: string) => {
        setNotifications((prev) =>
            prev.filter((notification) => notification.id !== id),
        );
    };

    return (
        <NotificationContext.Provider
            value={{ showNotification, showSuccess, showError, showInfo }}
        >
            {children}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map((notification) => (
                    <Notification
                        key={notification.id}
                        type={notification.type}
                        title={notification.title}
                        message={notification.message}
                        duration={notification.duration}
                        onClose={() => removeNotification(notification.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);

    if (context === undefined) {
        throw new Error(
            'useNotification must be used within a NotificationProvider',
        );
    }

    return context;
}
