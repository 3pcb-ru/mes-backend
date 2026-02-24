import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ok } from '@/utils';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { FacilityService } from './facility.service';

@ApiTags('Facilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('facilities')
export class FacilityController {
    constructor(private readonly facilityService: FacilityService) {}

    @Get()
    async list() {
        const result = await this.facilityService.list();
        return ok(result);
    }

    @Post()
    async create(@Body() payload: CreateFacilityDto) {
        const result = await this.facilityService.create(payload);
        return ok(result);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.facilityService.findOne(id);
        return ok(result);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() payload: UpdateFacilityDto) {
        const result = await this.facilityService.update(id, payload);
        return ok(result);
    }

    @Post(':id/change-status')
    async changeStatus(@Param('id') id: string, @Body() body: { status: string; reason?: string }) {
        const result = await this.facilityService.changeStatus(id, body.status, body.reason);
        return ok(result);
    }
}
