import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { BomService } from './bom.service';
import { CreateRevisionDto } from './dto/create-revision.dto';

@ApiTags('BOM Revisions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products/:productId/revisions')
export class RevisionController {
    constructor(private readonly bomService: BomService) {}

    @Get()
    @ApiOperation({ summary: 'List all revisions for a product' })
    async getRevisions(@Param('productId') productId: string) {
        return ok(await this.bomService.getRevisions(productId));
    }

    @Post()
    @ApiOperation({ summary: 'Create a new major revision' })
    async createRevision(@Param('productId') productId: string, @Body() dto: CreateRevisionDto, @Request() req: { user: JwtUser }) {
        return ok(await this.bomService.createRevision(productId, dto, req.user.id));
    }

    @Post(':id/alternative')
    @ApiOperation({ summary: 'Create an alternative (minor) revision' })
    async createAlternative(@Param('productId') productId: string, @Param('id') id: string, @Request() req: { user: JwtUser }) {
        return ok(await this.bomService.createAlternative(productId, id, req.user.id));
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update revision version (Draft only)' })
    async updateRevision(@Param('productId') productId: string, @Param('id') id: string, @Body() body: { version: string }) {
        return ok(await this.bomService.updateRevision(productId, id, body.version));
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete revision' })
    async deleteRevision(@Param('productId') productId: string, @Param('id') id: string) {
        return ok(await this.bomService.deleteRevision(productId, id));
    }

    @Post(':id/submit')
    @ApiOperation({ summary: 'Submit revision for approval' })
    async submitRevision(@Param('id') id: string, @Request() req: { user: JwtUser }) {
        return ok(await this.bomService.submitRevision(id, req.user.id));
    }

    @Post(':id/approve')
    @ApiOperation({ summary: 'Approve revision' })
    async approveRevision(@Param('id') id: string, @Request() req: { user: JwtUser }) {
        return ok(await this.bomService.approveRevision(id, req.user.id));
    }

    @Post(':id/activate')
    @ApiOperation({ summary: 'Activate revision' })
    async activateRevision(@Param('id') id: string) {
        return ok(await this.bomService.activateRevision(id));
    }
}
