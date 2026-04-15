import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { BomDecorators } from './bom.decorators';
import { BomService } from './bom.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@ApiTags('BOM')
@ApiBearerAuth()
@Controller('products/:productId/revisions/:revisionId/materials')
export class MaterialController {
    constructor(private readonly bomService: BomService) {}

    @Get()
    @BomDecorators.getMaterials()
    async getMaterials(@Param('revisionId') revisionId: string, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.getMaterials(revisionId, user)).message('Materials retrieved successfully');
    }

    @Post()
    @BomDecorators.addMaterial()
    async addMaterial(@Param('revisionId') revisionId: string, @Body() dto: CreateMaterialDto, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.addMaterial(revisionId, dto, user)).message('Material added successfully');
    }

    @Put(':id')
    @BomDecorators.updateMaterial()
    async updateMaterial(@Param('revisionId') revisionId: string, @Param('id') id: string, @Body() dto: UpdateMaterialDto, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.updateMaterial(revisionId, id, dto, user)).message('Material updated successfully');
    }

    @Delete(':id')
    @BomDecorators.deleteMaterial()
    async deleteMaterial(@Param('revisionId') revisionId: string, @Param('id') id: string, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.deleteMaterial(revisionId, id, user)).message('Material removed successfully');
    }
}
