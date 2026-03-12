<template>
    <v-card class="fill-height" variant="outlined">
        <v-card-title class="d-flex align-center pb-1">
            <v-icon color="amber-darken-2" size="small" class="mr-2">mdi-calendar-alert</v-icon>
            <span class="text-subtitle-1 font-weight-bold">8-K Events</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
            <div v-if="loading" class="d-flex justify-center pa-4">
                <v-progress-circular indeterminate size="24" />
            </div>
            <div v-else-if="error" class="pa-4 text-error">
                {{ error }}
            </div>
            <div v-else-if="events.length === 0" class="pa-4 text-medium-emphasis">
                No 8-K events found for this company.
            </div>
            <div v-else class="events-table-container">
                <v-table density="compact" class="events-table">
                    <thead>
                        <tr>
                            <th class="text-left">Date</th>
                            <th class="text-left">Item</th>
                            <th class="text-left">Event Type</th>
                            <th class="text-center">Severity</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="event in events" :key="event.neid">
                            <td class="text-left">{{ formatEventDate(event.date) }}</td>
                            <td class="text-left">{{ event.item }}</td>
                            <td class="text-left">{{ formatEventType(event.eventType) }}</td>
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
</template>

<script setup lang="ts">
    import { type Form8kEvent, formatEventDate } from '../composables/use8kEvents';

    defineProps<{
        loading: boolean;
        error: string | null;
        events: Form8kEvent[];
    }>();

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
</script>

<style scoped>
    .events-table-container {
        overflow-x: auto;
        max-height: 300px;
        overflow-y: auto;
    }

    .events-table {
        font-size: 0.8125rem;
    }

    .events-table th,
    .events-table td {
        padding: 6px 12px !important;
        white-space: nowrap;
    }
</style>
