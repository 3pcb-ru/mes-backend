import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';

@Injectable()
export class FacilityService {
  // Placeholder in-memory store for initial scaffolding
  private nodes: Array<CreateFacilityDto & { id: string; current_load?: number; lastStatusReason?: string }> = [];

  async list() {
    return { data: this.nodes };
  }

  async create(payload: CreateFacilityDto) {
    const node = { id: `${Date.now()}`, ...payload };
    this.nodes.push(node);
    return node;
  }

  async findOne(id: string) {
    const n = this.nodes.find((x) => x.id === id);
    if (!n) throw new NotFoundException('Facility node not found');
    return n;
  }

  async update(id: string, payload: UpdateFacilityDto) {
    const idx = this.nodes.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundException('Facility node not found');
    this.nodes[idx] = { ...this.nodes[idx], ...payload };
    return this.nodes[idx];
  }

  async changeStatus(id: string, status: string, reason?: string) {
    const node = await this.findOne(id);
    const prev = node.status;
    node.status = status;
    node.lastStatusReason = reason;
    // In a real impl: emit event, persist, validate transitions
    return { id, from: prev, to: status };
  }
}
