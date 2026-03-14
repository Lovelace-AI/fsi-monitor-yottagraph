<template>
    <v-card class="fill-height" variant="outlined">
        <v-card-title class="d-flex align-center pb-1">
            <v-icon color="indigo" size="small" class="mr-2">mdi-chart-line</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Financial Facts</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
            <div v-if="loading" class="d-flex justify-center pa-4">
                <v-progress-circular indeterminate size="24" />
            </div>
            <div v-else-if="error" class="pa-4 text-error">
                {{ error }}
            </div>
            <div v-else-if="rows.length === 0" class="pa-4 text-medium-emphasis">
                No 10-K or 10-Q filings found in the last 3 years.
            </div>
            <div v-else class="financial-facts-table-container">
                <v-table density="compact" class="financial-facts-table">
                    <thead>
                        <tr>
                            <th class="text-left">Period</th>
                            <th class="text-left">Form</th>
                            <th v-for="col in columns" :key="col.id" class="text-right">
                                <v-tooltip location="top">
                                    <template #activator="{ props: tooltipProps }">
                                        <span v-bind="tooltipProps" class="header-with-tooltip">
                                            {{ col.label }}
                                        </span>
                                    </template>
                                    <div class="tooltip-content">
                                        <div class="text-caption font-weight-bold mb-1">
                                            Priority order:
                                        </div>
                                        <div
                                            v-for="(fallback, idx) in col.fallbacks"
                                            :key="idx"
                                            class="tooltip-fallback"
                                        >
                                            <span class="text-caption">{{ idx + 1 }}. </span>
                                            <template v-if="fallback.type === 'simple'">
                                                <span
                                                    :class="getConceptClass(fallback.concepts[0])"
                                                    class="text-caption"
                                                >
                                                    {{ fallback.concepts[0].name }}
                                                </span>
                                            </template>
                                            <template v-else-if="fallback.type === 'sum'">
                                                <span
                                                    :class="getConceptClass(fallback.concepts[0])"
                                                    class="text-caption"
                                                >
                                                    {{ fallback.concepts[0].name }}
                                                </span>
                                                <span class="text-caption"> + </span>
                                                <span
                                                    :class="getConceptClass(fallback.concepts[1])"
                                                    class="text-caption"
                                                >
                                                    {{ fallback.concepts[1].name }}
                                                </span>
                                            </template>
                                            <template v-else>
                                                <span
                                                    :class="getConceptClass(fallback.concepts[0])"
                                                    class="text-caption"
                                                >
                                                    {{ fallback.concepts[0].name }}
                                                </span>
                                                <span class="text-caption"> - </span>
                                                <span
                                                    :class="getConceptClass(fallback.concepts[1])"
                                                    class="text-caption"
                                                >
                                                    {{ fallback.concepts[1].name }}
                                                </span>
                                            </template>
                                        </div>
                                    </div>
                                </v-tooltip>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in rows" :key="row.neid">
                            <td class="text-left">{{ row.period }}</td>
                            <td class="text-left">{{ row.formType }}</td>
                            <td v-for="col in columns" :key="col.id" class="text-right">
                                <v-tooltip v-if="row.cells[col.id].usedConcept" location="top">
                                    <template #activator="{ props: tooltipProps }">
                                        <span v-bind="tooltipProps" class="value-with-tooltip">
                                            {{ row.cells[col.id].formattedValue }}
                                        </span>
                                    </template>
                                    <span class="text-caption">
                                        {{ row.cells[col.id].usedConcept }}
                                    </span>
                                </v-tooltip>
                                <span v-else class="text-medium-emphasis">
                                    {{ row.cells[col.id].formattedValue }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </div>
            <div
                v-if="!loading && !error && rows.length > 0"
                class="text-caption text-medium-emphasis pa-2"
            >
                Showing 10-K and 10-Q filings from the last 3 years. Hover over column headers to
                see data sources.
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import type {
        FinancialFactsRow,
        ColumnDefinition,
        XbrlConcept,
    } from '../composables/useFinancialFacts';

    defineProps<{
        loading: boolean;
        error: string | null;
        rows: FinancialFactsRow[];
        columns: ColumnDefinition[];
    }>();

    function getConceptClass(concept: XbrlConcept): string {
        return concept.property ? 'concept-supported' : 'concept-unsupported';
    }
</script>

<style scoped>
    .financial-facts-table-container {
        overflow-x: auto;
    }

    .financial-facts-table {
        font-size: 0.8125rem;
    }

    .financial-facts-table th,
    .financial-facts-table td {
        padding: 6px 12px !important;
        white-space: nowrap;
    }

    .header-with-tooltip {
        cursor: help;
        border-bottom: 1px dotted currentColor;
    }

    .value-with-tooltip {
        cursor: help;
    }

    .tooltip-content {
        white-space: nowrap;
    }

    .tooltip-fallback {
        margin-bottom: 2px;
        white-space: nowrap;
    }

    .concept-supported {
        color: inherit;
    }

    .concept-unsupported {
        color: #ef5350;
    }
</style>
