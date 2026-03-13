<template>
    <v-dialog v-model="isOpen" max-width="900" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" size="small">mdi-speedometer</v-icon>
                CIK Velocity
                <v-spacer />
                <v-btn icon variant="text" size="small" @click="isOpen = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
                <!-- Overall CIK Velocity Score -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-text class="text-center py-4">
                        <div class="text-caption text-medium-emphasis mb-1">CIK VELOCITY SCORE</div>
                        <div class="text-h4 font-weight-bold text-medium-emphasis">--</div>
                        <div class="text-caption text-medium-emphasis mt-1">0-100, capped</div>
                    </v-card-text>
                </v-card>

                <!-- Quarterly Trends Box -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="blue" size="small" class="mr-2"
                            >mdi-chart-timeline-variant</v-icon
                        >
                        <span class="text-subtitle-1 font-weight-bold">Quarterly Trends</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div class="d-flex justify-space-around mb-4">
                            <div class="text-center">
                                <div class="text-caption text-medium-emphasis mb-1">
                                    Direct Filings
                                </div>
                                <div class="sparkline-placeholder">
                                    <v-icon size="48" color="grey-lighten-1">mdi-chart-line</v-icon>
                                </div>
                            </div>
                            <div class="text-center">
                                <div class="text-caption text-medium-emphasis mb-1">
                                    Cross-Entity Events
                                </div>
                                <div class="sparkline-placeholder">
                                    <v-icon size="48" color="grey-lighten-1">mdi-chart-line</v-icon>
                                </div>
                            </div>
                        </div>
                        <v-divider class="mb-3" />
                        <div class="d-flex justify-space-between text-body-2">
                            <span class="text-medium-emphasis">Active Quarters: --</span>
                            <span class="text-medium-emphasis">Total Filings (3yr): --</span>
                            <span class="text-medium-emphasis">Total Cross-Entity (3yr): --</span>
                        </div>
                        <div class="d-flex align-center mt-2">
                            <span class="text-body-2 text-medium-emphasis">Trend:</span>
                            <v-chip size="small" color="grey-lighten-2" class="ml-2">
                                <v-icon start size="small">mdi-circle-outline</v-icon>
                                inactive
                            </v-chip>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Divergence Analysis Box -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="purple" size="small" class="mr-2">mdi-swap-vertical</v-icon>
                        <span class="text-subtitle-1 font-weight-bold">Divergence Analysis</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div class="d-flex justify-space-around">
                            <div class="text-center">
                                <div class="text-caption text-medium-emphasis">
                                    Direct Filings QoQ
                                </div>
                                <div class="text-h6 font-weight-medium">--%</div>
                            </div>
                            <div class="text-center">
                                <div class="text-caption text-medium-emphasis">
                                    Cross-Entity QoQ
                                </div>
                                <div class="text-h6 font-weight-medium">--%</div>
                            </div>
                            <div class="text-center">
                                <div class="text-caption text-medium-emphasis">Divergence</div>
                                <div class="text-h6 font-weight-medium">-- pts</div>
                            </div>
                        </div>
                        <div class="text-center mt-3">
                            <v-chip color="grey-lighten-2" size="small">in-sync</v-chip>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Recent Activity Box -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="teal" size="small" class="mr-2">mdi-clock-outline</v-icon>
                        <span class="text-subtitle-1 font-weight-bold"
                            >Recent Activity (30 days)</span
                        >
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div class="d-flex justify-space-around mb-4">
                            <div class="text-center">
                                <div class="text-h5 font-weight-bold">--</div>
                                <div class="text-caption text-medium-emphasis">Filing Count</div>
                            </div>
                            <div class="text-center">
                                <div class="text-h5 font-weight-bold">--</div>
                                <div class="text-caption text-medium-emphasis">8-K Count</div>
                            </div>
                            <div class="text-center">
                                <div class="text-h5 font-weight-bold">--</div>
                                <div class="text-caption text-medium-emphasis">Amendment Count</div>
                            </div>
                        </div>

                        <div class="text-subtitle-2 mb-2">Filing Activity</div>
                        <v-table density="compact" class="activity-table mb-4">
                            <thead>
                                <tr>
                                    <th class="text-left">Date</th>
                                    <th class="text-left">Form Type</th>
                                    <th class="text-left">Event Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="3" class="text-center text-medium-emphasis">
                                        No filings in the past 30 days
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>

                        <div class="text-subtitle-2 mb-2">Connection Events</div>
                        <v-table density="compact" class="activity-table">
                            <thead>
                                <tr>
                                    <th class="text-left">Date</th>
                                    <th class="text-left">Event Type</th>
                                    <th class="text-left">Counterparty</th>
                                    <th class="text-left">Source Filing</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="4" class="text-center text-medium-emphasis">
                                        No connection events in the past 30 days
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card-text>
                </v-card>

                <!-- Velocity Clusters Box -->
                <v-card variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="red" size="small" class="mr-2">mdi-group</v-icon>
                        <span class="text-subtitle-1 font-weight-bold"
                            >Velocity Clusters (90 days)</span
                        >
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div class="d-flex align-center mb-3">
                            <span class="text-body-2">Clusters Detected:</span>
                            <span class="text-body-2 font-weight-bold ml-2">0</span>
                        </div>
                        <v-table density="compact" class="clusters-table">
                            <thead>
                                <tr>
                                    <th class="text-left">Period</th>
                                    <th class="text-center">Events</th>
                                    <th class="text-center">Window</th>
                                    <th class="text-center">Severity</th>
                                    <th class="text-center">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="5" class="text-center text-medium-emphasis">
                                        No velocity clusters detected
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                        <div class="text-caption text-medium-emphasis mt-3">
                            A cluster requires 3+ events within a 14-day window. Severe clusters
                            have 5+ events.
                        </div>
                    </v-card-text>
                </v-card>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
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
</script>

<style scoped>
    .sparkline-placeholder {
        width: 200px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 4px;
    }

    .activity-table,
    .clusters-table {
        font-size: 0.8125rem;
    }

    .activity-table th,
    .activity-table td,
    .clusters-table th,
    .clusters-table td {
        padding: 6px 12px !important;
        white-space: nowrap;
    }
</style>
