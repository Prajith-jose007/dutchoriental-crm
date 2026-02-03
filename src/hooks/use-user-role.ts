
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
            case 'create_agent':
                // "managers to monitor particular team and add the agents if new"
                return role === 'Super Admin' || role === 'Admin' || role === 'Manager';
            case 'edit_agent':
                // "sales... should not be able to access the agent creation or modification"
                return role === 'Super Admin' || role === 'Admin' || role === 'Manager';
            case 'delete_agent':
                // Assuming managers can only add vs delete might be restricted? 
                // For now, let's allow managers to manage agents fully as per "monitor particular team".
                // Refined: Super Admin/Admin usually delete. Let's keep delete strict.
                return role === 'Super Admin' || role === 'Admin';
            case 'manage_bookings':
                // Sales has only to entry the data... and checkin
                return role === 'Super Admin' || role === 'Admin' || role === 'Manager' || role === 'Sales';
            case 'export_data':
                // "Sales... export the data of each day"
                // Accounts need reports which implies export too
                return role === 'Super Admin' || role === 'Admin' || role === 'Manager' || role === 'Sales' || role === 'Accounts';
            case 'view_reports':
                // "sales... should not be able to access..." (implied context of restrictions)
                // Accounts: "able to get the report"
                return role === 'Super Admin' || role === 'Admin' || role === 'Manager' || role === 'Accounts';
            case 'manage_yachts':
                return role === 'Super Admin' || role === 'Admin';
            case 'manage_accounts':
                // "invoicing , credit not, credit statements etc related to accounts"
                return role === 'Super Admin' || role === 'Admin' || role === 'Accounts';
            case 'delete_bookings':
                return role === 'Super Admin' || role === 'Admin';
            case 'bypass_closed_lock':
                return role === 'Super Admin' || role === 'Admin' || role === 'Manager';
            default:
                return false;
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
