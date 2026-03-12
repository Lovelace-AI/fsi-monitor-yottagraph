<template>
    <v-dialog
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        max-width="500"
    >
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-magnify</v-icon>
                Add Company
            </v-card-title>
            <v-card-text>
                <v-text-field
                    v-model="searchTerm"
                    label="Search company name"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    hide-details
                    autofocus
                    clearable
                    @update:model-value="onSearchInput"
                />

                <v-progress-linear v-if="searching" indeterminate class="mt-2" />

                <v-list v-if="results.length" class="mt-2" density="compact" max-height="300">
                    <v-list-item
                        v-for="result in results"
                        :key="result.neid"
                        @click="selectResult(result)"
                        class="cursor-pointer"
                    >
                        <v-list-item-title>{{ result.name }}</v-list-item-title>
                        <v-list-item-subtitle v-if="result.flavor">
                            {{ result.flavor }}
                        </v-list-item-subtitle>
                        <template v-slot:append>
                            <v-chip
                                v-if="result.score"
                                size="x-small"
                                color="primary"
                                variant="tonal"
                            >
                                {{ Math.round((result.score || 0) * 100) }}%
                            </v-chip>
                        </template>
                    </v-list-item>
                </v-list>

                <div
                    v-else-if="searchTerm && !searching && hasSearched"
                    class="text-center pa-4 text-medium-emphasis"
                >
                    No results found
                </div>

                <v-alert v-if="errorMsg" type="error" density="compact" class="mt-2">
                    {{ errorMsg }}
                </v-alert>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn @click="close">Cancel</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { useWatchlistApi, type SearchMatch } from '../composables/useWatchlistApi';

    const props = defineProps<{
        modelValue: boolean;
    }>();

    const emit = defineEmits<{
        'update:modelValue': [value: boolean];
        select: [match: SearchMatch];
    }>();

    const { searchCompanies } = useWatchlistApi();

    const searchTerm = ref('');
    const searching = ref(false);
    const hasSearched = ref(false);
    const results = ref<SearchMatch[]>([]);
    const errorMsg = ref<string | null>(null);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function onSearchInput() {
        if (debounceTimer) clearTimeout(debounceTimer);
        errorMsg.value = null;

        if (!searchTerm.value || searchTerm.value.length < 2) {
            results.value = [];
            hasSearched.value = false;
            return;
        }

        debounceTimer = setTimeout(() => doSearch(), 400);
    }

    async function doSearch() {
        if (!searchTerm.value) return;
        searching.value = true;
        hasSearched.value = false;

        try {
            results.value = await searchCompanies(searchTerm.value);
        } catch (e: any) {
            errorMsg.value = e.message || 'Search failed';
            results.value = [];
        } finally {
            searching.value = false;
            hasSearched.value = true;
        }
    }

    function selectResult(match: SearchMatch) {
        emit('select', match);
        close();
    }

    function close() {
        searchTerm.value = '';
        results.value = [];
        hasSearched.value = false;
        errorMsg.value = null;
        emit('update:modelValue', false);
    }
</script>
