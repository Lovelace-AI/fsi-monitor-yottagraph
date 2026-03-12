import { useWatchlistApi } from './useWatchlistApi';

export interface WatchlistCompanyData {
    neid: string;
    name: string;
    edgarFilingsCount: number | null;
    newsMentionsCount: number | null;
    loading: boolean;
    lastRefreshed: string | null;
}

const STORAGE_KEY = 'fsi-monitor-watchlist-data';

const dataCache = reactive(new Map<string, WatchlistCompanyData>());

function loadCachedData(): Map<string, WatchlistCompanyData> {
    if (import.meta.server) return new Map();
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const entries = JSON.parse(stored) as [string, WatchlistCompanyData][];
            return new Map(entries);
        }
    } catch {
        // ignore
    }
    return new Map();
}

function saveCacheToStorage() {
    if (import.meta.server) return;
    try {
        const entries = Array.from(dataCache.entries());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // ignore
    }
}

if (!import.meta.server) {
    const cached = loadCachedData();
    for (const [key, value] of cached) {
        dataCache.set(key, { ...value, loading: false });
    }
}

export function useCompanyWatchlistData() {
    const api = useWatchlistApi();

    function getCompanyData(neid: string): WatchlistCompanyData | undefined {
        return dataCache.get(neid);
    }

    function getAllCompanyData(): Map<string, WatchlistCompanyData> {
        return dataCache;
    }

    async function fetchEdgarFilingsCount(neid: string): Promise<number> {
        const schema = await api.getSchema();
        const filingsPid = schema.properties.find((p) => p.name === 'filings')?.pid;
        const filingDatePid = schema.properties.find((p) => p.name === 'filing_date')?.pid;

        if (!filingsPid || !filingDatePid) {
            return 0;
        }

        const filingsValues = await api.getEntityProperties([neid], [filingsPid]);
        const filingEntries = filingsValues.filter((v) => v.pid === filingsPid);

        if (filingEntries.length === 0) {
            return 0;
        }

        const filingsList: string[] = filingEntries
            .map((v) => String(v.value))
            .filter((v) => v && v !== '0');

        if (filingsList.length === 0) {
            return 0;
        }

        const dateProperties = await api.getEntityProperties(filingsList, [filingDatePid]);
        const supportedNeids = new Set(
            dateProperties.filter((p) => p.pid === filingDatePid && p.value).map((p) => p.eid)
        );

        return supportedNeids.size;
    }

    async function fetchNewsMentionsCount(neid: string): Promise<number> {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const intervalEnd = today.toISOString();

        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        const intervalStart = thirtyDaysAgo.toISOString();

        try {
            const response = await api.getMentionsLookup(neid, intervalStart, intervalEnd);
            return response.mcodes?.length ?? 0;
        } catch {
            return 0;
        }
    }

    async function refreshCompanyData(neid: string, name: string): Promise<WatchlistCompanyData> {
        const existingData = dataCache.get(neid) || {
            neid,
            name,
            edgarFilingsCount: null,
            newsMentionsCount: null,
            loading: true,
            lastRefreshed: null,
        };

        dataCache.set(neid, { ...existingData, loading: true });

        try {
            const [edgarFilingsCount, newsMentionsCount] = await Promise.all([
                fetchEdgarFilingsCount(neid),
                fetchNewsMentionsCount(neid),
            ]);

            const newData: WatchlistCompanyData = {
                neid,
                name,
                edgarFilingsCount,
                newsMentionsCount,
                loading: false,
                lastRefreshed: new Date().toISOString(),
            };

            dataCache.set(neid, newData);
            saveCacheToStorage();

            return newData;
        } catch (e) {
            const errorData: WatchlistCompanyData = {
                neid,
                name,
                edgarFilingsCount: null,
                newsMentionsCount: null,
                loading: false,
                lastRefreshed: null,
            };
            dataCache.set(neid, errorData);
            throw e;
        }
    }

    function removeCompanyData(neid: string) {
        dataCache.delete(neid);
        saveCacheToStorage();
    }

    function initializeCompany(neid: string, name: string) {
        if (!dataCache.has(neid)) {
            dataCache.set(neid, {
                neid,
                name,
                edgarFilingsCount: null,
                newsMentionsCount: null,
                loading: false,
                lastRefreshed: null,
            });
        }
    }

    return {
        getCompanyData,
        getAllCompanyData,
        refreshCompanyData,
        removeCompanyData,
        initializeCompany,
        dataCache,
    };
}
