import { BadRequestException } from '@nestjs/common';
import { RolesService } from '@/modules/roles/roles.service';
import { JwtUser } from '@/types/jwt.types';

describe('RolesService (unit)', () => {
    let svc: RolesService;
    let mockDrizzle: any;
    let mockLogger: any;
    let mockRedis: any;
    let mockEventEmitter: any;
    let mockUserService: any;
    let mockFilterService: any;

    const mockUser: JwtUser = {
        sub: 'user-id',
        email: 'test@example.com',
        roleId: 'role-id',
        organizationId: 'org-id',
    };

    beforeEach(() => {
        mockDrizzle = {
            database: {
                query: {
                    roles: {
                        findFirst: jest.fn(),
                    },
                    permissions: {
                        findMany: jest.fn(),
                    },
                    rolePermissions: {
                        findMany: jest.fn(),
                    },
                },
                transaction: jest.fn((cb) => cb(mockDrizzle.database)),
                delete: jest.fn().mockReturnThis(),
                where: jest.fn().mockImplementation(() => {
                    const res: any = [];
                    res.returning = jest.fn().mockResolvedValue([]);
                    return res;
                }),
                insert: jest.fn().mockReturnThis(),
                values: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
            },
        };

        // Mock nested redis client for syncAll or setPermissionToken
        const mockRedisClient = {
            pipeline: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([]),
        };

        mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
            setContext: jest.fn(),
        };
        mockRedis = {
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn().mockResolvedValue(null),
            getClient: jest.fn().mockReturnValue(mockRedisClient),
        };
        mockEventEmitter = {
            emit: jest.fn(),
        };
        mockUserService = {
            findOne: jest.fn(),
        };
        mockFilterService = {
            filterable: jest.fn().mockReturnThis(),
        };

        svc = new RolesService(
            mockDrizzle as any,
            mockLogger as any,
            mockRedis as any,
            mockEventEmitter as any,
            mockUserService as any,
            mockFilterService as any,
        );
    });

    describe('updatePermissions', () => {
        it('should resolve permission names to UUIDs and synchronize mappings', async () => {
            const roleId = 'target-role-uuid';
            const inputNames = ['orders.read', 'orders.write'];

            // 1. Mock finding the role
            mockDrizzle.database.query.roles.findFirst.mockResolvedValue({
                id: roleId,
                name: 'Test Role',
                organizationId: 'org-id',
            });

            // 2. Mock resolving names to UUIDs
            mockDrizzle.database.query.permissions.findMany.mockResolvedValue([
                { id: 'uuid-read', name: 'orders.read' },
                { id: 'uuid-write', name: 'orders.write' },
            ]);

            // 3. Mock existing permissions (assume it already has 'orders.read' and 'orders.delete')
            mockDrizzle.database.query.rolePermissions.findMany.mockResolvedValue([
                { permissionId: 'uuid-read' }, // Should keep
                { permissionId: 'uuid-delete' }, // Should delete
            ]);

            await svc.updatePermissions(roleId, inputNames, mockUser);

            // Verify lookup by name was called
            expect(mockDrizzle.database.query.permissions.findMany).toHaveBeenCalled();
            
            // Verify deletion of 'uuid-delete'
            expect(mockDrizzle.database.delete).toHaveBeenCalled();
            
            // Verify insertion of 'uuid-write'
            expect(mockDrizzle.database.insert).toHaveBeenCalled();
            const insertCall = mockDrizzle.database.values.mock.calls.find((call: any) => 
                Array.isArray(call[0]) && call[0].some((item: any) => item.permissionId === 'uuid-write')
            );
            expect(insertCall).toBeDefined();
            
            // Verify redis update
            expect(mockRedis.set).toHaveBeenCalledWith(
                `perms:${roleId}`,
                expect.stringContaining('[]'), // Since we mocked select().from()... to return nothing by default in setPermissionToken
            );
        });

        it('should throw BadRequestException if any provided permission name is not found', async () => {
            const roleId = 'target-role-uuid';
            const inputNames = ['valid.name', 'invalid.name'];

            mockDrizzle.database.query.roles.findFirst.mockResolvedValue({
                id: roleId,
                organizationId: 'org-id',
            });

            // Only one found
            mockDrizzle.database.query.permissions.findMany.mockResolvedValue([
                { id: 'uuid-valid', name: 'valid.name' },
            ]);

            await expect(svc.updatePermissions(roleId, inputNames, mockUser))
                .rejects.toThrow(BadRequestException);
            
            await expect(svc.updatePermissions(roleId, inputNames, mockUser))
                .rejects.toThrow('Provided permission names have no corresponding permissions.');
        });

        it('should throw BadRequestException if trying to modify a system role (no organizationId)', async () => {
            const roleId = 'system-role-uuid';
            mockDrizzle.database.query.roles.findFirst.mockResolvedValue({
                id: roleId,
                organizationId: null, // System role
            });

            await expect(svc.updatePermissions(roleId, ['any.perm'], mockUser))
                .rejects.toThrow(BadRequestException);
            
            await expect(svc.updatePermissions(roleId, ['any.perm'], mockUser))
                .rejects.toThrow('System roles cannot be modified.');
        });
    });
});
