import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ok } from '@/utils';

import { BomService } from './bom.service';
import { BomMaterialDetailResponseDto, BomMaterialListResponseDto } from './dto/bom-response.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

import { BomDecorators } from './bom.decorators';

@ApiTags('BOM')
@ApiBearerAuth()
@Controller('products/:productId/revisions/:revisionId/materials')
export class MaterialController {
    constructor(private readonly bomService: BomService) {}

    @Get()
    @BomDecorators.getMaterials()
    async getMaterials(@Param('revisionId') revisionId: string) {
        return ok(await this.bomService.getMaterials(revisionId));
    }

    @Post()
    @BomDecorators.addMaterial()
    async addMaterial(@Param('revisionId') revisionId: string, @Body() dto: CreateMaterialDto) {
        return ok(await this.bomService.addMaterial(revisionId, dto));
    }

    @Put(':id')
    @BomDecorators.updateMaterial()
    async updateMaterial(@Param('revisionId') revisionId: string, @Param('id') id: string, @Body() dto: UpdateMaterialDto) {
        return ok(await this.bomService.updateMaterial(revisionId, id, dto));
    }

    @Delete(':id')
    @BomDecorators.deleteMaterial()
    async deleteMaterial(@Param('revisionId') revisionId: string, @Param('id') id: string) {
        return ok(await this.bomService.deleteMaterial(revisionId, id));
    }
}
