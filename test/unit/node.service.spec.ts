import { FilterService } from '@/common/services/filter.service';
import { DrizzleService } from '@/models/model.service';
import { NodeService } from '@/modules/node/node.service';

describe('NodeService (unit)', () => {
    let svc: NodeService;

    beforeEach(() => {
        // Mocking the required DrizzleService and FilterService injected dependencies
        const mockDrizzleService = { database: {} } as unknown as DrizzleService;
        const mockFilterService = {} as unknown as FilterService;
        svc = new NodeService(mockDrizzleService, mockFilterService);
    });

    it('service compiles and initializes', () => {
        expect(svc).toBeDefined();
    });
});
