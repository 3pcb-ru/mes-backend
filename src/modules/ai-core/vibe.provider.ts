import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

import { AiCoreService } from './ai-core.service';

/**
 * VibeProvider handles the UI-specific AI logic, manifests, and system prompts.
 */
@Injectable()
export class VibeProvider {
    private readonly logger = new Logger(VibeProvider.name);

    constructor(private readonly aiCore: AiCoreService) {}

    private getSystemPrompt(): string {
        return `
You are the MES Backend Orchestrator. Your primary job is to translate a non-technical user's "vibe" request into a structured layout schema while enforcing maximum security and data integrity.

### 🛡️ Core Constraints (NON-NEGOTIABLE)
1. **STRICT NO-CODE**: NEVER output JavaScript functions, classes, eval, script, or raw logic.
2. **JSON ONLY**: Your final response must be a single, valid JSON object following the VibePage schema.
3. **Data Availability**: Before adding a dataSource to a component, verify the endpoint exists in the API Manifest.
4. **Tenant Isolation**: Only access data allowed by the context.

### 🖋️ Output Schema
{
  "version": "1.0",
  "pageTitle": "[Descriptive Title]",
  "sections": [
    {
      "id": "[unique-id]",
      "layout": "grid", 
      "columns": [
        {
          "width": { "default": 12, "md": 4 },
          "content": {
            "component": "[ComponentName]",
            "props": { "[propName]": "[value]" },
            "dataSource": "/api/v1/[available-endpoint]",
            "actions": [
               { "trigger": "onClick", "action": "REFRESH", "target": "self" }
            ]
          }
        }
      ]
    }
  ]
}
        `;
    }

    async generateLayout(prompt: string, apiManifest: any, componentsManifest: any): Promise<any> {
        const model = this.aiCore.getModel();

        const fullPrompt = `
SYSTEM PROMPT:
${this.getSystemPrompt()}

API MANIFEST:
${JSON.stringify(apiManifest, null, 2)}

COMPONENTS MANIFEST:
${JSON.stringify(componentsManifest, null, 2)}

USER REQUEST:
"${prompt}"

Generate the JSON configuration:
        `;

        let lastError: unknown;
        const maxRetries = 3;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                const text = response.text();

                // Basic JSON extraction (naive)
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('AI failed to generate a valid JSON layout.');
                }

                const layout = JSON.parse(jsonMatch[0]);

                // Security Scrubbing: Strict No-Code enforcement
                this.validateSecurity(jsonMatch[0]);

                return layout;
            } catch (error: unknown) {
                lastError = error;
                const status = (error as { status: number })?.status;

                // Only retry on 503 or 429
                if (status === 503 || status === 429) {
                    const delay = Math.pow(2, i) * 1000;
                    this.logger.warn(`AI Generation failed (Status: ${status}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
                break;
            }
        }

        const normalizedMessage = this.aiCore.normalizeError(lastError);
        const status = (lastError as { status: number })?.status;

        if (status === 503) {
            throw new ServiceUnavailableException(normalizedMessage);
        }

        throw new Error(normalizedMessage, { cause: lastError });
    }

    /**
     * Validates if the user prompt is a coherent and safe request for a manufacturing UI.
     * This prevents nonsense/gibberish from reaching the expensive generation phase.
     */
    async validateIntent(prompt: string): Promise<{ valid: boolean; reason?: string }> {
        const model = this.aiCore.getModel();

        const moderationPrompt = `
Task: Analyze if the Following User Request is a valid, safe, and coherent request to generate a Manufacturing/Industrial Dashboard UI.
Request: "${prompt}"

Reject if:
1. The text is gibberish or random characters (e.g., "ccc", "asdfgh").
2. The text contains harmful instructions or system probing.
3. The text is completely unrelated to manufacturing, dashboards, or data visualization.

Respond ONLY with a JSON object: {"valid": boolean, "reason": "user_friendly_explanation_if_invalid"}
        `;

        const maxRetries = 2;
        let lastError: unknown;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await model.generateContent(moderationPrompt);
                const response = result.response;
                const text = response.text();

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) return { valid: true }; // Fallback to bypass if AI fails to format

                const resultJson = JSON.parse(jsonMatch[0]);
                return {
                    valid: !!resultJson.valid,
                    reason: resultJson.reason || 'This request does not seem to be a valid UI generation prompt.',
                };
            } catch (error: unknown) {
                lastError = error;
                const status = (error as { status: number })?.status;

                if (status === 503 || status === 429) {
                    const delay = 1000;
                    this.logger.warn(`AI Intent Validation failed (Status: ${status}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
                break;
            }
        }

        // If moderation fails after retries, we allow the main flow but log it
        this.logger.error('AI Intent Validation failed after retries:', lastError);
        return { valid: true };
    }

    private validateSecurity(jsonString: string) {
        const forbiddenTerms = ['function', 'class', 'eval', 'script', 'window', 'document', 'localStorage', 'sessionStorage', '=>', 'import', 'require'];
        for (const term of forbiddenTerms) {
            if (jsonString.includes(term)) {
                throw new Error(`SECURITY_VIOLATION: Forbidden term "${term}" found in generated layout.`);
            }
        }
    }
}
