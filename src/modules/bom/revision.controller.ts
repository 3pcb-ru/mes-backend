import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { BomDecorators } from './bom.decorators';
import { BomService } from './bom.service';
import { CreateRevisionDto } from './dto/create-revision.dto';

@ApiTags('BOM')
@ApiBearerAuth()
@Controller('products/:productId/revisions')
export class RevisionController {
    constructor(private readonly bomService: BomService) {}

    @Get()
    @BomDecorators.getRevisions()
    async getRevisions(@Param('productId') productId: string, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.getRevisions(productId, user)).message('Revisions retrieved successfully');
    }

    @Post()
    @BomDecorators.createRevision()
    async createRevision(@Param('productId') productId: string, @Body() dto: CreateRevisionDto, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.createRevision(productId, dto, user)).message('Revision created successfully');
    }

    @Post(':id/alternative')
    @BomDecorators.createAlternative()
    async createAlternative(@Param('productId') productId: string, @Param('id') id: string, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.createAlternative(productId, id, user)).message('Alternative revision created successfully');
    }

    @Put(':id')
    @BomDecorators.updateRevision()
    async updateRevision(@Param('productId') productId: string, @Param('id') id: string, @Body() body: { version: string }, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.updateRevision(productId, id, body.version, user)).message('Revision updated successfully');
    }

    @Delete(':id')
    @BomDecorators.deleteRevision()
    async deleteRevision(@Param('productId') productId: string, @Param('id') id: string, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.deleteRevision(productId, id, user)).message('Revision deleted successfully');
    }

    @Post(':id/submit')
    @BomDecorators.submitRevision()
    async submitRevision(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.submitRevision(id, user)).message('Revision submitted successfully');
    }

    @Post(':id/approve')
    @BomDecorators.approveRevision()
    async approveRevision(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.approveRevision(id, user)).message('Revision approved successfully');
    }

    @Post(':id/activate')
    @BomDecorators.activateRevision()
    async activateRevision(@Param('id') id: string, @CurrentUser() user: JwtUser) {
        return ok(await this.bomService.activateRevision(id, user)).message('Revision activated successfully');
    }
}
