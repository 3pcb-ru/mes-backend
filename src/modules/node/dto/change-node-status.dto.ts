import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const changeNodeStatusSchema = z.object({
    status: z.string().min(1, 'Status is required'),
    reason: z
        .enum(['NORMAL_OPERATION', 'MAINTENANCE', 'SETUP_TEARDOWN', 'MATERIAL_SHORTAGE', 'BREAKDOWN', 'QUALITY_ISSUE', 'OPERATOR_BREAK', 'OTHER'])
        .describe('Reason for the status change'),
});

export class ChangeNodeStatusDto extends createZodDto(changeNodeStatusSchema) {
    @ApiProperty({
        description: 'New status for the node',
        example: 'maintenance',
    })
    status: string;

    @ApiProperty({
        description: 'Reason for the status change',
        enum: ['NORMAL_OPERATION', 'MAINTENANCE', 'SETUP_TEARDOWN', 'MATERIAL_SHORTAGE', 'BREAKDOWN', 'QUALITY_ISSUE', 'OPERATOR_BREAK', 'OTHER'],
        example: 'MAINTENANCE',
    })
    reason: 'NORMAL_OPERATION' | 'MAINTENANCE' | 'SETUP_TEARDOWN' | 'MATERIAL_SHORTAGE' | 'BREAKDOWN' | 'QUALITY_ISSUE' | 'OPERATOR_BREAK' | 'OTHER';
}
