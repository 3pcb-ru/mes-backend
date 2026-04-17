import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { BomDecorators } from './bom.decorators';
import { CreateMaterialDto, ListBomQueryDto, UpdateMaterialDto } from './bom.dto';
import { BomService } from './bom.service';

@ApiTags('BOM')
@ApiBearerAuth()
@Controller('products/:productId/revisions/:revisionId/materials')
export class MaterialController {
    constructor(private readonly bomService: BomService) {}

    @Get()
    @BomDecorators.getMaterials()
    async getMaterials(@Param('revisionId') revisionId: string, @Query() query: ListBomQueryDto, @CurrentUser() user: JwtUser) {
        const result = await this.bomService.getMaterials(revisionId, query, user);
        return ok(result.data).message('Materials retrieved successfully').paginate(result);
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

    @Get('search-parts')
    @BomDecorators.searchParts()
    async searchParts(@Query('q') q: string) {
        return ok(await this.bomService.searchParts(q)).message('Parts retrieved successfully');
    }
}
