<template>
    <v-dialog v-model="isOpen" max-width="800" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" size="small">mdi-newspaper</v-icon>
                News Mentions: {{ companyName }}
                <v-chip size="small" color="primary" class="ml-2">{{ data.totalCount }}</v-chip>
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

                <!-- Chart Section -->
                <v-card variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="blue" size="small" class="mr-2">mdi-chart-line</v-icon>
                        <span class="text-subtitle-1 font-weight-bold">Daily Mention Counts</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div v-if="loading" class="d-flex justify-center pa-8">
                            <v-progress-circular indeterminate size="32" />
                        </div>
                        <div v-else-if="chartData.length === 0" class="text-center pa-8">
                            <v-icon size="48" color="grey-lighten-1" class="mb-2"
                                >mdi-newspaper-variant-outline</v-icon
                            >
                            <div class="text-body-2 text-medium-emphasis">
                                No mentions found in the past 30 days.
                            </div>
                        </div>
                        <div v-else class="chart-container">
                            <svg
                                :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
                                class="mentions-chart"
                            >
                                <!-- Y-axis gridlines -->
                                <line
                                    v-for="(tick, i) in yTicks"
                                    :key="'grid-' + i"
                                    :x1="chartPadding.left"
                                    :y1="tick.y"
                                    :x2="chartWidth - chartPadding.right"
                                    :y2="tick.y"
                                    class="gridline"
                                />

                                <!-- Area fill -->
                                <path :d="areaPath" class="chart-area" />

                                <!-- Line -->
                                <path :d="linePath" class="chart-line" />

                                <!-- Data points -->
                                <circle
                                    v-for="(point, i) in chartPoints"
                                    :key="'point-' + i"
                                    :cx="point.x"
                                    :cy="point.y"
                                    r="4"
                                    class="chart-point"
                                    @mouseenter="hoveredPoint = point"
                                    @mouseleave="hoveredPoint = null"
                                />

                                <!-- Y-axis labels -->
                                <text
                                    v-for="(tick, i) in yTicks"
                                    :key="'ylabel-' + i"
                                    :x="chartPadding.left - 8"
                                    :y="tick.y + 4"
                                    class="axis-label"
                                    text-anchor="end"
                                >
                                    {{ tick.label }}
                                </text>

                                <!-- X-axis labels (show every 5th day) -->
                                <text
                                    v-for="(point, i) in chartPoints.filter(
                                        (_, idx) => idx % 5 === 0
                                    )"
                                    :key="'xlabel-' + i"
                                    :x="point.x"
                                    :y="chartHeight - 5"
                                    class="axis-label"
                                    text-anchor="middle"
                                >
                                    {{ formatDateShort(point.date) }}
                                </text>
                            </svg>

                            <!-- Tooltip -->
                            <div
                                v-if="hoveredPoint"
                                class="chart-tooltip"
                                :style="{
                                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                                    top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                                }"
                            >
                                <div class="font-weight-bold">
                                    {{ formatDateFull(hoveredPoint.date) }}
                                </div>
                                <div>
                                    {{ hoveredPoint.count }} mention{{
                                        hoveredPoint.count !== 1 ? 's' : ''
                                    }}
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { useNewsMentionsData } from '../composables/useNewsMentionsData';

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
    const { loading, error, data, loadData } = useNewsMentionsData(companyNeid);

    const chartWidth = 700;
    const chartHeight = 250;
    const chartPadding = { top: 20, right: 20, bottom: 30, left: 40 };

    interface ChartPoint {
        x: number;
        y: number;
        date: string;
        count: number;
    }

    const hoveredPoint = ref<ChartPoint | null>(null);

    const chartData = computed(() => {
        const now = new Date();
        const result: { date: string; count: number }[] = [];

        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            const dayData = data.value.dailyData.find((dd) => dd.date === dateKey);
            result.push({
                date: dateKey,
                count: dayData?.count || 0,
            });
        }

        return result;
    });

    const maxCount = computed(() => {
        const max = Math.max(...chartData.value.map((d) => d.count), 1);
        return Math.ceil(max / 5) * 5 || 5;
    });

    const chartPoints = computed<ChartPoint[]>(() => {
        const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
        const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

        return chartData.value.map((d, i) => ({
            x: chartPadding.left + (i / (chartData.value.length - 1)) * plotWidth,
            y: chartPadding.top + plotHeight - (d.count / maxCount.value) * plotHeight,
            date: d.date,
            count: d.count,
        }));
    });

    const linePath = computed(() => {
        if (chartPoints.value.length === 0) return '';
        return chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    });

    const areaPath = computed(() => {
        if (chartPoints.value.length === 0) return '';
        const baseline = chartHeight - chartPadding.bottom;
        const points = chartPoints.value;
        const start = `M ${points[0].x} ${baseline}`;
        const line = points.map((p) => `L ${p.x} ${p.y}`).join(' ');
        const end = `L ${points[points.length - 1].x} ${baseline} Z`;
        return `${start} ${line} ${end}`;
    });

    const yTicks = computed(() => {
        const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
        const ticks = [];
        const numTicks = 5;

        for (let i = 0; i <= numTicks; i++) {
            const value = Math.round((maxCount.value / numTicks) * i);
            const y = chartPadding.top + plotHeight - (i / numTicks) * plotHeight;
            ticks.push({ y, label: value.toString() });
        }

        return ticks;
    });

    function formatDateShort(dateStr: string): string {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function formatDateFull(dateStr: string): string {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    watch(isOpen, (open) => {
        if (open && props.companyNeid) {
            loadData();
        }
    });
</script>

<style scoped>
    .chart-container {
        position: relative;
        width: 100%;
    }

    .mentions-chart {
        width: 100%;
        height: auto;
    }

    .gridline {
        stroke: #e0e0e0;
        stroke-width: 1;
    }

    .chart-line {
        fill: none;
        stroke: #1976d2;
        stroke-width: 2;
    }

    .chart-area {
        fill: rgba(25, 118, 210, 0.1);
    }

    .chart-point {
        fill: #1976d2;
        cursor: pointer;
        transition: r 0.15s;
    }

    .chart-point:hover {
        r: 6;
    }

    .axis-label {
        font-size: 10px;
        fill: #666;
    }

    .chart-tooltip {
        position: absolute;
        transform: translate(-50%, -100%) translateY(-12px);
        background: rgba(33, 33, 33, 0.9);
        color: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        white-space: nowrap;
        z-index: 10;
    }
</style>
