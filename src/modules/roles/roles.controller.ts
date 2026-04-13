import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { JwtUser } from '@/types/jwt.types';
import { ok, OkResponseBuilder } from '@/utils';

import { RolesDecorators } from './roles.decorators';
import { AssignRoleDto, CreateRoleDto, UpdateRoleDetailsDto, UpdateRolePermissionsDto } from './roles.dto';
import { RolesService } from './roles.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Post('create')
    @RolesDecorators('create')
    async create(@Body() body: CreateRoleDto, @CurrentUser() user: JwtUser) {
        const newRole = await this.rolesService.create(body, user);

        return ok(newRole).message('Role created successfully.');
    }

    @Post(':roleId/duplicate')
    @RolesDecorators('duplicate')
    async duplicate(@Param('roleId') roleId: string, @CurrentUser() user: JwtUser) {
        const newRole = await this.rolesService.duplicate(roleId, user);

        return ok(newRole).message('Role duplicated successfully.');
    }

    @Get('lookup')
    @RolesDecorators('lookup')
    async lookup(@CurrentUser() user: JwtUser) {
        const result = await this.rolesService.lookup(user);

        return ok(result).message('Roles fetched successfully');
    }

    @Get('list')
    @RolesDecorators('list')
    async list(@Query() query: PaginatedFilterQueryDto, @CurrentUser() user: JwtUser) {
        const result = await this.rolesService.list(user, query);

        return ok(result.data).message('Roles fetched successfully').paginate({
            total: result.total,
            page: result.page,
            limit: result.limit,
        });
    }

    @Get(':roleId')
    @RolesDecorators('findOne')
    async findOne(@Param('roleId') roleId: string, @CurrentUser() user: JwtUser) {
        const result = await this.rolesService.findOneWithPermissions(roleId, user);

        return ok(result).message('Role fetched successfully!');
    }

    @Put('assign')
    @RolesDecorators('assign')
    async assign(@Body() body: AssignRoleDto) {
        const { userId, roleId } = body;

        const updatedUser = await this.rolesService.assignToUser(userId, roleId);

        return ok(updatedUser).message('Role assigned successfully.');
    }

    @Put('update-permissions/:roleId')
    @RolesDecorators('update-permissions')
    async updatePermissions(@Body() body: UpdateRolePermissionsDto, @Param('roleId') roleId: string, @CurrentUser() user: JwtUser): Promise<OkResponseBuilder<boolean>> {
        const { permissionIds } = body;

        await this.rolesService.updatePermissions(roleId, permissionIds, user);

        return ok(true).message('Permissions updated successfully.');
    }

    @Put('update-details/:roleId')
    @RolesDecorators('update-details')
    async updateDetails(@Body() body: UpdateRoleDetailsDto, @Param('roleId') roleId: string, @CurrentUser() user: JwtUser) {
        const updated = await this.rolesService.updateDetails(roleId, body, user);

        return ok(updated).message('Role detail updated successfully!');
    }

    @Delete(':roleId')
    @RolesDecorators('delete')
    async delete(@Param('roleId') roleId: string, @CurrentUser() user: JwtUser) {
        await this.rolesService.delete(roleId, user);

        return ok(true).message('Role deleted successfully.');
    }
}
