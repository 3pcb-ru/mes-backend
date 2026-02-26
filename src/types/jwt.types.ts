export interface JwtUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roleId: string;
    organizationId: string;
    permissions: string[];
}
