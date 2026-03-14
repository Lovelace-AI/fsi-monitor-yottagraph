import { useWatchlistApi } from './useWatchlistApi';

export interface SupportedFiling {
    neid: string;
    filingDate: Date;
    formType: string;
}

export interface CompanyFilingsData {
    totalFilings: number;
    filingErrorCount: number;
    supportedFilings: SupportedFiling[];
    lastSupportedFilingDate: string;
}

const filingsCache = new Map<
    string,
    { data: CompanyFilingsData; promise: Promise<CompanyFilingsData> }
>();

export function useCompanyFilings(companyNeid: Ref<string>) {
    const api = useWatchlistApi();

    const loading = ref(true);
    const error = ref<string | null>(null);
    const data = ref<CompanyFilingsData>({
        totalFilings: 0,
        filingErrorCount: 0,
        supportedFilings: [],
        lastSupportedFilingDate: 'N/A',
    });

    async function loadFilings(): Promise<CompanyFilingsData> {
        const neid = companyNeid.value;

        const cached = filingsCache.get(neid);
        if (cached) {
            return cached.promise;
        }

        const promise = fetchFilings(neid);
        filingsCache.set(neid, { data: data.value, promise });

        return promise;
    }

    async function fetchFilings(neid: string): Promise<CompanyFilingsData> {
        loading.value = true;
        error.value = null;

        try {
            const schema = await api.getSchema();
            const filingsPid = schema.properties.find((p) => p.name === 'filing_reference')?.pid;
            const filingDatePid = schema.properties.find((p) => p.name === 'filing_date')?.pid;
            const formTypePid = schema.properties.find((p) => p.name === 'form_type')?.pid;

            if (!filingsPid || !filingDatePid) {
                throw new Error('Required schema properties not found');
            }

            const filingsValues = await api.getEntityProperties([neid], [filingsPid]);
            const filingEntries = filingsValues.filter((v) => v.pid === filingsPid);

            if (filingEntries.length === 0) {
                data.value = {
                    totalFilings: 0,
                    filingErrorCount: 0,
                    supportedFilings: [],
                    lastSupportedFilingDate: 'N/A',
                };
                return data.value;
            }

            const filingsList: string[] = filingEntries
                .map((v) => String(v.value))
                .filter((v) => v);
            const validNeids = filingsList.filter((f) => f && f !== '0');
            const filingErrorCount = filingsList.length - validNeids.length;

            const supportedFilings: SupportedFiling[] = [];
            let lastSupportedFilingDate = 'N/A';

            if (validNeids.length > 0) {
                const pidsToFetch = formTypePid ? [filingDatePid, formTypePid] : [filingDatePid];
                const docProperties = await api.getEntityProperties(validNeids, pidsToFetch);

                const dateByNeid: Record<string, Date> = {};
                const formTypeByNeid: Record<string, string> = {};

                for (const prop of docProperties) {
                    if (prop.pid === filingDatePid && prop.value) {
                        dateByNeid[prop.eid] = new Date(prop.value);
                    }
                    if (formTypePid && prop.pid === formTypePid && prop.value) {
                        formTypeByNeid[prop.eid] = String(prop.value);
                    }
                }

                for (const docNeid of validNeids) {
                    if (dateByNeid[docNeid]) {
                        supportedFilings.push({
                            neid: docNeid,
                            filingDate: dateByNeid[docNeid],
                            formType: formTypeByNeid[docNeid] || 'Unknown',
                        });
                    }
                }

                if (supportedFilings.length > 0) {
                    supportedFilings.sort(
                        (a, b) => b.filingDate.getTime() - a.filingDate.getTime()
                    );
                    lastSupportedFilingDate = supportedFilings[0].filingDate
                        .toISOString()
                        .split('T')[0];
                }
            }

            data.value = {
                totalFilings: filingsList.length,
                filingErrorCount,
                supportedFilings,
                lastSupportedFilingDate,
            };

            return data.value;
        } catch (e: any) {
            error.value = e.message || 'Failed to load filings';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    function invalidateCache() {
        filingsCache.delete(companyNeid.value);
    }

    watch(
        companyNeid,
        () => {
            loadFilings();
        },
        { immediate: true }
    );

    return {
        loading,
        error,
        data,
        loadFilings,
        invalidateCache,
    };
}
