export class CreateContainerDto {
  tenantId?: string;
  locationNodeId?: string | null;
  lpn!: string;
  type?: string; // REEL, TRAY, BOX
}
