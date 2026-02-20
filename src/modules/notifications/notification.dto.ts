import { createApiPaginatedResponseSchema, createApiResponseSchema } from '@/common/helpers/api-response';
import { createStrictZodDto } from '@/common/helpers/zod-strict';
import { notificationSelectSchema, notificationUpdateSchema } from '@/models/zod-schemas';

// Response schemas
export const notificationResponseSchema = notificationSelectSchema;
export const notificationApiResponseSchema = createApiResponseSchema(notificationResponseSchema);
export const notificationPaginatedApiResponseSchema = createApiPaginatedResponseSchema(notificationResponseSchema);

// DTO Classes
export class NotificationDto extends createStrictZodDto(notificationResponseSchema) {}
export class NotificationApiResponseDto extends createStrictZodDto(notificationApiResponseSchema) {}
export class NotificationPaginatedApiResponseDto extends createStrictZodDto(notificationPaginatedApiResponseSchema) {}

// Update DTO (for marking as read)
export class UpdateNotificationDto extends createStrictZodDto(notificationUpdateSchema.pick({ status: true })) {}
