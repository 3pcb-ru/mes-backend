import { Test, TestingModule } from '@nestjs/testing';
import { GET_PAYLOAD } from '@/utils/ok.utils';
import { OrganizationController } from '../organization.controller';
import { OrganizationService } from '../organization.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { UpdateOrganizationDto } from '../organization.dto';
import { JwtUser } from '@/types/jwt.types';

describe('OrganizationController', () => {
    let controller: OrganizationController;
    let service: OrganizationService;

    const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        timezone: 'UTC',
        logoId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUser: JwtUser = {
        id: 'user-1',
        email: 'test@example.com',
        roleId: 'role-1',
        organizationId: 'org-1',
        permissions: ['organizations.update'],
    };

    const mockOrganizationService = {
        update: jest.fn().mockResolvedValue(mockOrg),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrganizationController],
            providers: [
                {
                    provide: OrganizationService,
                    useValue: mockOrganizationService,
                },
            ],
        })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(PermissionGuard)
        .useValue({ canActivate: () => true })
        .compile();

        controller = module.get<OrganizationController>(OrganizationController);
        service = module.get<OrganizationService>(OrganizationService);
        
        jest.clearAllMocks();
    });

    describe('update', () => {
        it('should update organization and return success response', async () => {
            const updateDto: UpdateOrganizationDto = { name: 'Updated Org Name' };
            const result = await controller.update(mockUser, updateDto);
            const payload = result[GET_PAYLOAD]();

            expect(payload.data).toEqual(mockOrg);
            expect(payload.message).toBe('Organization updated successfully');
            expect(service.update).toHaveBeenCalledWith('org-1', updateDto, mockUser);
        });
    });
});
