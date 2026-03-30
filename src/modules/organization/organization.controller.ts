import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { ErrorResponseDto } from '@/common/dto/error.dto';
import { Permissions } from '@/common/permissions';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { RequiresPermissions } from '../auth/decorators/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { OrganizationApiResponseDto, CreateOrganizationDto, UpdateOrganizationDto } from './organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller('organization')
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) {}
    
    @Post()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequiresPermissions(Permissions.organizations.Create)
    @ApiOperation({ summary: 'Create and link a new organization' })
    @ApiResponse({ status: 201, type: OrganizationApiResponseDto, description: 'Organization created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - validation failed', type: ErrorResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden - missing permissions', type: ErrorResponseDto })
    async create(@CurrentUser() user: JwtUser, @Body() payload: CreateOrganizationDto) {
        const result = await this.organizationService.create(payload, user);
        return ok(result).message('Organization created and linked successfully');
    }

    @Patch()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequiresPermissions(Permissions.organizations.Update)
    @ApiOperation({ summary: 'Update organization information' })
    @ApiResponse({ status: 200, type: OrganizationApiResponseDto, description: 'Organization updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - validation failed', type: ErrorResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden - missing permissions', type: ErrorResponseDto })
    async update(@CurrentUser() user: JwtUser, @Body() payload: UpdateOrganizationDto) {
        const result = await this.organizationService.update(user.organizationId, payload, user);
        return ok(result).message('Organization updated successfully');
    }
}
