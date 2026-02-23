import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';

@Injectable()
export class ExecutionService {
  private orders: Array<CreateWorkOrderDto & { id: string; status: string }> = [];

  async listWorkOrders() {
    return { data: this.orders };
  }

  async createWorkOrder(payload: CreateWorkOrderDto) {
    const o = { id: `${Date.now()}`, status: 'PLANNED', ...payload };
    this.orders.push(o);
    return o;
  }

  async getWorkOrder(id: string) {
    const o = this.orders.find((x) => x.id === id);
    if (!o) throw new NotFoundException('Work order not found');
    return o;
  }
}
