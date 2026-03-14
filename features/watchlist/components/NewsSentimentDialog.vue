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
                <v-alert v-if="error" type="error" density="compact" class="mb-4" closable>
                    {{ error }}
                </v-alert>

                <!-- Current Sentiment -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-text class="text-center py-4">
                        <div class="text-caption text-medium-emphasis mb-1">CURRENT SENTIMENT</div>
                        <div v-if="loading" class="text-h4 font-weight-bold text-medium-emphasis">
                            <v-progress-circular indeterminate size="24" />
                        </div>
                        <div v-else class="text-h4 font-weight-bold" :class="currentSentimentClass">
                            {{ formattedCurrentSentiment }}
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
                        <div v-if="loading" class="d-flex justify-center pa-8">
                            <v-progress-circular indeterminate size="32" />
                        </div>
                        <div v-else-if="chartData.length === 0" class="text-center pa-8">
                            <v-icon size="48" color="grey-lighten-1" class="mb-2"
                                >mdi-emoticon-neutral-outline</v-icon
                            >
                            <div class="text-body-2 text-medium-emphasis">
                                No sentiment data available for the past 30 days.
                            </div>
                        </div>
                        <div v-else class="chart-container">
                            <svg
                                :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
                                class="sentiment-chart"
                            >
                                <!-- Zero line -->
                                <line
                                    :x1="chartPadding.left"
                                    :y1="zeroLineY"
                                    :x2="chartWidth - chartPadding.right"
                                    :y2="zeroLineY"
                                    class="zero-line"
                                />

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

                                <!-- Positive area fill -->
                                <path :d="positiveAreaPath" class="chart-area-positive" />

                                <!-- Negative area fill -->
                                <path :d="negativeAreaPath" class="chart-area-negative" />

                                <!-- Line -->
                                <path :d="linePath" class="chart-line" />

                                <!-- Data points -->
                                <circle
                                    v-for="(point, i) in chartPoints"
                                    :key="'point-' + i"
                                    :cx="point.x"
                                    :cy="point.y"
                                    r="4"
                                    :class="getPointClass(point.sentiment)"
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

                            <!-- Tooltip with histogram -->
                            <div
                                v-if="hoveredPoint"
                                class="chart-tooltip"
                                :style="{
                                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                                    top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                                }"
                            >
                                <div class="font-weight-bold mb-1">
                                    {{ formatDateFull(hoveredPoint.date) }}
                                </div>
                                <div class="mb-2">
                                    Avg:
                                    <span :class="getSentimentTextClass(hoveredPoint.sentiment)">
                                        {{ hoveredPoint.sentiment.toFixed(2) }}
                                    </span>
                                </div>
                                <div class="histogram">
                                    <div
                                        v-for="bucket in sentimentBuckets"
                                        :key="bucket"
                                        class="histogram-bar-container"
                                    >
                                        <div
                                            class="histogram-bar"
                                            :class="getBucketClass(parseFloat(bucket))"
                                            :style="{
                                                height: `${getHistogramHeight(hoveredPoint, bucket)}px`,
                                            }"
                                        ></div>
                                        <div class="histogram-label">{{ bucket }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <v-divider class="my-4" />

                        <!-- Legend -->
                        <div class="d-flex justify-center ga-4">
                            <div class="d-flex align-center">
                                <div class="legend-dot negative"></div>
                                <span class="text-caption ml-1">Negative (&lt; -0.25)</span>
                            </div>
                            <div class="d-flex align-center">
                                <div class="legend-dot neutral"></div>
                                <span class="text-caption ml-1">Neutral (-0.25 to 0.25)</span>
                            </div>
                            <div class="d-flex align-center">
                                <div class="legend-dot positive"></div>
                                <span class="text-caption ml-1">Positive (&gt; 0.25)</span>
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

    const sentimentBuckets = ['-1', '-0.75', '-0.5', '0', '0.5', '0.75', '1'];

    const chartWidth = 700;
    const chartHeight = 280;
    const chartPadding = { top: 20, right: 20, bottom: 30, left: 50 };

    interface ChartPoint {
        x: number;
        y: number;
        date: string;
        sentiment: number;
        distribution: Record<string, number>;
    }

    const hoveredPoint = ref<ChartPoint | null>(null);

    const formattedCurrentSentiment = computed(() => {
        if (data.value.currentSentiment === null) return '--';
        return data.value.currentSentiment.toFixed(2);
    });

    const currentSentimentClass = computed(() => {
        const val = data.value.currentSentiment;
        if (val === null) return 'text-medium-emphasis';
        if (val < -0.25) return 'text-red-darken-2';
        if (val > 0.25) return 'text-green-darken-2';
        return 'text-grey-darken-1';
    });

    const chartData = computed(() => {
        const now = new Date();
        const result: {
            date: string;
            sentiment: number | null;
            distribution: Record<string, number>;
        }[] = [];

        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            const dayData = data.value.dailyData.find((dd) => dd.date === dateKey);
            result.push({
                date: dateKey,
                sentiment: dayData ? dayData.avgSentiment : null,
                distribution: dayData?.sentimentDistribution || {},
            });
        }

        return result.filter((d) => d.sentiment !== null) as {
            date: string;
            sentiment: number;
            distribution: Record<string, number>;
        }[];
    });

    const zeroLineY = computed(() => {
        const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
        return chartPadding.top + plotHeight / 2;
    });

    const chartPoints = computed<ChartPoint[]>(() => {
        if (chartData.value.length === 0) return [];

        const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
        const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

        return chartData.value.map((d, i) => ({
            x:
                chartPadding.left +
                (chartData.value.length > 1
                    ? (i / (chartData.value.length - 1)) * plotWidth
                    : plotWidth / 2),
            y: chartPadding.top + plotHeight / 2 - (d.sentiment / 1) * (plotHeight / 2),
            date: d.date,
            sentiment: d.sentiment,
            distribution: d.distribution,
        }));
    });

    const linePath = computed(() => {
        if (chartPoints.value.length === 0) return '';
        return chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    });

    const positiveAreaPath = computed(() => {
        if (chartPoints.value.length === 0) return '';
        const points = chartPoints.value;
        const baseline = zeroLineY.value;

        let path = `M ${points[0].x} ${baseline}`;
        for (const p of points) {
            const y = Math.min(p.y, baseline);
            path += ` L ${p.x} ${y}`;
        }
        path += ` L ${points[points.length - 1].x} ${baseline} Z`;
        return path;
    });

    const negativeAreaPath = computed(() => {
        if (chartPoints.value.length === 0) return '';
        const points = chartPoints.value;
        const baseline = zeroLineY.value;

        let path = `M ${points[0].x} ${baseline}`;
        for (const p of points) {
            const y = Math.max(p.y, baseline);
            path += ` L ${p.x} ${y}`;
        }
        path += ` L ${points[points.length - 1].x} ${baseline} Z`;
        return path;
    });

    const yTicks = computed(() => {
        const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
        return [
            { y: chartPadding.top, label: '1.0' },
            { y: chartPadding.top + plotHeight * 0.25, label: '0.5' },
            { y: chartPadding.top + plotHeight * 0.5, label: '0' },
            { y: chartPadding.top + plotHeight * 0.75, label: '-0.5' },
            { y: chartPadding.top + plotHeight, label: '-1.0' },
        ];
    });

    function formatDateShort(dateStr: string): string {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function formatDateFull(dateStr: string): string {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function getPointClass(sentiment: number): string {
        if (sentiment < -0.25) return 'chart-point negative';
        if (sentiment > 0.25) return 'chart-point positive';
        return 'chart-point neutral';
    }

    function getSentimentTextClass(sentiment: number): string {
        if (sentiment < -0.25) return 'text-red';
        if (sentiment > 0.25) return 'text-green';
        return 'text-grey';
    }

    function getBucketClass(value: number): string {
        if (value < -0.25) return 'negative';
        if (value > 0.25) return 'positive';
        return 'neutral';
    }

    function getHistogramHeight(point: ChartPoint, bucket: string): number {
        const count = point.distribution[bucket] || 0;
        const maxCount = Math.max(...Object.values(point.distribution), 1);
        return Math.max(2, (count / maxCount) * 30);
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

    .sentiment-chart {
        width: 100%;
        height: auto;
    }

    .gridline {
        stroke: #e0e0e0;
        stroke-width: 1;
    }

    .zero-line {
        stroke: #9e9e9e;
        stroke-width: 1;
        stroke-dasharray: 4, 4;
    }

    .chart-line {
        fill: none;
        stroke: #7b1fa2;
        stroke-width: 2;
    }

    .chart-area-positive {
        fill: rgba(46, 125, 50, 0.15);
    }

    .chart-area-negative {
        fill: rgba(198, 40, 40, 0.15);
    }

    .chart-point {
        cursor: pointer;
        transition: r 0.15s;
    }

    .chart-point:hover {
        r: 6;
    }

    .chart-point.positive {
        fill: #2e7d32;
    }

    .chart-point.negative {
        fill: #c62828;
    }

    .chart-point.neutral {
        fill: #757575;
    }

    .axis-label {
        font-size: 10px;
        fill: #666;
    }

    .chart-tooltip {
        position: absolute;
        transform: translate(-50%, -100%) translateY(-12px);
        background: rgba(33, 33, 33, 0.95);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        white-space: nowrap;
        z-index: 10;
    }

    .histogram {
        display: flex;
        gap: 2px;
        align-items: flex-end;
        height: 40px;
    }

    .histogram-bar-container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .histogram-bar {
        width: 16px;
        min-height: 2px;
        border-radius: 2px 2px 0 0;
    }

    .histogram-bar.positive {
        background: #4caf50;
    }

    .histogram-bar.negative {
        background: #ef5350;
    }

    .histogram-bar.neutral {
        background: #9e9e9e;
    }

    .histogram-label {
        font-size: 8px;
        color: #aaa;
        margin-top: 2px;
    }

    .text-red {
        color: #ef5350;
    }

    .text-green {
        color: #4caf50;
    }

    .text-grey {
        color: #9e9e9e;
    }

    .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .legend-dot.positive {
        background-color: #2e7d32;
    }

    .legend-dot.negative {
        background-color: #c62828;
    }

    .legend-dot.neutral {
        background-color: #9e9e9e;
    }
</style>
