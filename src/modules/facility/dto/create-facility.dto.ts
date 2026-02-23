export class CreateFacilityDto {
  tenantId?: string;
  parentId?: string | null;
  path!: string; // ltree style e.g. Factory.Line1.Oven
  definitionId?: string | null;
  name!: string;
  capabilities?: string[];
  status?: string;
  attributes?: Record<string, any>;
}
