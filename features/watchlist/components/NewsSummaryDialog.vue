<template>
    <v-dialog v-model="isOpen" max-width="800" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" size="small">mdi-text-box</v-icon>
                News Summary: {{ companyName }}
                <v-spacer />
                <v-btn icon variant="text" size="small" @click="isOpen = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
                <!-- Summary Header -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-text class="text-center py-4">
                        <v-icon size="32" color="grey-lighten-1" class="mb-2">mdi-robot</v-icon>
                        <div class="text-body-1 font-italic text-medium-emphasis">
                            Summary: work in progress
                        </div>
                        <div class="text-caption text-medium-emphasis mt-1">
                            (Future: AI-generated summary of recent news themes)
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Article List -->
                <v-card variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="teal" size="small" class="mr-2"
                            >mdi-newspaper-variant-multiple</v-icon
                        >
                        <span class="text-subtitle-1 font-weight-bold"
                            >Recent Articles (24 hours)</span
                        >
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div v-if="articles.length === 0" class="text-center py-6">
                            <v-icon size="48" color="grey-lighten-1" class="mb-2"
                                >mdi-newspaper-variant-outline</v-icon
                            >
                            <div class="text-body-2 text-medium-emphasis">
                                No news found for the past day.
                            </div>
                        </div>
                        <div v-else>
                            <v-card
                                v-for="article in articles"
                                :key="article.id"
                                variant="tonal"
                                class="mb-3"
                            >
                                <v-card-text class="py-3">
                                    <div class="d-flex justify-space-between align-start">
                                        <div class="flex-grow-1">
                                            <div class="text-subtitle-2 font-weight-bold mb-1">
                                                {{ article.title }}
                                            </div>
                                            <div class="text-caption text-medium-emphasis mb-2">
                                                {{ article.publication }}
                                            </div>
                                            <div class="text-body-2">
                                                {{ article.summary }}
                                            </div>
                                        </div>
                                        <div class="ml-3 text-right">
                                            <v-chip
                                                :color="getSentimentColor(article.sentiment)"
                                                size="x-small"
                                                variant="flat"
                                            >
                                                {{ article.sentiment.toFixed(2) }}
                                            </v-chip>
                                            <div v-if="article.url" class="mt-2">
                                                <v-btn
                                                    icon
                                                    size="x-small"
                                                    variant="text"
                                                    :href="article.url"
                                                    target="_blank"
                                                >
                                                    <v-icon size="small">mdi-open-in-new</v-icon>
                                                </v-btn>
                                            </div>
                                        </div>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="text-caption text-medium-emphasis mt-3">
                    Displays up to 20 articles from the past 24 hours. Article details fetched via
                    /elemental/entities/properties.
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    interface Article {
        id: string;
        title: string;
        publication: string;
        summary: string;
        sentiment: number;
        url?: string;
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

    const articles = ref<Article[]>([]);

    function getSentimentColor(sentiment: number): string {
        if (sentiment < -0.25) return 'red-darken-2';
        if (sentiment > 0.25) return 'green-darken-2';
        return 'grey';
    }
</script>
