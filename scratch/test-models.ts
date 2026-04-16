import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // The SDK doesn't have a direct listModels, we have to use the underlying fetch or check docs.
    // However, we can try to initialize some common ones and see which one doesn't 404.
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-pro',
      'gemini-pro-vision'
    ];

    console.log('Testing models...');
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent('test');
        console.log(`✅ ${modelName} is AVAILABLE`);
      } catch (e: any) {
        console.log(`❌ ${modelName} FAILED: ${e.message}`);
      }
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
