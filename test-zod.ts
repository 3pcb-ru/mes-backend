import { z } from 'zod';
import * as schemas from './src/models/zod-schemas';
import zodToJsonSchema from 'zod-to-json-schema';

console.log("Checking schemas...");
for (const [name, schema] of Object.entries(schemas)) {
    if (schema instanceof z.ZodType) {
        try {
            zodToJsonSchema(schema, name);
        } catch (e) {
            console.error(`Schema ${name} threw an error: ${e.message}`);
        }
    }
}
