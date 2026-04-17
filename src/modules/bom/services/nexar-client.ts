import { URLSearchParams } from 'url';
import axios from 'axios';

import { CustomLoggerService } from '@/app/services/logger/logger.service';

const TOKEN_URL = 'https://identity.nexar.com/connect/token';
const GRAPHQL_URL = 'https://api.nexar.com/graphql';

function decodeJWT(jwt: string) {
    try {
        return JSON.parse(Buffer.from(jwt.split('.')[1].replace('-', '+').replace('_', '/'), 'base64').toString('binary'));
    } catch (e) {
        return { exp: 0 };
    }
}

export class NexarClient {
    private accessToken: string | null = null;
    private exp: number = 0;
    private logger = new CustomLoggerService();

    constructor(
        private readonly clientId: string,
        private readonly clientSecret: string,
    ) {
        this.logger.setContext('NexarClient');
    }

    private async fetchAccessToken(): Promise<string> {
        const data = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
        });

        const response = await axios.post(TOKEN_URL, data.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (response.status !== 200) {
            this.logger.error('Failed to get Nexar access token', response.data);
            throw new Error('Failed to get Nexar access token');
        }

        this.accessToken = response.data.access_token;
        this.exp = decodeJWT(this.accessToken!).exp * 1000;
        return this.accessToken!;
    }

    private async getValidToken(): Promise<string> {
        if (!this.accessToken || this.exp < Date.now() + 300000) {
            return await this.fetchAccessToken();
        }
        return this.accessToken;
    }

    async query(gqlQuery: string, variables: Record<string, any>): Promise<any> {
        const token = await this.getValidToken();

        const response = await axios.post(
            GRAPHQL_URL,
            {
                query: gqlQuery,
                variables,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        if (response.status !== 200) {
            this.logger.error('Nexar GraphQL query failed', response.data);
            throw new Error('Nexar GraphQL query failed');
        }

        return response.data;
    }
}
