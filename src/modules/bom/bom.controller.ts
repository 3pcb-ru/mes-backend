import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { BomService } from './bom.service';

@Controller('bom')
@UseGuards(JwtAuthGuard)
export class BomController {
    constructor(private readonly bomService: BomService) {}

    @Post('product')
    async createProduct(@Request() req: { user: JwtUser }, @Body() body: { name: string; sku: string }) {
        return ok(await this.bomService.createProduct(req.user.organizationId, body.name, body.sku));
    }

    @Post('import/:productId')
    async importBom(@Param('productId') productId: string, @Body() body: { revisionCode: string; items: { materialName: string; quantity: number; unit: string }[] }) {
        return ok(await this.bomService.importBom(productId, body.revisionCode, body.items));
    }

    @Post('release/:revisionId')
    async releaseRevision(@Request() req: { user: JwtUser }, @Param('revisionId') revisionId: string) {
        return ok(await this.bomService.releaseRevision(revisionId, req.user.organizationId));
    }

    @Get('product/:productId')
    async getProductBom(@Request() req: { user: JwtUser }, @Param('productId') productId: string) {
        return ok(await this.bomService.getProductBom(productId, req.user.organizationId));
    }
}
