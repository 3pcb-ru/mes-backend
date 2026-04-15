import { BadRequestException, Injectable } from '@nestjs/common';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { DrizzleService } from '@/models/model.service';

import { NodeEventDto } from './connectivity.dto';

@Injectable()
export class ConnectivityService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly logger: CustomLoggerService,
    ) {
        this.logger.setContext(ConnectivityService.name);
    }

    async ingest(payload: NodeEventDto) {
        // Convert raw mqtt payload -> NodeEvents, persist or forward to event bus
        // Validate minimal shape: nodeId and topic
        if (!payload?.nodeId || !payload?.topic) {
            throw new BadRequestException('Invalid node event payload: nodeId and topic are required');
        }

        this.logger.log(`Ingesting event from node ${payload.nodeId} on topic ${payload.topic}`);

        return { received: true, payload };
    }
}
