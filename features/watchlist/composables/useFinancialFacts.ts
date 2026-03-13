import { useWatchlistApi } from './useWatchlistApi';
import { useCompanyFilings, type SupportedFiling } from './useCompanyFilings';

export interface XbrlConcept {
    name: string;
    property: string | null;
}

export interface ColumnFallback {
    type: 'simple' | 'sum' | 'difference';
    concepts: XbrlConcept[];
}

export interface ColumnDefinition {
    id: string;
    label: string;
    unit?: '$';
    fallbacks: ColumnFallback[];
}

export interface CellValue {
    value: number | string | null;
    formattedValue: string;
    usedConcept: string | null;
}

export interface FinancialFactsRow {
    neid: string;
    period: string;
    formDate: Date;
    formType: string;
    cells: Record<string, CellValue>;
}

export interface MostRecentValues {
    [columnId: string]: {
        value: number | null;
        formattedValue: string;
        usedConcept: string | null;
        formDate: Date;
    };
}

const XBRL_TO_PROPERTY: Record<string, string | null> = {
    'us-gaap:Assets': 'us_gaap:assets',
    'us-gaap:AssetsCurrent': 'us_gaap:assets_current',
    'us-gaap:AssetsNoncurrent': null,
    'us-gaap:Cash': 'us_gaap:cash',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue': 'us_gaap:cash_and_cash_equivalents',
    'us-gaap:CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents': null,
    'us-gaap:ComprehensiveIncomeNetOfTax': null,
    'us-gaap:InterestAndDebtExpense': 'us_gaap:interest_and_debt_expense',
    'us-gaap:InterestExpense': 'us_gaap:interest_expense',
    'us-gaap:InterestExpenseDebt': 'us_gaap:interest_expense_debt',
    'us-gaap:InterestExpenseNonoperating': 'us_gaap:interest_expense_nonoperating',
    'us-gaap:InterestExpenseOperating': 'us_gaap:interest_expense_operating',
    'us-gaap:Liabilities': 'us_gaap:liabilities',
    'us-gaap:LiabilitiesAndStockholdersEquity': null,
    'us-gaap:LiabilitiesCurrent': 'us_gaap:liabilities_current',
    'us-gaap:LiabilitiesNoncurrent': null,
    'us-gaap:MembersEquity': null,
    'us-gaap:NetIncomeLoss': 'us_gaap:net_income_loss',
    'us-gaap:NetIncomeLossAttributableToParent': null,
    'us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic': null,
    'us-gaap:NetIncomeLossFromRealEstateAndFinancialServiceActivities': null,
    'us-gaap:OperatingIncomeLoss': 'us_gaap:operating_income_loss',
    'us-gaap:PartnersCapital': 'us_gaap:partners_capital',
    'us-gaap:ProfitLoss': 'us_gaap:profit_loss',
    'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax': 'us_gaap:revenue_from_contracts',
    'us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax': null,
    'us-gaap:Revenues': 'us_gaap:revenues',
    'us-gaap:SalesRevenueGoodsNet': null,
    'us-gaap:SalesRevenueNet': null,
    'us-gaap:SalesRevenueServicesNet': null,
    'us-gaap:StockholdersEquity': 'us_gaap:stockholders_equity',
    'us-gaap:StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest':
        'us_gaap:stockholders_equity_total',
};

function concept(name: string): XbrlConcept {
    return { name, property: XBRL_TO_PROPERTY[name] ?? null };
}

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
    {
        id: 'revenue',
        label: 'Revenue',
        unit: '$',
        fallbacks: [
            { type: 'simple', concepts: [concept('us-gaap:Revenues')] },
            {
                type: 'simple',
                concepts: [concept('us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax')],
            },
            {
                type: 'simple',
                concepts: [concept('us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax')],
            },
            { type: 'simple', concepts: [concept('us-gaap:SalesRevenueNet')] },
            { type: 'simple', concepts: [concept('us-gaap:SalesRevenueGoodsNet')] },
            { type: 'simple', concepts: [concept('us-gaap:SalesRevenueServicesNet')] },
            {
                type: 'simple',
                concepts: [
                    concept('us-gaap:NetIncomeLossFromRealEstateAndFinancialServiceActivities'),
                ],
            },
        ],
    },
    {
        id: 'netIncome',
        label: 'Net Income',
        unit: '$',
        fallbacks: [
            { type: 'simple', concepts: [concept('us-gaap:NetIncomeLoss')] },
            {
                type: 'simple',
                concepts: [concept('us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic')],
            },
            { type: 'simple', concepts: [concept('us-gaap:ProfitLoss')] },
            { type: 'simple', concepts: [concept('us-gaap:NetIncomeLossAttributableToParent')] },
            { type: 'simple', concepts: [concept('us-gaap:ComprehensiveIncomeNetOfTax')] },
        ],
    },
    {
        id: 'operatingIncome',
        label: 'Operating Income',
        unit: '$',
        fallbacks: [{ type: 'simple', concepts: [concept('us-gaap:OperatingIncomeLoss')] }],
    },
    {
        id: 'assets',
        label: 'Assets',
        unit: '$',
        fallbacks: [
            { type: 'simple', concepts: [concept('us-gaap:Assets')] },
            {
                type: 'sum',
                concepts: [concept('us-gaap:AssetsCurrent'), concept('us-gaap:AssetsNoncurrent')],
            },
        ],
    },
    {
        id: 'currentAssets',
        label: 'Current Assets',
        unit: '$',
        fallbacks: [{ type: 'simple', concepts: [concept('us-gaap:AssetsCurrent')] }],
    },
    {
        id: 'liabilities',
        label: 'Liabilities',
        unit: '$',
        fallbacks: [
            { type: 'simple', concepts: [concept('us-gaap:Liabilities')] },
            {
                type: 'sum',
                concepts: [
                    concept('us-gaap:LiabilitiesCurrent'),
                    concept('us-gaap:LiabilitiesNoncurrent'),
                ],
            },
            {
                type: 'difference',
                concepts: [
                    concept('us-gaap:LiabilitiesAndStockholdersEquity'),
                    concept('us-gaap:StockholdersEquity'),
                ],
            },
        ],
    },
    {
        id: 'currentLiabilities',
        label: 'Current Liabilities',
        unit: '$',
        fallbacks: [{ type: 'simple', concepts: [concept('us-gaap:LiabilitiesCurrent')] }],
    },
    {
        id: 'equity',
        label: 'Equity',
        unit: '$',
        fallbacks: [
            { type: 'simple', concepts: [concept('us-gaap:StockholdersEquity')] },
            {
                type: 'simple',
                concepts: [
                    concept(
                        'us-gaap:StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'
                    ),
                ],
            },
            {
                type: 'difference',
                concepts: [
                    concept('us-gaap:LiabilitiesAndStockholdersEquity'),
                    concept('us-gaap:Liabilities'),
                ],
            },
            { type: 'simple', concepts: [concept('us-gaap:MembersEquity')] },
            { type: 'simple', concepts: [concept('us-gaap:PartnersCapital')] },
        ],
    },
    {
        id: 'interestExpense',
        label: 'Interest Expense',
        unit: '$',
        fallbacks: [
            { type: 'simple', concepts: [concept('us-gaap:InterestExpense')] },
            { type: 'simple', concepts: [concept('us-gaap:InterestExpenseNonoperating')] },
            { type: 'simple', concepts: [concept('us-gaap:InterestExpenseOperating')] },
            { type: 'simple', concepts: [concept('us-gaap:InterestExpenseDebt')] },
            { type: 'simple', concepts: [concept('us-gaap:InterestAndDebtExpense')] },
        ],
    },
    {
        id: 'cash',
        label: 'Cash',
        unit: '$',
        fallbacks: [
            {
                type: 'simple',
                concepts: [concept('us-gaap:CashAndCashEquivalentsAtCarryingValue')],
            },
            {
                type: 'simple',
                concepts: [
                    concept(
                        'us-gaap:CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'
                    ),
                ],
            },
            { type: 'simple', concepts: [concept('us-gaap:Cash')] },
        ],
    },
];

export function formatCurrency(value: number): string {
    const absValue = Math.abs(value);
    const prefix = value < 0 ? '-$' : '$';

    if (absValue >= 1_000_000_000_000) {
        return `${prefix}${(absValue / 1_000_000_000_000).toFixed(1)}T`;
    } else if (absValue >= 1_000_000_000) {
        return `${prefix}${(absValue / 1_000_000_000).toFixed(1)}B`;
    } else if (absValue >= 1_000_000) {
        return `${prefix}${(absValue / 1_000_000).toFixed(1)}M`;
    } else if (absValue >= 1_000) {
        return `${prefix}${(absValue / 1_000).toFixed(1)}K`;
    } else {
        return `${prefix}${absValue.toLocaleString('en-US')}`;
    }
}

export function formatPeriod(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function useFinancialFacts(companyNeid: Ref<string>) {
    const api = useWatchlistApi();
    const { loadFilings } = useCompanyFilings(companyNeid);

    const loading = ref(true);
    const error = ref<string | null>(null);
    const rows = ref<FinancialFactsRow[]>([]);
    const mostRecentValues = ref<MostRecentValues>({});

    async function loadFinancialFacts() {
        loading.value = true;
        error.value = null;
        rows.value = [];
        mostRecentValues.value = {};

        try {
            // Use shared filings data (already fetched filing_date for all filings)
            const filingsResult = await loadFilings();
            const supportedFilings = filingsResult.supportedFilings;

            if (supportedFilings.length === 0) {
                loading.value = false;
                return;
            }

            // Filter to only 10-K and 10-Q filings within the 3-year window
            const threeYearsAgo = new Date();
            threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

            const recentFilings = supportedFilings.filter((f) => {
                if (f.filingDate < threeYearsAgo) return false;
                const formType = f.formType.toUpperCase();
                return (
                    formType === '10-K' ||
                    formType === '10-Q' ||
                    formType === '10-K/A' ||
                    formType === '10-Q/A'
                );
            });

            if (recentFilings.length === 0) {
                loading.value = false;
                return;
            }

            const recentFilingNeids = recentFilings.map((f) => f.neid);

            // Build list of all property PIDs we need
            const schema = await api.getSchema();
            const allPropertyNames = new Set<string>();
            allPropertyNames.add('form_type');

            for (const col of COLUMN_DEFINITIONS) {
                for (const fallback of col.fallbacks) {
                    for (const concept of fallback.concepts) {
                        if (concept.property) {
                            allPropertyNames.add(concept.property);
                        }
                    }
                }
            }

            const propertyPids: Record<string, number> = {};
            for (const propName of allPropertyNames) {
                const prop = schema.properties.find((p) => p.name === propName);
                if (prop) {
                    propertyPids[propName] = prop.pid;
                }
            }

            // Fetch all properties only for recent supported filings
            const pidsToFetch = Object.values(propertyPids);
            const allPropertyValues = await api.getEntityProperties(recentFilingNeids, pidsToFetch);

            const valuesByNeid: Record<string, Record<number, any>> = {};
            for (const pv of allPropertyValues) {
                if (!valuesByNeid[pv.eid]) {
                    valuesByNeid[pv.eid] = {};
                }
                valuesByNeid[pv.eid][pv.pid] = pv.value;
            }

            const processedRows: FinancialFactsRow[] = [];

            for (const rf of recentFilings) {
                const props = valuesByNeid[rf.neid] || {};

                const formType = props[propertyPids['form_type']] || 'Unknown';
                const period = formatPeriod(rf.filingDate);

                const cells: Record<string, CellValue> = {};

                for (const col of COLUMN_DEFINITIONS) {
                    const cellValue = resolveColumnValue(col, props, propertyPids);
                    cells[col.id] = cellValue;
                }

                processedRows.push({
                    neid: rf.neid,
                    period,
                    formDate: rf.filingDate,
                    formType,
                    cells,
                });
            }

            processedRows.sort((a, b) => b.formDate.getTime() - a.formDate.getTime());
            rows.value = processedRows;

            const recent: MostRecentValues = {};
            for (const col of COLUMN_DEFINITIONS) {
                for (const row of processedRows) {
                    const cell = row.cells[col.id];
                    if (cell.value !== null && typeof cell.value === 'number') {
                        if (!recent[col.id]) {
                            recent[col.id] = {
                                value: cell.value,
                                formattedValue: cell.formattedValue,
                                usedConcept: cell.usedConcept,
                                formDate: row.formDate,
                            };
                        }
                        break;
                    }
                }
            }
            mostRecentValues.value = recent;
        } catch (e: any) {
            error.value = e.message || 'Failed to load financial facts';
        } finally {
            loading.value = false;
        }
    }

    function resolveColumnValue(
        column: ColumnDefinition,
        props: Record<number, any>,
        propertyPids: Record<string, number>
    ): CellValue {
        for (const fallback of column.fallbacks) {
            const allConceptsSupported = fallback.concepts.every((c) => c.property !== null);
            if (!allConceptsSupported) continue;

            const values: number[] = [];
            let allValuesPresent = true;

            for (const concept of fallback.concepts) {
                const pid = propertyPids[concept.property!];
                if (pid === undefined) {
                    allValuesPresent = false;
                    break;
                }
                const val = props[pid];
                if (val === undefined || val === null) {
                    allValuesPresent = false;
                    break;
                }
                values.push(Number(val));
            }

            if (!allValuesPresent) continue;

            let result: number;
            let usedConcept: string;

            if (fallback.type === 'simple') {
                result = values[0];
                usedConcept = fallback.concepts[0].name;
            } else if (fallback.type === 'sum') {
                result = values.reduce((sum, v) => sum + v, 0);
                usedConcept = fallback.concepts.map((c) => c.name).join(' + ');
            } else {
                result = values[0] - values[1];
                usedConcept = `${fallback.concepts[0].name} - ${fallback.concepts[1].name}`;
            }

            return {
                value: result,
                formattedValue: column.unit === '$' ? formatCurrency(result) : String(result),
                usedConcept,
            };
        }

        return {
            value: null,
            formattedValue: '—',
            usedConcept: null,
        };
    }

    watch(companyNeid, loadFinancialFacts, { immediate: true });

    return {
        loading,
        error,
        rows,
        mostRecentValues,
        columns: COLUMN_DEFINITIONS,
        reload: loadFinancialFacts,
    };
}
