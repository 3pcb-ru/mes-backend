export class CreateNodeDto {
    name: string;
    definitionId?: string;
    status?: string;
    attributes?: Record<string, any>;
    capabilities?: string[];
    parentId?: string;
}
