import { UserRole } from '@fire-system/shared-types';

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function canManageExtinguishers(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function canEditExtinguishers(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/** Facility managers and inspectors may browse the fleet but not change records. */
export function isExtinguisherReadOnly(role: UserRole): boolean {
  return role === UserRole.USER || role === UserRole.INSPECTOR;
}

export function canLogMaintenance(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.INSPECTOR;
}

export function canCompleteInspections(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.INSPECTOR;
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Enterprise Admin';
    case UserRole.INSPECTOR:
      return 'Field Inspector';
    default:
      return 'Facility Manager';
  }
}
