import { useQueryServer } from '~/composables/useQueryServer';

export interface SchemaData {
    flavors: Array<{ fid: number; name: string }>;
    properties: Array<{ pid: number; name: string; type: string }>;
}

export interface SearchMatch {
    neid: string;
    name: string;
    flavor?: string;
    score?: number;
}

export interface PropertyValue {
    eid: string;
    pid: number;
    value: any;
    recorded_at?: string;
}

export interface GraphNode {
    neid: string;
    label: string;
    isCentralNode?: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface GraphEdge {
    source: string;
    target: string;
    label: string;
    path: Array<{ X: number; Y: number }>;
    article_ids?: string[];
    snippets?: string[];
    weight?: number;
}

let schemaPromise: Promise<SchemaData> | null = null;

export function useWatchlistApi() {
    const { query } = useQueryServer();

    async function getSchema(): Promise<SchemaData> {
        if (!schemaPromise) {
            schemaPromise = query<{ op_id: string; schema: SchemaData }>(
                '/elemental/metadata/schema'
            ).then((res) => res.schema);
        }
        return schemaPromise;
    }

    async function searchCompanies(searchTerm: string): Promise<SearchMatch[]> {
        const response = await query<{
            results: Array<{ queryId: number; matches: SearchMatch[] }>;
        }>('/entities/search', {
            method: 'POST',
            body: {
                queries: [{ queryId: 1, query: searchTerm, flavors: ['organization'] }],
                maxResults: 10,
                includeNames: true,
                includeFlavors: true,
                includeScores: true,
            },
        });
        return response.results?.[0]?.matches || [];
    }

    async function getEntityProperties(eids: string[], pids?: number[]): Promise<PropertyValue[]> {
        const params = new URLSearchParams({
            eids: JSON.stringify(eids),
        });
        if (pids && pids.length > 0) {
            params.set('pids', JSON.stringify(pids));
        }
        const response = await query<{ values: PropertyValue[] }>(
            '/elemental/entities/properties',
            {
                method: 'POST',
                body: params.toString(),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
        );
        return response.values || [];
    }

    async function findEntities(expression: Record<string, any>, limit = 1000): Promise<string[]> {
        const params = new URLSearchParams({
            expression: JSON.stringify(expression),
            limit: String(limit),
        });
        const response = await query<{ eids: string[] }>('/elemental/find', {
            method: 'POST',
            body: params.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return response.eids || [];
    }

    async function getNeighborhood(
        centerNeid: string,
        options?: { size?: number; type?: string }
    ): Promise<{ neighbors: string[]; weights: number[] }> {
        const queryParams: Record<string, string> = {};
        if (options?.size) queryParams.size = String(options.size);
        if (options?.type) queryParams.type = options.type;
        return await query<{ neighbors: string[]; weights: number[] }>(
            `/graph/${centerNeid}/neighborhood`,
            { query: queryParams }
        );
    }

    async function getGraphLayout(
        centerNeid: string,
        neids: string[]
    ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
        const queryParams: Record<string, string[]> = { neid: neids };
        return await query<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
            `/graph/${centerNeid}/layout`,
            { query: queryParams }
        );
    }

    async function getMentionsLookup(
        neid: string,
        intervalStart: string,
        intervalEnd: string
    ): Promise<{ mcodes: Array<{ neid: string; artid: string }> }> {
        return await query<{ mcodes: Array<{ neid: string; artid: string }> }>('/mentions/lookup', {
            query: {
                neid,
                interval_start: intervalStart,
                interval_end: intervalEnd,
            },
        });
    }

    interface MentionDetail {
        neid: string;
        artid: string;
        publication_date: string;
        sentiment: number;
        original_publication_name: string;
    }

    async function getMentionsLookupDetail(
        neid: string,
        intervalStart: string,
        intervalEnd: string
    ): Promise<{ details: MentionDetail[] }> {
        return await query<{ details: MentionDetail[] }>('/mentions/lookup/detail', {
            query: {
                neid,
                interval_start: intervalStart,
                interval_end: intervalEnd,
            },
        });
    }

    async function getArticleDetail(artid: string): Promise<{
        artid: string;
        title: string;
        publication_date: string;
        original_publication_name: string;
        summary?: string;
        url?: string;
    }> {
        const response = await query<{
            detail: {
                artid: string;
                title: string;
                publication_date: string;
                original_publication_name: string;
                summary?: string;
                url?: string;
            };
        }>(`/articles/${artid}`);
        return response.detail;
    }

    async function findLinkedEntities(
        toEntity: string,
        distance = 1,
        pids?: number[]
    ): Promise<string[]> {
        const linked: { to_entity: string; distance: number; pids?: number[] } = {
            to_entity: toEntity,
            distance,
        };
        if (pids && pids.length > 0) {
            linked.pids = pids;
        }
        const expression = { type: 'linked', linked };
        return findEntities(expression);
    }

    return {
        getSchema,
        searchCompanies,
        getEntityProperties,
        findEntities,
        findLinkedEntities,
        getNeighborhood,
        getGraphLayout,
        getMentionsLookup,
        getMentionsLookupDetail,
        getArticleDetail,
    };
}
