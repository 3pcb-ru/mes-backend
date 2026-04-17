import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';

import { CustomLoggerService } from '@/app/services/logger/logger.service';
import { octopartConfig } from '@/config';

import { NexarClient } from './nexar-client';

export type OctoPartItem = {
    id: string;
    mpn: string;
    name: string;
    description: string;
    manufacturer: { id: string; name: string; is_verified: boolean };
    image: string | null;
    link: string;
    dataSheet: string | null;
    category?: { id: string; name: string } | null;
    lifecycleStatus?: string | null;
};

@Injectable()
export class OctoPartService {
    private nexar: NexarClient;

    constructor(
        @Inject(octopartConfig.KEY)
        private config: ConfigType<typeof octopartConfig>,
        private readonly logger: CustomLoggerService,
    ) {
        this.logger.setContext(OctoPartService.name);
        this.nexar = new NexarClient(config.nexarClientId!, config.nexarClientSecret!);
    }

    async search(q: string, limit: number = 20): Promise<OctoPartItem[]> {
        if (!q) return [];

        const scraperApiKey = this.config.scraperApiKey;
        const scraperApiUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=https://octopart.com/api/v4/internal`;

        const requestData = {
            operationName: 'SpecsViewSearch',
            variables: {
                currency: 'USD',
                filters: {},
                in_stock_only: false,
                limit: limit,
                q: q,
                start: 0,
            },
            query: `
                query SpecsViewSearch($currency: String!, $filters: Map, $in_stock_only: Boolean, $limit: Int!, $q: String, $sort: String, $sort_dir: SortDirection, $start: Int) {
                    search(currency: $currency, filters: $filters, in_stock_only: $in_stock_only, limit: $limit, q: $q, sort: $sort, sort_dir: $sort_dir, start: $start) {
                        results {
                            part {
                                id
                                mpn
                                short_description
                                manufacturer { id name is_verified }
                                best_image { url }
                                best_datasheet { url }
                                octopart_url
                                category { id name }
                                specs {
                                    attribute { group id name shortname }
                                    display_value
                                }
                            }
                        }
                    }
                }
            `,
        };

        try {
            const response = await axios.post(scraperApiUrl, requestData);
            const results = response.data.data?.search?.results || [];

            return results
                .map((res: any) => {
                    const part = res.part;
                    if (!part) return null;

                    const lifecycleStatus = part.specs?.find((s: any) => s.attribute?.shortname === 'lifecyclestatus')?.display_value;

                    return {
                        id: part.id,
                        mpn: part.mpn,
                        name: part.mpn,
                        description: part.short_description,
                        manufacturer: part.manufacturer,
                        image: part.best_image?.url ? `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(part.best_image.url)}` : null,
                        link: part.octopart_url,
                        dataSheet: part.best_datasheet?.url || null,
                        category: part.category,
                        lifecycleStatus,
                    };
                })
                .filter(Boolean);
        } catch (error: any) {
            this.logger.error(`Error searching OctoPart for "${q}": ${error.message}`);
            return [];
        }
    }
}
