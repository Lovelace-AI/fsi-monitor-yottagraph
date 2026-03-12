import { useWatchlistApi } from './useWatchlistApi';
import { useCompanyFilings } from './useCompanyFilings';
import { useFinancialFacts, type MostRecentValues } from './useFinancialFacts';
import { use8kEvents, type Form8kEvent } from './use8kEvents';

export interface FinancialRatio {
    name: string;
    value: number | null;
    formattedValue: string;
    unit: string;
    equation: string;
}

export interface DistressEvent {
    date: Date;
    itemCode: string;
    eventType: string;
    severity: 'medium' | 'high' | 'critical';
    score: number;
    weight: number;
}

export interface DistressEventsSummary {
    events: DistressEvent[];
    weightedScore: number;
}

export type BehaviorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BehaviorSignal {
    name: string;
    rawValue: number;
    severity: BehaviorSeverity;
    score: number;
    weight: number;
}

export interface BehaviorSignalsSummary {
    signals: BehaviorSignal[];
    behaviorScore: number;
}

const DISTRESS_EVENT_CONFIG: Record<
    string,
    { eventType: string; severity: 'medium' | 'high' | 'critical'; score: number; weight: number }
> = {
    '1.02': { eventType: 'FINANCING_TERMINATION', severity: 'medium', score: 50, weight: 8 },
    '1.03': { eventType: 'FINANCING_BANKRUPTCY', severity: 'critical', score: 100, weight: 30 },
    '2.04': { eventType: 'FINANCING_TRIGGERING_EVENTS', severity: 'high', score: 70, weight: 15 },
    '2.06': { eventType: 'FINANCIAL_IMPAIRMENT', severity: 'high', score: 60, weight: 10 },
    '3.01': { eventType: 'DELISTING_NOTICE', severity: 'critical', score: 90, weight: 25 },
    '4.02': { eventType: 'ACCOUNTING_NON_RELIANCE', severity: 'critical', score: 85, weight: 20 },
};

const DISTRESS_ITEM_CODES = Object.keys(DISTRESS_EVENT_CONFIG);

function calculateRecencyMultiplier(daysAgo: number): number {
    return Math.max(0.25, 1.0 - (daysAgo / 730) * 0.75);
}

function calculateLateFilingScore(count: number): { severity: BehaviorSeverity; score: number } {
    if (count === 0) return { severity: 'low', score: 0 };
    if (count === 1) return { severity: 'medium', score: 50 };
    if (count === 2) return { severity: 'high', score: 70 };
    return { severity: 'critical', score: 85 };
}

function calculateFilingGapScore(days: number): { severity: BehaviorSeverity; score: number } {
    if (days < 90) return { severity: 'low', score: 0 };
    if (days < 180) return { severity: 'medium', score: 40 };
    if (days < 365) return { severity: 'high', score: 65 };
    return { severity: 'critical', score: 90 };
}

function calculateAmendmentScore(count: number): { severity: BehaviorSeverity; score: number } {
    if (count < 5) return { severity: 'low', score: 0 };
    return { severity: 'medium', score: 40 };
}

function calculateOfficerDepartureScore(count: number): {
    severity: BehaviorSeverity;
    score: number;
} {
    if (count === 0) return { severity: 'low', score: 0 };
    if (count === 1) return { severity: 'medium', score: 40 };
    if (count === 2) return { severity: 'high', score: 60 };
    return { severity: 'critical', score: 80 };
}

function calculateDirectorDepartureScore(count: number): {
    severity: BehaviorSeverity;
    score: number;
} {
    if (count === 0) return { severity: 'low', score: 0 };
    if (count === 1) return { severity: 'medium', score: 35 };
    return { severity: 'high', score: 55 };
}

function calculateAuditorChangeScore(count: number): { severity: BehaviorSeverity; score: number } {
    if (count === 0) return { severity: 'low', score: 0 };
    if (count === 1) return { severity: 'high', score: 65 };
    return { severity: 'critical', score: 85 };
}

export function useSolvencyScore(companyNeid: Ref<string>) {
    const api = useWatchlistApi();
    const { loadFilings } = useCompanyFilings(companyNeid);
    const { mostRecentValues, reload: reloadFinancialFacts } = useFinancialFacts(companyNeid);
    const { events: all8kEvents, reload: reload8kEvents } = use8kEvents(companyNeid);

    const loading = ref(true);
    const error = ref<string | null>(null);

    const financialRatios = ref<FinancialRatio[]>([]);
    const distressEventsSummary = ref<DistressEventsSummary>({ events: [], weightedScore: 0 });
    const behaviorSignalsSummary = ref<BehaviorSignalsSummary>({ signals: [], behaviorScore: 0 });

    function calculateFinancialRatios(values: MostRecentValues): FinancialRatio[] {
        const ratios: FinancialRatio[] = [];

        const liabilities = values.liabilities?.value ?? null;
        const equity = values.equity?.value ?? null;
        const assets = values.assets?.value ?? null;
        const netIncome = values.netIncome?.value ?? null;
        const revenue = values.revenue?.value ?? null;
        const currentAssets = values.currentAssets?.value ?? null;
        const currentLiabilities = values.currentLiabilities?.value ?? null;

        let leverageRatio: number | null = null;
        if (liabilities !== null && equity !== null && equity !== 0) {
            leverageRatio = liabilities / equity;
        }
        ratios.push({
            name: 'Leverage Ratio',
            value: leverageRatio,
            formattedValue: leverageRatio !== null ? `${leverageRatio.toFixed(2)}x` : '—',
            unit: 'x',
            equation: 'Liabilities / Equity',
        });

        let equityRatio: number | null = null;
        if (equity !== null && assets !== null && assets !== 0) {
            equityRatio = (equity / assets) * 100;
        }
        ratios.push({
            name: 'Equity Ratio',
            value: equityRatio,
            formattedValue: equityRatio !== null ? `${equityRatio.toFixed(1)}%` : '—',
            unit: '%',
            equation: 'Equity / Assets',
        });

        let netMargin: number | null = null;
        if (netIncome !== null && revenue !== null && revenue !== 0) {
            netMargin = (netIncome / revenue) * 100;
        }
        ratios.push({
            name: 'Net Margin',
            value: netMargin,
            formattedValue: netMargin !== null ? `${netMargin.toFixed(1)}%` : '—',
            unit: '%',
            equation: 'Net Income / Revenue',
        });

        let currentRatio: number | null = null;
        if (currentAssets !== null && currentLiabilities !== null && currentLiabilities !== 0) {
            currentRatio = currentAssets / currentLiabilities;
        }
        ratios.push({
            name: 'Current Ratio',
            value: currentRatio,
            formattedValue: currentRatio !== null ? `${currentRatio.toFixed(2)}x` : '—',
            unit: 'x',
            equation: 'Current Assets / Current Liabilities',
        });

        return ratios;
    }

    function calculateDistressEvents(events: Form8kEvent[]): DistressEventsSummary {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const now = new Date();

        const distressEvents: DistressEvent[] = [];

        for (const event of events) {
            if (event.date < twoYearsAgo) continue;
            if (!DISTRESS_ITEM_CODES.includes(event.item)) continue;

            const config = DISTRESS_EVENT_CONFIG[event.item];
            distressEvents.push({
                date: event.date,
                itemCode: event.item,
                eventType: config.eventType,
                severity: config.severity,
                score: config.score,
                weight: config.weight,
            });
        }

        distressEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

        let weightedScore = 0;
        for (const event of distressEvents) {
            const daysAgo = Math.floor(
                (now.getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24)
            );
            const recencyMultiplier = calculateRecencyMultiplier(daysAgo);
            weightedScore += event.score * event.weight * recencyMultiplier;
        }

        return { events: distressEvents, weightedScore: Math.round(weightedScore) };
    }

    async function calculateBehaviorSignals(): Promise<BehaviorSignalsSummary> {
        const signals: BehaviorSignal[] = [];

        try {
            const filingsResult = await loadFilings();
            const supportedFilings = filingsResult.supportedFilings;

            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

            const now = new Date();

            const schema = await api.getSchema();
            const formTypePid = schema.properties.find((p) => p.name === 'form_type')?.pid;
            const filingDatePid = schema.properties.find((p) => p.name === 'filing_date')?.pid;
            const form8kItemCodePid = schema.properties.find(
                (p) => p.name === 'form_8k_item_code'
            )?.pid;

            if (!formTypePid || !filingDatePid) {
                throw new Error('Required schema properties not found');
            }

            const filingNeids = supportedFilings.map((f) => f.neid);
            const pidsToFetch = [formTypePid, filingDatePid];
            if (form8kItemCodePid) pidsToFetch.push(form8kItemCodePid);

            const propertyValues = await api.getEntityProperties(filingNeids, pidsToFetch);

            const filingData: Record<
                string,
                { formType?: string; date?: Date; itemCode?: string }
            > = {};
            for (const pv of propertyValues) {
                if (!filingData[pv.eid]) filingData[pv.eid] = {};
                if (pv.pid === formTypePid) filingData[pv.eid].formType = String(pv.value);
                if (pv.pid === filingDatePid) filingData[pv.eid].date = new Date(pv.value);
                if (form8kItemCodePid && pv.pid === form8kItemCodePid)
                    filingData[pv.eid].itemCode = String(pv.value);
            }

            let lateFilingCount = 0;
            let amendmentCount = 0;
            let auditorChangeCount = 0;
            let mostRecentFilingDate: Date | null = null;

            for (const [, data] of Object.entries(filingData)) {
                if (!data.date || !data.formType) continue;

                if (data.date >= twelveMonthsAgo) {
                    const formType = data.formType.toUpperCase();
                    if (
                        formType === 'NT 10-K' ||
                        formType === 'NT 10-Q' ||
                        formType === 'NT 10-K/A' ||
                        formType === 'NT 10-Q/A'
                    ) {
                        lateFilingCount++;
                    }

                    if (formType.endsWith('/A')) {
                        amendmentCount++;
                    }

                    if (data.itemCode === '4.01') {
                        auditorChangeCount++;
                    }
                }

                if (!mostRecentFilingDate || data.date > mostRecentFilingDate) {
                    mostRecentFilingDate = data.date;
                }
            }

            const filingGapDays = mostRecentFilingDate
                ? Math.floor(
                      (now.getTime() - mostRecentFilingDate.getTime()) / (1000 * 60 * 60 * 24)
                  )
                : 365;

            const lateFilingResult = calculateLateFilingScore(lateFilingCount);
            signals.push({
                name: 'Late Filing',
                rawValue: lateFilingCount,
                severity: lateFilingResult.severity,
                score: lateFilingResult.score,
                weight: 1.2,
            });

            const filingGapResult = calculateFilingGapScore(filingGapDays);
            signals.push({
                name: 'Filing Gap',
                rawValue: filingGapDays,
                severity: filingGapResult.severity,
                score: filingGapResult.score,
                weight: 1.0,
            });

            const amendmentResult = calculateAmendmentScore(amendmentCount);
            signals.push({
                name: 'Amendment Frequency',
                rawValue: amendmentCount,
                severity: amendmentResult.severity,
                score: amendmentResult.score,
                weight: 0.8,
            });

            // TODO: Officer departures - currently always 0
            const officerDepartureResult = calculateOfficerDepartureScore(0);
            signals.push({
                name: 'Officer Departures',
                rawValue: 0,
                severity: officerDepartureResult.severity,
                score: officerDepartureResult.score,
                weight: 1.0,
            });

            // TODO: Director departures - currently always 0
            const directorDepartureResult = calculateDirectorDepartureScore(0);
            signals.push({
                name: 'Director Departures',
                rawValue: 0,
                severity: directorDepartureResult.severity,
                score: directorDepartureResult.score,
                weight: 0.8,
            });

            const auditorChangeResult = calculateAuditorChangeScore(auditorChangeCount);
            signals.push({
                name: 'Auditor Changes',
                rawValue: auditorChangeCount,
                severity: auditorChangeResult.severity,
                score: auditorChangeResult.score,
                weight: 1.5,
            });

            const nonZeroSignals = signals.filter((s) => s.score > 0);
            let behaviorScore = 0;
            if (nonZeroSignals.length > 0) {
                const weightedSum = nonZeroSignals.reduce((sum, s) => sum + s.score * s.weight, 0);
                const totalWeight = nonZeroSignals.reduce((sum, s) => sum + s.weight, 0);
                behaviorScore = Math.round(weightedSum / totalWeight);
            }

            return { signals, behaviorScore };
        } catch (e: any) {
            error.value = e.message || 'Failed to calculate behavior signals';
            return { signals: [], behaviorScore: 0 };
        }
    }

    async function loadSolvencyData() {
        loading.value = true;
        error.value = null;

        try {
            await Promise.all([reloadFinancialFacts(), reload8kEvents()]);

            financialRatios.value = calculateFinancialRatios(mostRecentValues.value);

            distressEventsSummary.value = calculateDistressEvents(all8kEvents.value);

            behaviorSignalsSummary.value = await calculateBehaviorSignals();
        } catch (e: any) {
            error.value = e.message || 'Failed to load solvency data';
        } finally {
            loading.value = false;
        }
    }

    watch(companyNeid, loadSolvencyData, { immediate: true });

    return {
        loading,
        error,
        financialRatios,
        distressEventsSummary,
        behaviorSignalsSummary,
        reload: loadSolvencyData,
    };
}
