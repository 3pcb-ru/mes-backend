export class CreateWorkOrderDto {
    tenantId?: string;
    bomRevisionId!: string;
    targetQuantity!: number;
    plannedStartDate?: string; // ISO
}
