import { Injectable } from '@nestjs/common';
import * as Schema from '@/models/schema';

@Injectable()
export class SetupService {
    async createDefaultSetup(tx: any, organizationId: string, organizationName: string) {
        // 1. Create default node definitions
        const [facilityDef] = await tx
            .insert(Schema.nodeDefinitions)
            .values({
                organizationId,
                name: 'Facility',
                attributeSchema: {},
                supportedActions: [],
            })
            .returning();

        const [workCenterDef] = await tx
            .insert(Schema.nodeDefinitions)
            .values({
                organizationId,
                name: 'Work Center',
                attributeSchema: {},
                supportedActions: [],
            })
            .returning();

        const [workStationDef] = await tx
            .insert(Schema.nodeDefinitions)
            .values({
                organizationId,
                name: 'Work Station',
                attributeSchema: {},
                supportedActions: [],
            })
            .returning();

        // 2. Create the node hierarchy
        // Facility (Root)
        const facilityPath = `root_${Date.now()}`;
        const [facility] = await tx
            .insert(Schema.nodes)
            .values({
                organizationId,
                name: `${organizationName} Facility`,
                definitionId: facilityDef.id,
                path: facilityPath,
                status: 'IDLE',
            })
            .returning();

        // Work Center (Child of Facility)
        const workCenterPath = `${facilityPath}.${Date.now() + 1}`;
        const [workCenter] = await tx
            .insert(Schema.nodes)
            .values({
                organizationId,
                parentId: facility.id,
                name: 'Main Work Center',
                definitionId: workCenterDef.id,
                path: workCenterPath,
                status: 'IDLE',
            })
            .returning();

        // Work Station (Child of Work Center)
        const workStationPath = `${workCenterPath}.${Date.now() + 2}`;
        await tx.insert(Schema.nodes).values({
            organizationId,
            parentId: workCenter.id,
            name: 'Main Work Station',
            definitionId: workStationDef.id,
            path: workStationPath,
            status: 'IDLE',
        });
    }
}
