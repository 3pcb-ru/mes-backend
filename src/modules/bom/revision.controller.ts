import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { BomService } from './bom.service';
import { BomRevisionDetailResponseDto, BomRevisionListResponseDto } from './dto/bom-response.dto';
import { CreateRevisionDto } from './dto/create-revision.dto';

import { BomDecorators } from './bom.decorators';

@ApiTags('BOM')
@ApiBearerAuth()
@Controller('products/:productId/revisions')
export class RevisionController {
    constructor(private readonly bomService: BomService) {}

    @Get()
    @BomDecorators.getRevisions()
    async getRevisions(@Param('productId') productId: string) {
        return ok(await this.bomService.getRevisions(productId));
    }

    @Post()
    @BomDecorators.createRevision()
    async createRevision(@Param('productId') productId: string, @Body() dto: CreateRevisionDto, @Request() req: { user: JwtUser }) {
        return ok(await this.bomService.createRevision(productId, dto, req.user.id));
    }

    @Post(':id/alternative')
    @BomDecorators.createAlternative()
    async createAlternative(@Param('productId') productId: string, @Param('id') id: string, @Request() req: { user: JwtUser }) {
        return ok(await this.bomService.createAlternative(productId, id, req.user.id));
    }

    @Put(':id')
    @BomDecorators.updateRevision()
    async updateRevision(@Param('productId') productId: string, @Param('id') id: string, @Body() body: { version: string }) {
        return ok(await this.bomService.updateRevision(productId, id, body.version));
    }

    @Delete(':id')
    @BomDecorators.deleteRevision()
    async deleteRevision(@Param('productId') productId: string, @Param('id') id: string) {
        return ok(await this.bomService.deleteRevision(productId, id));
    }

    @Post(':id/submit')
    @BomDecorators.submitRevision()
    async submitRevision(@Param('id') id: string, @Request() req: { user: JwtUser }) {
        return ok(await this.bomService.submitRevision(id, req.user.id));
    }

    @Post(':id/approve')
    @BomDecorators.approveRevision()
    async approveRevision(@Param('id') id: string, @Request() req: { user: JwtUser }) {
        return ok(await this.bomService.approveRevision(id, req.user.id));
    }

    @Post(':id/activate')
    @BomDecorators.activateRevision()
    async activateRevision(@Param('id') id: string) {
        return ok(await this.bomService.activateRevision(id));
    }
}
