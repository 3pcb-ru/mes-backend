export class CreateActivityDto {
    tenantId?: string;
    userId?: string;
    jobId?: string;
    nodeId?: string;
    sourceContainerId?: string;
    actionType!: string;
    metadata?: Record<string, any>;
}
