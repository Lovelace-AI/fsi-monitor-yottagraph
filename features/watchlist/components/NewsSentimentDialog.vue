<template>
    <v-dialog v-model="isOpen" max-width="800" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" size="small">mdi-emoticon-outline</v-icon>
                News Sentiment: {{ companyName }}
                <v-spacer />
                <v-btn icon variant="text" size="small" @click="isOpen = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
                <!-- Current Sentiment -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-text class="text-center py-4">
                        <div class="text-caption text-medium-emphasis mb-1">CURRENT SENTIMENT</div>
                        <div class="text-h4 font-weight-bold" :class="currentSentimentClass">
                            {{ currentSentiment }}
                        </div>
                        <div class="text-caption text-medium-emphasis mt-1">
                            Daily average for most recent day with data
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Sentiment Chart -->
                <v-card variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="purple" size="small" class="mr-2">mdi-chart-line</v-icon>
                        <span class="text-subtitle-1 font-weight-bold">Sentiment Over Time</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div class="chart-placeholder">
                            <v-icon size="64" color="grey-lighten-1"
                                >mdi-chart-bell-curve-cumulative</v-icon
                            >
                            <div class="text-body-2 text-medium-emphasis mt-2">
                                Line chart showing daily sentiment over time
                            </div>
                            <div class="text-caption text-medium-emphasis">
                                X-axis: Calendar dates (past 30 days) | Y-axis: Sentiment score (-1
                                to 1)
                            </div>
                            <div class="text-caption text-medium-emphasis mt-2">
                                Hover: Shows histogram of sentiment distribution for that day
                            </div>
                        </div>

                        <v-divider class="my-4" />

                        <!-- Legend -->
                        <div class="d-flex justify-center ga-4">
                            <div class="d-flex align-center">
                                <div class="legend-dot red-darken-2"></div>
                                <span class="text-caption ml-1">Negative (&lt; -0.25)</span>
                            </div>
                            <div class="d-flex align-center">
                                <div class="legend-dot grey"></div>
                                <span class="text-caption ml-1">Neutral (-0.25 to 0.25)</span>
                            </div>
                            <div class="d-flex align-center">
                                <div class="legend-dot green-darken-2"></div>
                                <span class="text-caption ml-1">Positive (&gt; 0.25)</span>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="text-caption text-medium-emphasis mt-3">
                    Sentiment buckets: -1, -0.75, -0.5, 0, 0.5, 0.75, 1
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

    const currentSentiment = ref('--');

    const currentSentimentClass = computed(() => {
        const val = parseFloat(currentSentiment.value);
        if (isNaN(val)) return 'text-medium-emphasis';
        if (val < -0.25) return 'text-red-darken-2';
        if (val > 0.25) return 'text-green-darken-2';
        return 'text-grey';
    });
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

    .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .legend-dot.red-darken-2 {
        background-color: #c62828;
    }

    .legend-dot.grey {
        background-color: #9e9e9e;
    }

    .legend-dot.green-darken-2 {
        background-color: #2e7d32;
    }
</style>
