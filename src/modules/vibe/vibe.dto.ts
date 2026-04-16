import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateVibePageSchema = z.object({
    name: z.string().min(1).max(255),
    category: z.enum(['Main', 'Operations', 'Analytics', 'Configuration', 'Custom']),
    config: z.record(z.string(), z.any()),
    isOwnerCreated: z.boolean().optional().default(false),
});

export const GenerateVibeLayoutSchema = z.object({
    prompt: z.string().min(5).max(1000),
    apiManifest: z.record(z.string(), z.any()),
    componentsManifest: z.record(z.string(), z.any()),
});

export class CreateVibePageDto extends createZodDto(CreateVibePageSchema) {}
export class GenerateVibeLayoutDto extends createZodDto(GenerateVibeLayoutSchema) {}
