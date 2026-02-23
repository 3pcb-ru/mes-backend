import { createStrictZodDto } from '@/common/helpers/zod-strict';

import { CreateFacilityDto } from './create-facility.dto';

export class UpdateFacilityDto extends createStrictZodDto(CreateFacilityDto.schema.partial()) {}
