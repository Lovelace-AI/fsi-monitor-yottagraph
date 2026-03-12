import { useWatchlistApi } from './useWatchlistApi';
import { useCompanyFilings } from './useCompanyFilings';

export interface Form8kEvent {
    neid: string;
    date: Date;
    item: string;
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Event8kSummary {
    events: Form8kEvent[];
    totalCount: number;
    execChangeCount12mo: number;
    governanceEvents: Form8kEvent[];
}

const EVENT_TYPE_LOOKUP: Record<string, string> = {
    '1.01': 'FINANCING_MATERIAL_AGREEMENT',
    '1.02': 'FINANCING_TERMINATION',
    '1.03': 'FINANCING_BANKRUPTCY',
    '1.04': 'OPERATIONAL_SAFETY',
    '2.01': 'MNA_ACQUISITION_DISPOSITION',
    '2.02': 'FINANCIAL_RESULTS',
    '2.03': 'FINANCING_DIRECT_OBLIGATION',
    '2.04': 'FINANCING_TRIGGERING_EVENTS',
    '2.05': 'OPERATIONAL_RESTRUCTURING',
    '2.06': 'FINANCIAL_IMPAIRMENT',
    '3.01': 'DELISTING_NOTICE',
    '3.02': 'EQUITY_ISSUANCE',
    '3.03': 'GOVERNANCE_STOCKHOLDER_RIGHTS',
    '4.01': 'ACCOUNTING_AUDITOR_CHANGE',
    '4.02': 'ACCOUNTING_NON_RELIANCE',
    '5.01': 'GOVERNANCE_CHANGES_CONTROL',
    '5.02': 'EXEC_DEPARTURE_APPOINTMENT',
    '5.03': 'GOVERNANCE_BYLAW_CHANGE',
    '5.04': 'TRADING_SUSPENSION',
    '5.05': 'GOVERNANCE_ETHICS_CHANGE',
    '5.06': 'CORPORATE_STRUCTURE_CHANGE',
    '5.07': 'GOVERNANCE_SHAREHOLDER_VOTE',
    '5.08': 'GOVERNANCE_NOMINATION',
    '6.01': 'ABS_DISCLOSURE',
    '7.01': 'REG_FD_DISCLOSURE',
    '8.01': 'OTHER_EVENT',
    '9.01': 'EXHIBITS',
};

const SEVERITY_LOOKUP: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    '1.01': 'high',
    '1.02': 'high',
    '1.03': 'critical',
    '1.04': 'medium',
    '2.01': 'medium',
    '2.02': 'low',
    '2.03': 'medium',
    '2.04': 'high',
    '2.05': 'medium',
    '2.06': 'high',
    '3.01': 'high',
    '3.02': 'low',
    '3.03': 'medium',
    '4.01': 'medium',
    '4.02': 'critical',
    '5.01': 'high',
    '5.02': 'medium',
    '5.03': 'low',
    '5.04': 'high',
    '5.05': 'low',
    '5.06': 'medium',
    '5.07': 'low',
    '5.08': 'low',
    '6.01': 'low',
    '7.01': 'low',
    '8.01': 'low',
    '9.01': 'low',
};

const GOVERNANCE_ITEMS = ['3.03', '5.01', '5.02', '5.03', '5.05', '5.07', '5.08'];

export function formatEventDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function use8kEvents(companyNeid: Ref<string>) {
    const api = useWatchlistApi();
    const { loadFilings } = useCompanyFilings(companyNeid);

    const loading = ref(true);
    const error = ref<string | null>(null);
    const events = ref<Form8kEvent[]>([]);
    const summary = ref<Event8kSummary>({
        events: [],
        totalCount: 0,
        execChangeCount12mo: 0,
        governanceEvents: [],
    });

    async function load8kEvents() {
        loading.value = true;
        error.value = null;
        events.value = [];

        try {
            const filingsResult = await loadFilings();
            const supportedFilings = filingsResult.supportedFilings;

            if (supportedFilings.length === 0) {
                summary.value = {
                    events: [],
                    totalCount: 0,
                    execChangeCount12mo: 0,
                    governanceEvents: [],
                };
                loading.value = false;
                return;
            }

            const supportedFilingNeids = supportedFilings.map((f) => f.neid);

            const schema = await api.getSchema();
            const form8kEventPid = schema.properties.find(
                (p) => p.name === 'form_8k_item_code'
            )?.pid;
            const filingDatePid = schema.properties.find((p) => p.name === 'filing_date')?.pid;

            if (!form8kEventPid || !filingDatePid) {
                throw new Error('Required schema properties not found');
            }

            const propertyValues = await api.getEntityProperties(supportedFilingNeids, [
                form8kEventPid,
                filingDatePid,
            ]);

            const valuesByNeid: Record<string, { item?: string; date?: Date }> = {};
            for (const pv of propertyValues) {
                if (!valuesByNeid[pv.eid]) {
                    valuesByNeid[pv.eid] = {};
                }
                if (pv.pid === form8kEventPid && pv.value) {
                    valuesByNeid[pv.eid].item = String(pv.value);
                }
                if (pv.pid === filingDatePid && pv.value) {
                    valuesByNeid[pv.eid].date = new Date(pv.value);
                }
            }

            const parsed8kEvents: Form8kEvent[] = [];

            for (const [neid, data] of Object.entries(valuesByNeid)) {
                if (data.item && data.date) {
                    const eventType = EVENT_TYPE_LOOKUP[data.item] || 'UNKNOWN';
                    const severity = SEVERITY_LOOKUP[data.item] || 'low';

                    parsed8kEvents.push({
                        neid,
                        date: data.date,
                        item: data.item,
                        eventType,
                        severity,
                    });
                }
            }

            parsed8kEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
            events.value = parsed8kEvents;

            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

            const execChangeCount12mo = parsed8kEvents.filter(
                (e) => e.item === '5.02' && e.date >= twelveMonthsAgo
            ).length;

            const governanceEvents = parsed8kEvents
                .filter((e) => GOVERNANCE_ITEMS.includes(e.item))
                .slice(0, 5);

            summary.value = {
                events: parsed8kEvents,
                totalCount: parsed8kEvents.length,
                execChangeCount12mo,
                governanceEvents,
            };
        } catch (e: any) {
            error.value = e.message || 'Failed to load 8-K events';
        } finally {
            loading.value = false;
        }
    }

    watch(companyNeid, load8kEvents, { immediate: true });

    return {
        loading,
        error,
        events,
        summary,
        reload: load8kEvents,
    };
}
