<template>
    <v-card variant="outlined">
        <v-card-title class="d-flex align-center pb-1">
            <v-icon color="green-darken-1" size="small" class="mr-2"
                >mdi-file-document-outline</v-icon
            >
            <span class="text-subtitle-1 font-weight-bold">Filings</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
            <div v-if="loading" class="d-flex justify-center pa-4">
                <v-progress-circular indeterminate size="24" />
            </div>
            <div v-else-if="error" class="pa-4 text-error">
                {{ error }}
            </div>
            <div v-else-if="filings.length === 0" class="pa-4 text-medium-emphasis">
                No filings available.
            </div>
            <div v-else class="filings-table-container">
                <v-table density="compact" class="filings-table">
                    <thead>
                        <tr>
                            <th class="text-left">Filing Date</th>
                            <th class="text-left">Form Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="filing in filings" :key="filing.neid">
                            <td class="text-left">{{ formatDate(filing.filingDate) }}</td>
                            <td class="text-left">{{ filing.formType }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    export interface FilingItem {
        neid: string;
        filingDate: Date;
        formType: string;
    }

    defineProps<{
        loading: boolean;
        error: string | null;
        filings: FilingItem[];
    }>();

    function formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }
</script>

<style scoped>
    .filings-table-container {
        overflow-x: auto;
        max-height: 300px;
        overflow-y: auto;
    }

    .filings-table {
        font-size: 0.8125rem;
    }

    .filings-table th,
    .filings-table td {
        padding: 6px 12px !important;
        white-space: nowrap;
    }
</style>
