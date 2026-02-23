import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
    private products: Array<CreateProductDto & { id: string }> = [];

    async list() {
        return { data: this.products };
    }

    async create(payload: CreateProductDto) {
        const p = { id: `${Date.now()}`, ...payload };
        this.products.push(p);
        return p;
    }

    async findOne(id: string) {
        const p = this.products.find((x) => x.id === id);
        if (!p) throw new NotFoundException('Product not found');
        return p;
    }
}
