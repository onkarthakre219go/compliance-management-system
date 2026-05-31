export const Roles = {
  Admin: 'Admin',
  Manager: 'Manager',
  Employee: 'Employee',
  Trainee: 'Trainee'
} as const;

export type Role = typeof Roles[keyof typeof Roles];

export type Permission =
  | 'clients:read'
  | 'clients:create'
  | 'clients:update'
  | 'clients:delete'
  | 'tasks:read'
  | 'tasks:create'
  | 'tasks:update'
  | 'tasks:delete'
  | 'invoices:read'
  | 'invoices:create'
  | 'invoices:update'
  | 'invoices:send'
  | 'reports:read'
  | 'expenses:read'
  | 'expenses:create'
  | 'expenses:update'
  | 'expenses:delete'
  | 'compliance:manage'
  | 'notifications:send'
  | 'users:manage';

export const permissionMatrix: Record<Role, Permission[]> = {
  Admin: [
    'clients:read',
    'clients:create',
    'clients:update',
    'clients:delete',
    'tasks:read',
    'tasks:create',
    'tasks:update',
    'tasks:delete',
    'invoices:read',
    'invoices:create',
    'invoices:update',
    'invoices:send',
    'reports:read',
    'expenses:read',
    'expenses:create',
    'expenses:update',
    'expenses:delete',
    'compliance:manage',
    'notifications:send',
    'users:manage'
  ],

  Manager: [
    'clients:read',
    'clients:create',
    'clients:update',
    'clients:delete',
    'tasks:read',
    'tasks:create',
    'tasks:update',
    'tasks:delete',
    'invoices:read',
    'invoices:create',
    'invoices:update',
    'invoices:send',
    'reports:read',
    'expenses:read',
    'expenses:create',
    'expenses:update',
    'expenses:delete',
    'compliance:manage',
    'notifications:send'
  ],

  Employee: [
    'clients:read',
    'tasks:read',
    'tasks:create',
    'tasks:update',
    'invoices:read',
    'reports:read',
    'expenses:read',
    'expenses:create',
    'expenses:update'
  ],

  Trainee: [
    'clients:read',
    'tasks:read',
    'reports:read'
  ]
};

export function getRolePermissions(role: Role): Permission[] {
  return permissionMatrix[role] || [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return getRolePermissions(role).includes(permission);
}

export function isRoleAllowed(role: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(role);
}

/*
Permissions Matrix Overview:

Role      | Clients      | Tasks         | Invoices       | Reports   | Expenses    | Compliance   | Notifications | Users
----------|--------------|---------------|----------------|-----------|-------------|--------------|---------------|--------
Admin     | CRUD         | CRUD          | CRUD + Send    | Read      | CRUD        | Manage       | Send          | Manage
Manager   | CRUD         | CRUD          | CRUD + Send    | Read      | CRUD        | Manage       | Send          | -
Employee  | Read         | CRU           | Read           | Read      | CRU         | -            | -             | -
Trainee   | Read         | Read          | -              | Read      | -           | -            | -             | -
*/
