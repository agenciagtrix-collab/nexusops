import { useAuth } from '@/lib/AuthContext';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'user';

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  return {
    isAdmin,
    isSuperAdmin,
    canCreate: isAdmin,
    canEdit: isAdmin,
    canDelete: isAdmin,
    canManageUsers: isAdmin,
    canManageSettings: isAdmin,
    canViewAnalytics: true,
    canInviteUsers: isAdmin,
    canChangeRoles: isSuperAdmin,
    canManageGlobalSettings: isSuperAdmin,
    canViewAllProjects: isSuperAdmin,
    role,
    roleLabel: role === 'super_admin' ? 'Super Administrador' : role === 'admin' ? 'Administrador' : 'Usuário',
  };
}