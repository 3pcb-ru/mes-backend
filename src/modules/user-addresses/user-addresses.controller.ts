import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { UserAddressesDecorators } from './user-addresses.decorators';
import { CreateUserAddressDto, ListAddressQueryDto, UpdateUserAddressDto } from './user-addresses.dto';
import { UserAddressesService } from './user-addresses.service';

@ApiTags('User Addresses')
@ApiBearerAuth()
@Controller('account/addresses')
export class UserAddressesController {
    constructor(private readonly service: UserAddressesService) {}

    @Get()
    @UserAddressesDecorators('list')
    async list(@CurrentUser() user: JwtUser, @Query() filterQuery: ListAddressQueryDto) {
        const result = await this.service.list(user.id, filterQuery);
        return ok(result.data).message('Addresses fetched successfully').paginate({ total: result.total, page: result.page, limit: result.limit });
    }

    @Get(':userAddressId')
    @UserAddressesDecorators('findOne')
    async findOne(@CurrentUser() user: JwtUser, @Param('userAddressId') userAddressId: string) {
        const result = await this.service.findOne(userAddressId);
        return ok(result).message('Address fetched successfully');
    }

    @Post()
    @UserAddressesDecorators('create')
    async create(@Body() body: CreateUserAddressDto, @CurrentUser() user: JwtUser) {
        const result = await this.service.create(user.id, body);
        return ok(result).message('Address created successfully');
    }

    @Put(':addressId')
    @UserAddressesDecorators('update')
    async update(@Param('addressId') addressId: string, @Body() body: UpdateUserAddressDto, @CurrentUser() user: JwtUser) {
        const result = await this.service.update(user.id, addressId, body);
        return ok(result).message('Address updated successfully');
    }

    @Patch(':addressId/default')
    @UserAddressesDecorators('setDefault')
    async setDefault(@Param('addressId') addressId: string, @CurrentUser() user: JwtUser) {
        const result = await this.service.setDefault({ userId: user.id, addressId: addressId });
        return ok(result).message('Default address updated');
    }

    @Delete(':addressId')
    @UserAddressesDecorators('remove')
    async remove(@Param('addressId') addressId: string, @CurrentUser() user: JwtUser) {
        const result = await this.service.remove(user.id, addressId);
        return ok(result).message('Address deleted successfully');
    }
}
