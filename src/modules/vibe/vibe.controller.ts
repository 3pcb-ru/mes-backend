import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { VibeDecorators } from './vibe.decorators';
import { CreateVibePageDto, GenerateVibeLayoutDto, UpdateVibePageDto } from './vibe.dto';
import { VibeService } from './vibe.service';

@ApiTags('Vibe')
@ApiBearerAuth()
@Controller('vibe')
export class VibeController {
    constructor(private readonly vibeService: VibeService) {}

    @Post('generate')
    @VibeDecorators('generateLayout')
    async generateLayout(@CurrentUser() user: JwtUser, @Body() dto: GenerateVibeLayoutDto) {
        const result = await this.vibeService.generateLayout(user, dto);
        return ok(result).message('Layout generated successfully');
    }

    @Post('pages')
    @VibeDecorators('createPage')
    async createPage(@CurrentUser() user: JwtUser, @Body() dto: CreateVibePageDto) {
        const result = await this.vibeService.createPage(user, dto);
        return ok(result).message('Vibe page created successfully');
    }

    @Get('pages')
    @VibeDecorators('getPages')
    async getPages(@CurrentUser() user: JwtUser) {
        const result = await this.vibeService.getPages(user);
        return ok(result).message('Vibe pages retrieved successfully');
    }

    @Patch('pages/:id')
    @VibeDecorators('updatePage')
    async patchPage(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateVibePageDto) {
        const result = await this.vibeService.updatePage(user, id, dto);
        return ok(result).message('Vibe page updated successfully');
    }

    @Delete('pages/:id')
    @VibeDecorators('deletePage')
    async deletePage(@CurrentUser() user: JwtUser, @Param('id') id: string) {
        const result = await this.vibeService.deletePage(user, id);
        return ok(result).message('Vibe page deleted successfully');
    }
}
