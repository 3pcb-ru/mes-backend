import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/user.decorator';
import { JwtUser } from '@/types/jwt.types';
import { ok } from '@/utils';

import { ExecutionDecorators } from './execution.decorators';
import { ListExecutionQueryDto } from './execution.dto';
import { ExecutionService } from './execution.service';

@ApiTags('Execution')
@ApiBearerAuth()
@Controller('execution')
export class ExecutionController {
    constructor(private readonly svc: ExecutionService) {}

    @Get()
    @ExecutionDecorators.list()
    async list(@Query() query: ListExecutionQueryDto, @CurrentUser() user: JwtUser) {
        const result = await this.svc.listExecutions(query, user);
        return ok(result.data).message('Execution jobs retrieved successfully').paginate(result);
    }

    @Get(':id')
    @ExecutionDecorators.get()
    async get(@CurrentUser() user: JwtUser, @Param('id') id: string) {
        const result = await this.svc.getExecution(id, user);
        return ok(result).message('Execution job retrieved successfully');
    }
}
