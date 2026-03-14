<template>
    <v-dialog v-model="isOpen" max-width="900" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" size="small">mdi-scale-balance</v-icon>
                Solvency Score
                <v-spacer />
                <v-btn icon variant="text" size="small" @click="isOpen = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
                <v-alert v-if="error" type="error" density="compact" class="mb-4" closable>
                    {{ error }}
                </v-alert>

                <!-- Overall Solvency Score -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-text class="text-center py-4">
                        <div class="text-caption text-medium-emphasis mb-1">SOLVENCY SCORE</div>
                        <div class="text-h4 font-weight-bold text-medium-emphasis">
                            <!-- TODO: Calculate overall solvency score from components -->
                            --
                        </div>
                        <div class="text-caption text-medium-emphasis mt-1">
                            Score calculation coming soon
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Financials Box -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="blue" size="small" class="mr-2">mdi-calculator</v-icon>
                        <span class="text-subtitle-1 font-weight-bold">Financials</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div v-if="loading" class="d-flex justify-center pa-4">
                            <v-progress-circular indeterminate size="24" />
                        </div>
                        <div v-else-if="financialRatios.length === 0" class="text-medium-emphasis">
                            No financial data available.
                        </div>
                        <div v-else>
                            <div
                                v-for="ratio in financialRatios"
                                :key="ratio.name"
                                class="d-flex justify-space-between align-center py-2"
                            >
                                <v-tooltip location="top">
                                    <template #activator="{ props: tooltipProps }">
                                        <span
                                            v-bind="tooltipProps"
                                            class="text-body-2 text-medium-emphasis ratio-name"
                                        >
                                            {{ ratio.name }}
                                        </span>
                                    </template>
                                    <span>{{ ratio.equation }}</span>
                                </v-tooltip>
                                <span class="text-body-2 font-weight-medium">
                                    {{ ratio.formattedValue }}
                                </span>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Distress Events Box -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="red-darken-2" size="small" class="mr-2"
                            >mdi-alert-octagon</v-icon
                        >
                        <span class="text-subtitle-1 font-weight-bold">Distress Events</span>
                        <v-spacer />
                        <v-chip
                            v-if="!loading && distressEventsSummary.events.length > 0"
                            size="small"
                            color="red-lighten-4"
                            text-color="red-darken-4"
                        >
                            Score: {{ distressEventsSummary.weightedScore }}
                        </v-chip>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                        <div v-if="loading" class="d-flex justify-center pa-4">
                            <v-progress-circular indeterminate size="24" />
                        </div>
                        <div
                            v-else-if="distressEventsSummary.events.length === 0"
                            class="pa-4 text-medium-emphasis"
                        >
                            No distress events in the past 2 years.
                        </div>
                        <div v-else class="events-table-container">
                            <v-table density="compact" class="events-table">
                                <thead>
                                    <tr>
                                        <th class="text-left">Date</th>
                                        <th class="text-left">Item Code</th>
                                        <th class="text-left">Event</th>
                                        <th class="text-center">Severity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="(event, idx) in distressEventsSummary.events"
                                        :key="idx"
                                    >
                                        <td class="text-left">{{ formatEventDate(event.date) }}</td>
                                        <td class="text-left">{{ event.itemCode }}</td>
                                        <td class="text-left">
                                            {{ formatEventType(event.eventType) }}
                                        </td>
                                        <td class="text-center">
                                            <v-chip
                                                :color="getSeverityColor(event.severity)"
                                                size="x-small"
                                                variant="flat"
                                            >
                                                {{ event.severity }}
                                            </v-chip>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Behavior Signals Box -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="orange-darken-2" size="small" class="mr-2"
                            >mdi-clipboard-alert</v-icon
                        >
                        <span class="text-subtitle-1 font-weight-bold">Behavior Signals</span>
                        <v-spacer />
                        <v-chip
                            v-if="!loading && behaviorSignalsSummary.behaviorScore > 0"
                            size="small"
                            color="orange-lighten-4"
                            text-color="orange-darken-4"
                        >
                            Score: {{ behaviorSignalsSummary.behaviorScore }}
                        </v-chip>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                        <div v-if="loading" class="d-flex justify-center pa-4">
                            <v-progress-circular indeterminate size="24" />
                        </div>
                        <div
                            v-else-if="behaviorSignalsSummary.signals.length === 0"
                            class="pa-4 text-medium-emphasis"
                        >
                            No behavior signals available.
                        </div>
                        <div v-else class="signals-table-container">
                            <v-table density="compact" class="signals-table">
                                <thead>
                                    <tr>
                                        <th class="text-left">Behavior Signal</th>
                                        <th class="text-center">Severity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="signal in behaviorSignalsSummary.signals"
                                        :key="signal.name"
                                    >
                                        <td class="text-left">
                                            {{ signal.name }}
                                            <span
                                                v-if="
                                                    signal.name === 'Officer Departures' ||
                                                    signal.name === 'Director Departures'
                                                "
                                                class="text-caption text-medium-emphasis ml-1"
                                            >
                                                (TODO)
                                            </span>
                                        </td>
                                        <td class="text-center">
                                            <v-chip
                                                :color="getSeverityColor(signal.severity)"
                                                size="x-small"
                                                variant="flat"
                                            >
                                                {{ signal.severity }}
                                            </v-chip>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Stake Changes Box -->
                <v-card variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="purple" size="small" class="mr-2"
                            >mdi-swap-horizontal</v-icon
                        >
                        <span class="text-subtitle-1 font-weight-bold">Stake Changes</span>
                        <v-spacer />
                        <span class="text-caption text-medium-emphasis">Score: --</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                        <v-table density="compact" class="stake-changes-table">
                            <thead>
                                <tr>
                                    <th class="text-left">Date</th>
                                    <th class="text-left">Change</th>
                                    <th class="text-center">Severity</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="3" class="text-center text-medium-emphasis pa-4">
                                        No stake changes detected (Uses 13D/13G info)
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card-text>
                </v-card>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { useSolvencyScore } from '../composables/useSolvencyScore';

    const props = defineProps<{
        modelValue: boolean;
        companyNeid: string;
        companyName: string;
    }>();

    const emit = defineEmits<{
        'update:modelValue': [value: boolean];
    }>();

    const isOpen = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value),
    });

    const companyNeid = computed(() => props.companyNeid);

    const {
        loading,
        error,
        financialRatios,
        distressEventsSummary,
        behaviorSignalsSummary,
        reload,
    } = useSolvencyScore(companyNeid);

    function formatEventDate(date: Date): string {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    function formatEventType(eventType: string): string {
        return eventType
            .split('_')
            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    }

    function getSeverityColor(severity: string): string {
        switch (severity) {
            case 'critical':
                return 'red-darken-2';
            case 'high':
                return 'orange-darken-2';
            case 'medium':
                return 'amber-darken-2';
            case 'low':
            default:
                return 'grey';
        }
    }

    watch(isOpen, (open) => {
        if (open && props.companyNeid) {
            reload();
        }
    });
</script>

<style scoped>
    .ratio-name {
        cursor: help;
        border-bottom: 1px dotted currentColor;
    }

    .events-table-container,
    .signals-table-container {
        overflow-x: auto;
        max-height: 250px;
        overflow-y: auto;
    }

    .events-table,
    .signals-table,
    .stake-changes-table {
        font-size: 0.8125rem;
    }

    .events-table th,
    .events-table td,
    .signals-table th,
    .signals-table td,
    .stake-changes-table th,
    .stake-changes-table td {
        padding: 6px 12px !important;
        white-space: nowrap;
    }
</style>
