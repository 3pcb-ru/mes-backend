import { Injectable } from '@nestjs/common';

import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class TraceabilityService {
    private logs: Array<CreateActivityDto & { id: string; timestamp: string }> = [];

    async list() {
        return { data: this.logs };
    }

    async getById(id: string) {
        return this.logs.find(log => log.id === id);
    }

    async create(payload: CreateActivityDto) {
        const entry = { id: `${Date.now()}`, timestamp: new Date().toISOString(), ...payload };
        this.logs.push(entry);
        return entry;
    }
}
