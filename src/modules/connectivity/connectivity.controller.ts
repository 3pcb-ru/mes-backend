import { Body, Controller, Post } from '@nestjs/common';

import { ok } from '@/utils';

import { ConnectivityService } from './connectivity.service';
import { NodeEventDto } from './dto/node-event.dto';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConnectivityDecorators } from './connectivity.decorators';

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
