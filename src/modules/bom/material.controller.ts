import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ok } from '@/utils';

import { BomService } from './bom.service';
import { BomMaterialDetailResponseDto, BomMaterialListResponseDto } from './dto/bom-response.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@ApiTags('BOM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products/:productId/revisions/:revisionId/materials')
export class MaterialController {
    constructor(private readonly bomService: BomService) {}

    @Get()
    @ApiOperation({ summary: 'List all materials for a revision' })
    @ApiResponse({ status: 200, type: BomMaterialListResponseDto })
    async getMaterials(@Param('revisionId') revisionId: string) {
        return ok(await this.bomService.getMaterials(revisionId));
    }

    @Post()
    @ApiOperation({ summary: 'Add a material to a revision (Draft only)' })
    @ApiResponse({ status: 201, type: BomMaterialDetailResponseDto })
    async addMaterial(@Param('revisionId') revisionId: string, @Body() dto: CreateMaterialDto) {
        return ok(await this.bomService.addMaterial(revisionId, dto));
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update material (Draft only)' })
    @ApiResponse({ status: 200, type: BomMaterialDetailResponseDto })
    async updateMaterial(@Param('revisionId') revisionId: string, @Param('id') id: string, @Body() dto: UpdateMaterialDto) {
        return ok(await this.bomService.updateMaterial(revisionId, id, dto));
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remove material from revision (Draft only)' })
    @ApiResponse({ status: 200, description: 'Material removed' })
    async deleteMaterial(@Param('revisionId') revisionId: string, @Param('id') id: string) {
        return ok(await this.bomService.deleteMaterial(revisionId, id));
    }
}
