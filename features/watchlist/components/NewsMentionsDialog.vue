<template>
    <v-dialog v-model="isOpen" max-width="800" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" size="small">mdi-newspaper</v-icon>
                News Mentions: {{ companyName }}
                <v-chip size="small" color="primary" class="ml-2">{{ totalMentions }}</v-chip>
                <v-spacer />
                <v-btn icon variant="text" size="small" @click="isOpen = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
                <!-- Chart Section -->
                <v-card variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="blue" size="small" class="mr-2">mdi-chart-line</v-icon>
                        <span class="text-subtitle-1 font-weight-bold">Daily Mention Counts</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div class="chart-placeholder">
                            <v-icon size="64" color="grey-lighten-1">mdi-chart-areaspline</v-icon>
                            <div class="text-body-2 text-medium-emphasis mt-2">
                                Line chart showing daily mention counts
                            </div>
                            <div class="text-caption text-medium-emphasis">
                                X-axis: Calendar dates (past 30 days) | Y-axis: Number of mentions
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="text-caption text-medium-emphasis mt-3">
                    Data source: /mentions/lookup/detail with 30-day time window
                </div>
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

    const totalMentions = ref('--');
</script>

<style scoped>
    .chart-placeholder {
        height: 250px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;
    }
</style>
