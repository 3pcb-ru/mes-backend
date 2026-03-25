import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ConnectivityDecorators = {
    ingest: () =>
        applyDecorators(
            ApiOperation({ summary: 'Ingest MQTT node events' }),
            ApiResponse({ status: 201, description: 'Event ingested successfully' }),
        ),
};
