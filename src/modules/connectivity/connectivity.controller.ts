import { Body, Controller, Post } from '@nestjs/common';

import { ok } from '@/utils';

import { ConnectivityService } from './connectivity.service';
import { NodeEventDto } from './dto/node-event.dto';

@Controller('connectivity')
export class ConnectivityController {
    constructor(private readonly svc: ConnectivityService) {}

    @Post('mqtt/ingest')
    async ingest(@Body() body: NodeEventDto) {
        const result = await this.svc.ingest(body);
        return ok(result);
    }
}
