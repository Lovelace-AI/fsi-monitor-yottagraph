import { useWatchlistApi } from './useWatchlistApi';

export interface MentionDetail {
    artid: string;
    publicationDate: Date;
    sentiment: number;
    publicationName: string;
}

export interface DailyMentionData {
    date: string;
    count: number;
    avgSentiment: number;
    sentimentDistribution: Record<string, number>;
}

export interface NewsMentionsResult {
    totalCount: number;
    dailyData: DailyMentionData[];
    mentions: MentionDetail[];
    currentSentiment: number | null;
}

const cache = new Map<string, { data: NewsMentionsResult; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function useNewsMentionsData(companyNeid: Ref<string>) {
    const api = useWatchlistApi();

    const loading = ref(false);
    const error = ref<string | null>(null);
    const data = ref<NewsMentionsResult>({
        totalCount: 0,
        dailyData: [],
        mentions: [],
        currentSentiment: null,
    });

    async function loadData(forceRefresh = false) {
        const neid = companyNeid.value;
        if (!neid) return;

        const cached = cache.get(neid);
        if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            data.value = cached.data;
            return;
        }

        loading.value = true;
        error.value = null;

        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const intervalStart = thirtyDaysAgo.toISOString();
            const intervalEnd = now.toISOString();

            const response = await api.getMentionsLookupDetail(neid, intervalStart, intervalEnd);
            const details = response.details || [];

            const mentions: MentionDetail[] = details.map((d) => ({
                artid: d.artid,
                publicationDate: new Date(d.publication_date),
                sentiment: d.sentiment,
                publicationName: d.original_publication_name,
            }));

            const dailyMap = new Map<
                string,
                { count: number; sentiments: number[]; distribution: Record<string, number> }
            >();

            for (const mention of mentions) {
                const dateKey = mention.publicationDate.toISOString().split('T')[0];

                if (!dailyMap.has(dateKey)) {
                    dailyMap.set(dateKey, {
                        count: 0,
                        sentiments: [],
                        distribution: {
                            '-1': 0,
                            '-0.75': 0,
                            '-0.5': 0,
                            '0': 0,
                            '0.5': 0,
                            '0.75': 0,
                            '1': 0,
                        },
                    });
                }

                const day = dailyMap.get(dateKey)!;
                day.count++;
                day.sentiments.push(mention.sentiment);

                const bucket = getSentimentBucket(mention.sentiment);
                day.distribution[bucket]++;
            }

            const dailyData: DailyMentionData[] = [];
            for (const [date, day] of dailyMap.entries()) {
                const avgSentiment =
                    day.sentiments.length > 0
                        ? day.sentiments.reduce((a, b) => a + b, 0) / day.sentiments.length
                        : 0;
                dailyData.push({
                    date,
                    count: day.count,
                    avgSentiment,
                    sentimentDistribution: day.distribution,
                });
            }

            dailyData.sort((a, b) => a.date.localeCompare(b.date));

            let currentSentiment: number | null = null;
            if (dailyData.length > 0) {
                currentSentiment = dailyData[dailyData.length - 1].avgSentiment;
            }

            const result: NewsMentionsResult = {
                totalCount: mentions.length,
                dailyData,
                mentions,
                currentSentiment,
            };

            data.value = result;
            cache.set(neid, { data: result, timestamp: Date.now() });
        } catch (e: any) {
            error.value = e.message || 'Failed to load news data';
        } finally {
            loading.value = false;
        }
    }

    function getSentimentBucket(sentiment: number): string {
        if (sentiment <= -0.875) return '-1';
        if (sentiment <= -0.625) return '-0.75';
        if (sentiment <= -0.25) return '-0.5';
        if (sentiment <= 0.25) return '0';
        if (sentiment <= 0.625) return '0.5';
        if (sentiment <= 0.875) return '0.75';
        return '1';
    }

    return {
        loading,
        error,
        data,
        loadData,
    };
}
