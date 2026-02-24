import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Force strictness for object schemas; leave other schema types unchanged
const toStrictSchema = <T extends z.ZodTypeAny>(schema: T): T => {
    if (schema instanceof z.ZodObject) {
        return schema.strict() as unknown as T;
    }
    return schema;
};

// Replacement for createZodDto that makes object schemas strict by default
export const createStrictZodDto = <T extends z.ZodTypeAny>(schema: T) => createZodDto(toStrictSchema(schema));

const toOptionalSchema = <T extends z.ZodTypeAny>(schema: T): T => {
    if (schema instanceof z.ZodObject) {
        return schema.optional() as unknown as T;
    }
    return schema;
};

// Replacement for updateZodDto that makes object schemas optional by default
export const updateZodDto = <T extends z.ZodTypeAny>(schema: T) => createZodDto(toOptionalSchema(schema));
