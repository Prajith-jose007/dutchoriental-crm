
import { useState, useEffect } from 'react';

export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Sales' | 'Accounts';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';

export function useUserRole() {
    const [role, setRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedRole = localStorage.getItem(USER_ROLE_STORAGE_KEY);
            // Normalize role string to title case (e.g. 'super admin' -> 'Super Admin') or matching known types
            // The login page now stores the exact designation string from DB, which should match UserRole values.
            if (storedRole) {
                // Normalize to expected Title Case format for strict comparison
                const lowerRole = storedRole.toLowerCase();
                let normalizedRole: UserRole | null = null;

                if (lowerRole === 'super admin') normalizedRole = 'Super Admin';
                else if (lowerRole === 'admin') normalizedRole = 'Admin';
                else if (lowerRole === 'manager') normalizedRole = 'Manager';
                else if (lowerRole === 'sales') normalizedRole = 'Sales';
                else if (lowerRole === 'accounts') normalizedRole = 'Accounts';

                if (normalizedRole) {
                    setRole(normalizedRole);
                } else {
                    // Fallback to stored value if it matches strict type directly, or just set it
                    setRole(storedRole as UserRole);
                }
            }
        } catch (e) {
            console.error("Failed to read user role from storage", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const hasPermission = (permission: Permission) => {
        if (!role) return false;

        switch (permission) {
            case 'manage_users':
                return role === 'Super Admin' || role === 'Admin';
            case 'view_users':
                return role === 'Super Admin' || role === 'Admin';
            default:
                return true;
        }
    };

    return { role, isLoading, hasPermission };
}

export type Permission =
    | 'manage_users'
    | 'view_users'
    | 'create_agent'
    | 'edit_agent'
    | 'delete_agent'
    | 'manage_bookings'
    | 'delete_bookings'
    | 'bypass_closed_lock'
    | 'export_data'
    | 'view_reports'
    | 'manage_accounts'
    | 'manage_yachts';
