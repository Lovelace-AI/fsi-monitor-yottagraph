/**
 * Simple composable for making authenticated API calls to the Elemental query server.
 *
 * This provides a minimal interface that proxies all requests through /api/query/[...path],
 * which handles authentication and server routing automatically.
 *
 * The API spec (elemental-api-spec.json) is the single source of truth for available endpoints.
 * Use the generated types from orval for type safety.
 *
 * @example
 * ```typescript
 * import type { StatusResponse, FindEntitiesRequest } from '~/composables/generated/elemental-service/model';
 *
 * const { query } = useQueryServer();
 *
 * // Type-safe API calls
 * const status = await query<StatusResponse>('/status');
 *
 * const entities = await query<FindEntitiesResponse>('/entities/find', {
 *   method: 'POST',
 *   body: {
 *     property_filters: [{ name: 'MMSI', values: [{ val: '477811900' }] }]
 *   } as FindEntitiesRequest
 * });
 * ```
 */
export const useQueryServer = () => {
    /**
     * Make an authenticated request to any query server endpoint.
     *
     * @param path - The API path (e.g., '/status', '/entities/find')
     * @param options - Fetch options (method, body, query, headers)
     * @returns The API response data
     *
     * @example
     * ```typescript
     * // GET request
     * const data = await query('/status');
     *
     * // POST request with body
     * const results = await query('/entities/find', {
     *   method: 'POST',
     *   body: { property_filters: [...] }
     * });
     *
     * // GET request with query params
     * const sightings = await query('/sightings', {
     *   query: { nindex: 'abc123', 'low-precision': 0 }
     * });
     * ```
     */
    const query = async <T = any>(
        path: string,
        options: {
            method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
            body?: any;
            query?: Record<string, any>;
            headers?: Record<string, string>;
            responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
        } = {}
    ): Promise<T> => {
        // Ensure path starts with /
        const normalizedPath = path.startsWith('/') ? path.substring(1) : path;

        // Get the access token from user state
        const { accessToken } = useUserState();

        // Build headers with auth token
        const headers: Record<string, string> = {
            ...options.headers,
        };

        // Add authorization header if we have an access token
        if (accessToken.value) {
            headers['Authorization'] = `Bearer ${accessToken.value}`;
        }

        try {
            const response = await $fetch(`/api/query/${normalizedPath}`, {
                method: options.method || 'GET',
                body: options.body,
                query: options.query,
                headers,
                responseType: options.responseType,
            });

            return response as T;
        } catch (error: any) {
            console.error(`Query server error for ${path}:`, error);
            throw error;
        }
    };

    return {
        query,

        // Legacy exports for backwards compatibility
        // These just call the query method - prefer using query directly
        checkConnection: async () => {
            try {
                await query('/status');
                return true;
            } catch {
                return false;
            }
        },
    };
};

// Re-export all types from the generated code for convenience
export * from './generated/elemental-service/model';
