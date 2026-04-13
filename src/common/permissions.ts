export const Permissions = {
    orders: {
        Read: 'orders.read',
        ReadAll: 'orders.read.all',
        Write: 'orders.write',
        Update: 'orders.update',
        UpdateAll: 'orders.update.all',
        Delete: 'orders.delete',
        DeleteAll: 'orders.delete.all',
        AssignWorkflow: 'orders.assign_workflow',
        WriteProduct: 'orders.write_product',
        ActivateProduct: 'orders.activate_product',
        CancelProduct: 'orders.cancel_product',
    },
    users: {
        Read: 'users.read',
        ReadAll: 'users.read.all',
        Write: 'users.write',
        Update: 'users.update',
        UpdateAll: 'users.update.all',
        Delete: 'users.delete',
        DeleteAll: 'users.delete.all',
    },
    tickets: {
        Read: 'tickets.read',
        ReadAll: 'tickets.read.all',
        ReadQuotation: 'tickets.read.quotation',
        Update: 'tickets.update',
        UpdateAll: 'tickets.update.all',
        Delete: 'tickets.delete',
        DeleteAll: 'tickets.delete.all',
        UpdateStatus: 'tickets.update_status',
        UpdateStatusAll: 'tickets.update_status.all',
        AddMessage: 'tickets.add_message',
        AddMessageAll: 'tickets.add_message.all',
    },
    roles: {
        Read: 'roles.read',
        Write: 'roles.write',
        Update: 'roles.update',
        Change: 'roles.change',
        ChangePermissions: 'roles.change_permissions',
        Delete: 'roles.delete',
    },
    attachments: {
        Read: 'attachments.read',
        ReadAll: 'attachments.read.all',
        Write: 'attachments.write',
        Update: 'attachments.update',
        UpdateAll: 'attachments.update.all',
        Delete: 'attachments.delete',
        DeleteAll: 'attachments.delete.all',
    },
    notifications: {
        Read: 'notifications.read',
        ReadAll: 'notifications.read.all',
        Update: 'notifications.update',
        Delete: 'notifications.delete',
    },
    organizations: {
        Create: 'organizations.write',
        Update: 'organizations.update',
        Delete: 'organizations.delete',
        Read: 'organizations.read',
        ReadAll: 'organizations.read.all',
    },
    nodes: {
        Write: 'nodes.write',
        Update: 'nodes.update',
        Delete: 'nodes.delete',
        Read: 'nodes.read',
        ReadAll: 'nodes.read.all',
    },
    bom_products: {
        Write: 'bom_products.write',
        Update: 'bom_products.update',
        Delete: 'bom_products.delete',
        Read: 'bom_products.read',
        ReadAll: 'bom_products.read.all',
    },
    bom_products_revisions: {
        Write: 'bom_products_revisions.write',
        Update: 'bom_products_revisions.update',
        Delete: 'bom_products_revisions.delete',
        Read: 'bom_products_revisions.read',
        ReadAll: 'bom_products_revisions.read.all',
    },
    bom: {
        Write: 'bom.write',
        Update: 'bom.update',
        Delete: 'bom.delete',
        Read: 'bom.read',
        ReadAll: 'bom.read.all',
    },
    products: {
        Read: 'products.read',
        ReadAll: 'products.read.all',
        Write: 'products.write',
        Update: 'products.update',
        Delete: 'products.delete',
    },
    work_orders: {
        Read: 'work_orders.read',
        ReadAll: 'work_orders.read.all',
        Write: 'work_orders.write',
        Update: 'work_orders.update',
        Delete: 'work_orders.delete',
        Release: 'work_orders.release',
    },
    user_addresses: {
        Read: 'user_addresses.read',
        ReadAll: 'user_addresses.read.all',
        Write: 'user_addresses.write',
        Update: 'user_addresses.update',
        Delete: 'user_addresses.delete',
    },
    traceability: {
        Read: 'traceability.read',
        ReadAll: 'traceability.read.all',
        Write: 'traceability.write',
    },
    execution: {
        Read: 'execution.read',
        ReadAll: 'execution.read.all',
        Write: 'execution.write',
    },
    connectivity: {
        Read: 'connectivity.read',
        Write: 'connectivity.write',
        Ingest: 'connectivity.ingest',
    },
    inventory: {
        Read: 'inventory.read',
        ReadAll: 'inventory.read.all',
        Write: 'inventory.write',
        Update: 'inventory.update',
        Delete: 'inventory.delete',
    },
} as const;

export const PermissionDescriptions: Record<string, string> = {
    // --- Orders ---
    'orders.read': 'Read own orders',
    'orders.read.all': 'Read all orders in the system',
    'orders.write': 'Create new orders',
    'orders.update': 'Update own orders',
    'orders.update.all': 'Update any order in the system',
    'orders.delete': 'Delete own orders',
    'orders.delete.all': 'Delete any order in the system',
    'orders.assign_workflow': 'Assign workflow to an order',
    'orders.write_product': 'Create product revisions',
    'orders.activate_product': 'Activate product revisions',
    'orders.cancel_product': 'Cancel product revisions',

    // --- Order Stages & Files ---
    'order_stages.update': 'Update order stages (e.g., move order between stages)',
    'order_stages.read_files': 'View/download files attached to an order stage',
    'order_stages.upload_files': 'Upload new files to an order stage',
    'order_stages.delete_files': 'Delete files from an order stage',

    // --- Users ---
    'users.read': 'Read own user information',
    'users.read.all': 'Read information of all users',
    'users.write': 'Create new users',
    'users.update': 'Update own user profile',
    'users.update.all': 'Update any user account',
    'users.delete': 'Deactivate/delete own account',
    'users.delete.all': 'Delete or deactivate any user account',

    // --- Tickets ---
    'tickets.read': 'Read own tickets and messages',
    'tickets.read.all': 'Read all tickets and messages in the system, including internal messages',
    'tickets.read.quotation': 'Read all quotation type tickets',
    'tickets.update': 'Update own tickets',
    'tickets.update.all': 'Update any ticket',
    'tickets.delete': 'Delete own tickets',
    'tickets.delete.all': 'Delete any ticket in the system',
    'tickets.update_status': 'Change the status of tickets (e.g., open → closed)',
    'tickets.update_status.all': 'Change the status of all tickets (e.g., open → closed)',
    'tickets.add_message': 'Add message to own tickets',
    'tickets.add_message.all': 'Add message to all tickets, including internal messages',

    // --- Roles & Permissions ---
    'roles.read': 'View roles and their permissions',
    'roles.write': 'Create new roles',
    'roles.update': 'Update existing roles (e.g., rename)',
    'roles.change': 'Change a user’s role',
    'roles.change_permissions': 'Add or remove permissions from a role',
    'roles.delete': 'Delete existing roles',

    // --- Attachments ---
    'attachments.read': 'Read own attachments',
    'attachments.read.all': 'Read all attachments in the system',
    'attachments.write': 'Upload new attachments',
    'attachments.update': 'Update own attachments',
    'attachments.update.all': 'Update any attachment',
    'attachments.delete': 'Delete own attachments',
    'attachments.delete.all': 'Delete any attachment in the system',

    // --- Notifications ---
    'notifications.read': 'Read own notifications',
    'notifications.read.all': 'Read all notifications in the system',
    'notifications.update': 'Update own notifications (e.g., mark as read)',
    'notifications.delete': 'Delete own notifications',

    // --- Organizations ---
    'organizations.update': 'Update organization information (name, logo, etc.)',
    'organizations.write': 'Create and link a new organization',
    'organizations.delete': 'Delete organization',
    'organizations.read': 'Read organization information',
    'organizations.read.all': 'Read all organizations in the system',

    // --- Nodes ---
    'nodes.write': 'Create and configure factory nodes/equipment',
    'nodes.update': 'Update node configuration and capabilities',
    'nodes.delete': 'Remove nodes from the factory hierarchy',
    'nodes.read': 'View factory nodes and their status',
    'nodes.read.all': 'View all factory nodes in the system',

    // --- BOM Management ---
    'bom.write': 'Create new Bill of Materials',
    'bom.update': 'Update existing BOMs',
    'bom.delete': 'Delete BOMs',
    'bom.read': 'View own BOMs',
    'bom.read.all': 'View all BOMs in the system',

    // --- Products ---
    'products.read': 'Read own products',
    'products.read.all': 'Read all products in the system',
    'products.write': 'Create new products',
    'products.update': 'Update products',
    'products.delete': 'Delete products',

    // --- Work Orders ---
    'work_orders.read': 'Read own work orders',
    'work_orders.read.all': 'Read all work orders in the system',
    'work_orders.write': 'Create new work orders',
    'work_orders.update': 'Update work orders',
    'work_orders.delete': 'Delete work orders',
    'work_orders.release': 'Release work orders to production',

    // --- User Addresses ---
    'user_addresses.read': 'Read own addresses',
    'user_addresses.read.all': 'Read all user addresses',
    'user_addresses.write': 'Create new addresses',
    'user_addresses.update': 'Update own addresses',
    'user_addresses.delete': 'Delete own addresses',

    // --- Traceability ---
    'traceability.read': 'Read own traceability data',
    'traceability.read.all': 'Read all traceability data in the system',
    'traceability.write': 'Create traceability records',

    // --- Execution ---
    'execution.read': 'Read execution data',
    'execution.read.all': 'Read all execution data in the system',
    'execution.write': 'Create/update execution records',

    // --- Connectivity ---
    'connectivity.read': 'Read connectivity status',
    'connectivity.write': 'Configure connectivity',
    'connectivity.ingest': 'Ingest data from external sources',

    // --- Inventory ---
    'inventory.read': 'Read own inventory data',
    'inventory.read.all': 'Read all inventory data in the system',
    'inventory.write': 'Create inventory records',
    'inventory.update': 'Update inventory data',
    'inventory.delete': 'Delete inventory records',
};
