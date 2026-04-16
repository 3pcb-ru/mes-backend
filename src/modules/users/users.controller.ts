import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { PaginatedFilterQueryDto } from '@/common/dto/filter.dto';
import { Pagination } from '@/types';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { UsersDecorators } from './users.decorators';
import { InviteUserDto, UpdateUserProfileDto, UpdateUserStatusDto } from './users.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly logger: CustomLoggerService,
    ) {
        this.logger.setContext(UsersController.name);
    }

    @Get()
    @UsersDecorators('list')
    async list(@Query() filterQuery: PaginatedFilterQueryDto, @CurrentUser() user: JwtUser) {
        const result = await this.usersService.list(filterQuery, user);
        const paginationDetails: Pagination = {
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
        return ok(result.data).message('Users fetched successfully').paginate(paginationDetails);
    }

    @Get('profile')
    @UsersDecorators('profileSelf')
    async getCurrentUser(@CurrentUser() currentUser: JwtUser) {
        const user = await this.usersService.findOne(currentUser.id, currentUser);
        return ok(user).message('User details fetched successfully.');
    }
    //
    @Get(':userId')
    @UsersDecorators('findOne')
    async findOne(@Param('userId') userId: string, @CurrentUser() reqUser: JwtUser) {
        if (userId !== reqUser.id && !reqUser.permissions.includes('users.read.all')) {
            throw new ForbiddenException('You can only view your own profile');
        }
        const user = await this.usersService.findOne(userId, reqUser);
        return ok(user).message('User profile fetched successfully');
    }

    @Put('profile/:userId')
    @UsersDecorators('updateProfile')
    async updateProfile(@Param('userId') userId: string, @Body() userData: UpdateUserProfileDto, @CurrentUser() currentUser: JwtUser) {
        if (userId !== currentUser.id && !currentUser.permissions.includes('users.update.all')) {
            throw new ForbiddenException('You can only update your own profile');
        }
        const user = await this.usersService.updateProfile(userId, userData, currentUser);
        return ok(user).message('Your profile has been updated successfully');
    }

    @Post('invite')
    @UsersDecorators('invite')
    async invite(@Body() inviteData: InviteUserDto, @CurrentUser() currentUser: JwtUser) {
        if (!currentUser.organizationId) {
            throw new ForbiddenException('You must belong to an organization to invite users');
        }
        const user = await this.usersService.inviteUser(inviteData, currentUser);
        return ok(user).message('Invitation sent successfully');
    }

    @Patch(':userId/status')
    @UsersDecorators('updateStatus')
    async updateStatus(@Param('userId') userId: string, @Body() statusData: UpdateUserStatusDto, @CurrentUser() currentUser: JwtUser) {
        const user = await this.usersService.updateStatus(userId, statusData, currentUser);
        return ok(user).message(`User status updated to ${statusData.status} successfully.`);
    }

    @Delete(':userId')
    @UsersDecorators('deactivate')
    async deactivate(@Param('userId') userId: string, @CurrentUser() currentUser: JwtUser) {
        const user = await this.usersService.updateStatus(userId, { status: 'inactive' }, currentUser);
        return ok(user).message('User deactivated successfully.');
    }
}
