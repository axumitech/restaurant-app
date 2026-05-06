export const ADMIN_ROLES = {
  admin: 'admin',
};

export function isKnownAdminRole(role) {
  return Object.values(ADMIN_ROLES).includes(role);
}

export function getRoleLabel() {
  return 'Admin';
}

export function getDefaultAdminRoute() {
  return '/admin';
}
