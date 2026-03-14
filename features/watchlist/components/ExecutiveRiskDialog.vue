<template>
    <v-dialog v-model="isOpen" max-width="600" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" size="small">mdi-account-alert</v-icon>
                Executive Risk: {{ companyName }}
                <v-spacer />
                <v-btn icon variant="text" size="small" @click="isOpen = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
                <!-- Signals Table -->
                <v-card variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="orange" size="small" class="mr-2">mdi-alert-circle</v-icon>
                        <span class="text-subtitle-1 font-weight-bold">Signals</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                        <v-table density="compact" class="signals-table">
                            <thead>
                                <tr>
                                    <th class="text-left">Signal</th>
                                    <th class="text-center">Count</th>
                                    <th class="text-center">Risk Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="signal in signals" :key="signal.name">
                                    <td class="text-left">{{ signal.name }}</td>
                                    <td class="text-center">{{ signal.count }}</td>
                                    <td class="text-center">
                                        <v-chip
                                            :color="getRiskLevelColor(signal.riskLevel)"
                                            size="x-small"
                                            variant="flat"
                                        >
                                            {{ signal.riskLevel }}
                                        </v-chip>
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                        <div class="text-caption text-medium-emphasis pa-3">
                            Analysis based on the previous 12 months of leadership changes.
                        </div>
                    </v-card-text>
                </v-card>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    interface Signal {
        name: string;
        count: string;
        riskLevel: string;
    }

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

    const signals = ref<Signal[]>([
        { name: 'Officer Count', count: '--', riskLevel: 'low' },
        { name: 'C-Suite Coverage', count: '--', riskLevel: 'low' },
        { name: 'Officer Departures', count: '--', riskLevel: 'low' },
        { name: 'Director Departures', count: '--', riskLevel: 'low' },
        { name: 'Cumulative Departures', count: '--', riskLevel: 'low' },
        { name: 'Auditor Changes', count: '--', riskLevel: 'low' },
    ]);

    function getRiskLevelColor(level: string): string {
        switch (level) {
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
</script>

<style scoped>
    .signals-table {
        font-size: 0.8125rem;
    }

    .signals-table th,
    .signals-table td {
        padding: 8px 12px !important;
        white-space: nowrap;
    }
</style>
