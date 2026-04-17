import { registerAs } from '@nestjs/config';

export const octopartConfig = registerAs('octopart', () => ({
    scraperApiKey: process.env.SCRAPER_API_KEY,
    nexarClientId: process.env.NEXXAR_CLIENT_ID,
    nexarClientSecret: process.env.NEXXAR_CLIENT_SECRET,
}));
