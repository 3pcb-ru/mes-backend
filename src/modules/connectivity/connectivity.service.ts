import { Injectable } from '@nestjs/common';

import { NodeEventDto } from './dto/node-event.dto';

@Injectable()
export class ConnectivityService {
    async ingest(payload: NodeEventDto) {
        // Convert raw mqtt payload -> NodeEvents, persist or forward to event bus
        // Validate minimal shape: nodeId and topic
        if (!payload?.nodeId || !payload?.topic) {
            throw new Error('Invalid node event payload');
        }
        return { received: true, payload };
    }
}
