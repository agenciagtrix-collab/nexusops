import { useAuth } from '@/lib/AuthContext';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'user';

  return {
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
    canCreate: role === 'admin' || role === 'super_admin',
    canDelete: role === 'admin' || role === 'super_admin',
    canManageUsers: role === 'admin' || role === 'super_admin',
    canManageSettings: role === 'admin' || role === 'super_admin',
    canViewAnalytics: true,
    role,
  };
}