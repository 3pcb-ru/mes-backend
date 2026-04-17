import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateVibePageSchema = z.object({
    name: z.string().min(1).max(255),
    category: z.enum(['Main', 'Operations', 'Analytics', 'Configuration', 'Custom']),
    config: z.record(z.string(), z.any()),
    isOwnerCreated: z.boolean().optional().default(false),
});

export const GenerateVibeLayoutSchema = z.object({
    prompt: z.string().min(2).max(1000), // Relaxing slightly for refinement prompts
    apiManifest: z.record(z.string(), z.any()),
    componentsManifest: z.record(z.string(), z.any()),
    currentPageId: z.string().optional(),
    currentConfig: z.record(z.string(), z.any()).optional(),
});

export const UpdateVibePageSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    category: z.enum(['Main', 'Operations', 'Analytics', 'Configuration', 'Custom']).optional(),
    config: z.record(z.string(), z.any()).optional(),
    isOwnerCreated: z.boolean().optional(),
});

export class CreateVibePageDto extends createZodDto(CreateVibePageSchema) {}
export class UpdateVibePageDto extends createZodDto(UpdateVibePageSchema) {}
export class GenerateVibeLayoutDto extends createZodDto(GenerateVibeLayoutSchema) {}
