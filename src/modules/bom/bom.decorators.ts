import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const BomDecorators = {
    createProduct: () =>
        applyDecorators(
            ApiOperation({ summary: 'Create a product and its initial BOM entry' }),
            ApiResponse({ status: 201, description: 'Product and BOM created successfully' }),
        ),

    importBom: () =>
        applyDecorators(
            ApiOperation({ summary: 'Import BOM items for a product revision' }),
            ApiResponse({ status: 201, description: 'BOM items imported successfully' }),
        ),

    releaseRevision: () =>
        applyDecorators(
            ApiOperation({ summary: 'Release a BOM revision' }),
            ApiResponse({ status: 200, description: 'Revision released successfully' }),
        ),

    getProductBom: () =>
        applyDecorators(
            ApiOperation({ summary: 'Get BOM for a product' }),
            ApiResponse({ status: 200, description: 'BOM fetched successfully' }),
        ),
};
