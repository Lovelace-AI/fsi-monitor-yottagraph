import { useWatchlistApi } from './useWatchlistApi';

export interface NewsArticle {
    artid: string;
    title: string;
    publicationDate: Date;
    publicationName: string;
    summary?: string;
    sentiment?: number;
    url?: string;
}

const MAX_ARTICLES = 5;
const MAX_DAYS_LOOKBACK = 30;

export function useCompanyNews(neid: Ref<string>) {
    const api = useWatchlistApi();

    const articles = ref<NewsArticle[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const daysSearched = ref(0);

    async function loadNews() {
        loading.value = true;
        error.value = null;
        articles.value = [];
        daysSearched.value = 0;

        const collectedArtids = new Set<string>();
        const collectedArticles: NewsArticle[] = [];

        try {
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            for (let dayOffset = 0; dayOffset < MAX_DAYS_LOOKBACK; dayOffset++) {
                if (collectedArticles.length >= MAX_ARTICLES) break;

                const endDate = new Date(today);
                endDate.setDate(endDate.getDate() - dayOffset);

                const startDate = new Date(endDate);
                startDate.setHours(0, 0, 0, 0);

                const intervalStart = startDate.toISOString();
                const intervalEnd = endDate.toISOString();

                const mentionsResponse = await api.getMentionsLookupDetail(
                    neid.value,
                    intervalStart,
                    intervalEnd
                );
                daysSearched.value = dayOffset + 1;

                for (const mention of mentionsResponse.details || []) {
                    if (collectedArticles.length >= MAX_ARTICLES) break;
                    if (collectedArtids.has(mention.artid)) continue;

                    collectedArtids.add(mention.artid);

                    try {
                        const articleDetail = await api.getArticleDetail(mention.artid);
                        collectedArticles.push({
                            artid: mention.artid,
                            title: articleDetail.title,
                            publicationDate: new Date(mention.publication_date),
                            publicationName: mention.original_publication_name,
                            summary: articleDetail.summary,
                            sentiment: mention.sentiment,
                            url: articleDetail.url,
                        });
                    } catch (e) {
                        console.warn(`Failed to fetch article ${mention.artid}:`, e);
                    }
                }
            }

            articles.value = collectedArticles;
        } catch (e: any) {
            error.value = e.message || 'Failed to load news';
        } finally {
            loading.value = false;
        }
    }

    return {
        articles,
        loading,
        error,
        daysSearched,
        loadNews,
    };
}
