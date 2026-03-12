/**
 * Server-side proxy for the query server.
 *
 * Routes all /api/query/* requests to the configured query server address,
 * forwarding auth, method, headers, query params, and body.
 */
export default defineEventHandler(async (event) => {
    const path = event.context.params?.path || '';
    const config = useRuntimeConfig();

    const serverAddress = config.public.queryServerAddress as string;
    if (!serverAddress) {
        throw createError({
            statusCode: 503,
            statusMessage: 'Query server is not configured. Set NUXT_PUBLIC_QUERY_SERVER_ADDRESS.',
        });
    }

    const baseUrl = serverAddress.match(/^https?:\/\//i)
        ? serverAddress.replace(/\/$/, '')
        : `https://${serverAddress.replace(/\/$/, '')}`;

    let accessToken: string | null = null;

    const authHeader = event.node.req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
    }

    if (!accessToken) {
        const cookies = parseCookies(event);
        accessToken = cookies['auth-token'] || null;
    }

    try {
        const query = getQuery(event);
        const method = event.node.req.method || 'GET';
        const body = method !== 'GET' ? await readBody(event) : undefined;

        // Elemental API POST endpoints require application/x-www-form-urlencoded
        const isElementalPost = method !== 'GET' && path.startsWith('elemental/');

        // Article text endpoint returns plain text
        const isTextEndpoint = path.match(/^articles\/\d+\/text$/);

        const headers: Record<string, string> = {
            Accept: isTextEndpoint ? 'text/plain' : 'application/json',
            'Content-Type': isElementalPost
                ? 'application/x-www-form-urlencoded'
                : 'application/json',
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        let processedBody = body;
        if (isElementalPost && body && typeof body === 'object') {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(body)) {
                if (value !== null && value !== undefined) {
                    params.append(
                        key,
                        typeof value === 'object' ? JSON.stringify(value) : String(value)
                    );
                }
            }
            processedBody = params.toString();
        }

        const fullUrl = `${baseUrl}/${path}`;

        const response = await $fetch(fullUrl, {
            method: method as any,
            query,
            body: processedBody,
            headers,
            redirect: 'manual',
            responseType: isTextEndpoint ? 'text' : undefined,
        });

        return response;
    } catch (error: any) {
        console.error('Query proxy error:', error);

        if (error.data) {
            throw createError({
                statusCode: error.statusCode || 500,
                statusMessage: error.statusMessage || 'Query server request failed',
                data: error.data,
            });
        }

        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Query server request failed',
        });
    }
});
