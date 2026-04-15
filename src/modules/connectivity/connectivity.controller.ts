import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ok } from '@/utils';

import { ConnectivityDecorators } from './connectivity.decorators';
import { NodeEventDto } from './connectivity.dto';
import { ConnectivityService } from './connectivity.service';

@ApiTags('Connectivity')
@ApiBearerAuth()
@Controller('connectivity')
export class ConnectivityController {
    constructor(private readonly svc: ConnectivityService) {}

    @Post('mqtt/ingest')
    @ConnectivityDecorators.ingest()
    async ingest(@Body() body: NodeEventDto) {
        const result = await this.svc.ingest(body);
        return ok(result).message('Event ingested successfully');
    }
}
