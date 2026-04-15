import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { DrizzleService } from '@/models/model.service';

import { AttachmentService } from '../../attachments/attachment.service';
import { SetupService } from '../../node/setup.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from '../organization.dto';
import { OrganizationService } from '../organization.service';

describe('OrganizationService', () => {
    let service: OrganizationService;
    let attachmentService: AttachmentService;
    let setupService: SetupService;

    const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        timezone: 'UTC',
        logoId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const mockUser = {
        id: 'user-1',
        organizationId: 'org-1',
        permissions: ['organizations.update', 'organizations.create'],
    };

    let mockResponses: any[] = [];
    const mockDatabase: any = {
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        transaction: jest.fn(async (cb) => cb(mockDatabase)),
        async then(onfulfilled: any, onrejected: any) {
            const next = mockResponses.shift();
            const val = next !== undefined ? next : [mockOrg];
            if (val instanceof Error) {
                return Promise.reject(val).then(onfulfilled, onrejected);
            }
            return Promise.resolve(val).then(onfulfilled, onrejected);
        },
    };

    const mockDrizzleService = {
        database: mockDatabase,
    };

    const mockAttachmentService = {
        findOne: jest.fn(),
    };

    const mockSetupService = {
        createDefaultSetup: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrganizationService,
                {
                    provide: DrizzleService,
                    useValue: mockDrizzleService,
                },
                {
                    provide: AttachmentService,
                    useValue: mockAttachmentService,
                },
                {
                    provide: SetupService,
                    useValue: mockSetupService,
                },
            ],
        }).compile();

        service = module.get<OrganizationService>(OrganizationService);
        attachmentService = module.get<AttachmentService>(AttachmentService);
        setupService = module.get<SetupService>(SetupService);

        jest.clearAllMocks();
        mockResponses = [];
    });

    describe('create', () => {
        it('should create organization and link user successfully', async () => {
            const createData: CreateOrganizationDto = { name: 'New Org', timezone: 'UTC' };
            const newOrg = { ...mockOrg, id: 'new-org-id', name: 'New Org' };
            mockResponses = [[newOrg]]; // For insert().returning()

            const result = await service.create(createData, mockUser as any);

            expect(result.id).toBe('new-org-id');
            expect(mockDatabase.insert).toHaveBeenCalled();
            expect(mockDatabase.update).toHaveBeenCalled();
            expect(mockSetupService.createDefaultSetup).toHaveBeenCalledWith(expect.anything(), 'new-org-id', 'New Org');
        });
    });

    describe('update', () => {
        it('should update organization name successfully', async () => {
            const updateData: UpdateOrganizationDto = { name: 'New Name' };
            const updatedOrg = { ...mockOrg, name: 'New Name' };
            mockResponses = [[updatedOrg]];

            const result = await service.update('org-1', updateData, mockUser as any);

            expect(result.name).toBe('New Name');
            expect(mockDatabase.update).toHaveBeenCalled();
        });

        it('should update logoId successfully after validation', async () => {
            const updateData: UpdateOrganizationDto = { logoId: 'logo-1' };
            const updatedOrg = { ...mockOrg, logoId: 'logo-1' };

            mockAttachmentService.findOne.mockResolvedValue({
                id: 'logo-1',
                isUploaded: true,
                mimeType: 'image/png',
            });
            mockResponses = [[updatedOrg]];

            const result = await service.update('org-1', updateData, mockUser as any);

            expect(result.logoId).toBe('logo-1');
            expect(attachmentService.findOne).toHaveBeenCalledWith('logo-1', mockUser);
        });

        it('should throw BadRequestException if logo file has not been uploaded', async () => {
            const updateData: UpdateOrganizationDto = { logoId: 'logo-1' };

            mockAttachmentService.findOne.mockResolvedValue({
                id: 'logo-1',
                isUploaded: false,
                mimeType: 'image/png',
            });

            await expect(service.update('org-1', updateData, mockUser as any)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if logo is not an image', async () => {
            const updateData: UpdateOrganizationDto = { logoId: 'logo-1' };

            mockAttachmentService.findOne.mockResolvedValue({
                id: 'logo-1',
                isUploaded: true,
                mimeType: 'application/pdf',
            });

            await expect(service.update('org-1', updateData, mockUser as any)).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if organization does not exist', async () => {
            const updateData: UpdateOrganizationDto = { name: 'New Name' };
            mockResponses = [[]]; // returning empty array from update

            await expect(service.update('nonexistent', updateData, mockUser as any)).rejects.toThrow(NotFoundException);
        });
    });

    describe('findOne', () => {
        it('should return an organization when found', async () => {
            mockResponses = [[mockOrg]];
            const result = await service.findOne('org-1');
            expect(result).toEqual(mockOrg);
        });

        it('should throw NotFoundException when organization not found', async () => {
            mockResponses = [[]];
            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });
});
