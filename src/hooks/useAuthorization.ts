import { Role } from '../types';
import { useAppSelector } from '../store';

export function useAuthorization() {
  const userRole = useAppSelector((state) => state.auth.user?.role as Role | undefined);

  const canView = (roles: Role[]) => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  const hasRole = (role: Role) => userRole === role;

  return { userRole, canView, hasRole };
}
