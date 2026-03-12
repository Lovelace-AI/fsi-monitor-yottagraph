<template>
    <v-container fluid class="pa-0 fill-height">
        <v-row class="fill-height ma-0">
            <v-col cols="12" class="pa-4 d-flex flex-column" style="height: 100%; overflow: hidden">
                <div class="flex-grow-1 overflow-y-auto">
                    <!-- Agents Section -->
                    <v-card class="mb-4">
                        <v-card-title class="text-subtitle-1">
                            <v-icon class="mr-2" size="small">mdi-robot</v-icon>
                            Agents
                        </v-card-title>
                        <v-card-text>
                            <div class="d-flex ga-3">
                                <v-btn
                                    variant="outlined"
                                    prepend-icon="mdi-chat"
                                    @click="
                                        openComingSoon(
                                            'Dialogue',
                                            'mdi-chat',
                                            'An interactive agent that lets users query the data with natural language.'
                                        )
                                    "
                                >
                                    Dialogue
                                </v-btn>
                                <v-btn
                                    variant="outlined"
                                    prepend-icon="mdi-bell-alert"
                                    @click="
                                        openComingSoon(
                                            'Alerting',
                                            'mdi-bell-alert',
                                            'An agent that highlights recent alerts from the watchlist.'
                                        )
                                    "
                                >
                                    Alerting
                                </v-btn>
                                <v-btn
                                    variant="outlined"
                                    prepend-icon="mdi-file-document"
                                    @click="showBriefingDialog = true"
                                >
                                    Briefing
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>

                    <!-- Watchlist Section -->
                    <v-card>
                        <v-card-title class="text-subtitle-1 d-flex align-center">
                            <v-icon class="mr-2" size="small">mdi-eye</v-icon>
                            Watchlist
                            <v-spacer />
                            <v-btn icon size="small" variant="text" @click="showSearch = true">
                                <v-icon>mdi-plus</v-icon>
                            </v-btn>
                        </v-card-title>
                        <div class="watchlist-table-container">
                            <v-table density="comfortable" hover class="watchlist-table">
                                <thead>
                                    <tr>
                                        <th class="text-left group-end">Company</th>
                                        <th class="text-center">Edgar Filings</th>
                                        <th class="text-center">Solvency</th>
                                        <th class="text-center">Executive Risk</th>
                                        <th class="text-center group-end">CIK Velocity</th>
                                        <th class="text-center">News Mentions</th>
                                        <th class="text-center">Summary (24H)</th>
                                        <th class="text-center">Sentiment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="watchlist.length === 0">
                                        <td colspan="8" class="text-center pa-8">
                                            <v-icon size="64" color="grey-lighten-1" class="mb-3">
                                                mdi-eye-off
                                            </v-icon>
                                            <div class="text-h6 text-medium-emphasis mb-2">
                                                No companies in watchlist
                                            </div>
                                            <div class="text-body-2 text-medium-emphasis mb-4">
                                                Add a company to start tracking SEC filing data
                                            </div>
                                            <v-btn
                                                color="primary"
                                                @click="showSearch = true"
                                                prepend-icon="mdi-plus"
                                            >
                                                Add Company
                                            </v-btn>
                                        </td>
                                    </tr>
                                    <tr v-for="company in watchlist" :key="company.neid">
                                        <!-- Company column -->
                                        <td class="text-left group-end">
                                            <div class="d-flex align-center">
                                                <span class="company-name">{{ company.name }}</span>
                                                <v-btn
                                                    icon
                                                    size="x-small"
                                                    variant="text"
                                                    class="ml-2"
                                                    :loading="getCompanyLoading(company.neid)"
                                                    @click.stop="refreshCompany(company)"
                                                >
                                                    <v-icon size="small">mdi-refresh</v-icon>
                                                </v-btn>
                                                <v-btn
                                                    icon
                                                    size="x-small"
                                                    variant="text"
                                                    @click.stop="removeCompany(company.neid)"
                                                >
                                                    <v-icon size="small">mdi-close</v-icon>
                                                </v-btn>
                                            </div>
                                        </td>

                                        <!-- Edgar Filings -->
                                        <td
                                            class="text-center clickable-cell"
                                            @click="openEdgarProfile(company)"
                                        >
                                            <template v-if="getCompanyLoading(company.neid)">
                                                <v-progress-circular
                                                    indeterminate
                                                    size="16"
                                                    width="2"
                                                />
                                            </template>
                                            <template v-else>
                                                {{ getEdgarFilingsCount(company.neid) }}
                                            </template>
                                        </td>

                                        <!-- Solvency -->
                                        <td
                                            class="text-center clickable-cell"
                                            @click="openSolvencyScore(company)"
                                        >
                                            --
                                        </td>

                                        <!-- Executive Risk -->
                                        <td
                                            class="text-center clickable-cell"
                                            @click="
                                                openComingSoon(
                                                    'Executive Risk',
                                                    'mdi-account-alert'
                                                )
                                            "
                                        >
                                            --
                                        </td>

                                        <!-- CIK Velocity -->
                                        <td
                                            class="text-center clickable-cell group-end"
                                            @click="
                                                openComingSoon('CIK Velocity', 'mdi-speedometer')
                                            "
                                        >
                                            --
                                        </td>

                                        <!-- News Mentions -->
                                        <td
                                            class="text-center clickable-cell"
                                            @click="
                                                openComingSoon(
                                                    'News Company Profile',
                                                    'mdi-newspaper'
                                                )
                                            "
                                        >
                                            <template v-if="getCompanyLoading(company.neid)">
                                                <v-progress-circular
                                                    indeterminate
                                                    size="16"
                                                    width="2"
                                                />
                                            </template>
                                            <template v-else>
                                                {{ getNewsMentionsCount(company.neid) }}
                                            </template>
                                        </td>

                                        <!-- Summary (24H) -->
                                        <td
                                            class="text-center clickable-cell"
                                            @click="openComingSoon('News Summary', 'mdi-text-box')"
                                        >
                                            No summary
                                        </td>

                                        <!-- Sentiment -->
                                        <td
                                            class="text-center clickable-cell"
                                            @click="
                                                openComingSoon(
                                                    'News Sentiment',
                                                    'mdi-emoticon-outline'
                                                )
                                            "
                                        >
                                            --
                                        </td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </div>
                    </v-card>
                </div>

                <!-- Search Dialog -->
                <CompanySearch v-model="showSearch" @select="addCompany" />

                <!-- Edgar Company Profile Dialog -->
                <EdgarCompanyProfileDialog
                    v-model="showEdgarProfile"
                    :company-neid="selectedCompanyNeid"
                    :company-name="selectedCompanyName"
                />

                <!-- Solvency Score Dialog -->
                <SolvencyScoreDialog
                    v-model="showSolvencyScore"
                    :company-neid="selectedCompanyNeid"
                    :company-name="selectedCompanyName"
                />

                <!-- Coming Soon Dialog -->
                <ComingSoonDialog
                    v-model="showComingSoonDialog"
                    :title="comingSoonTitle"
                    :icon="comingSoonIcon"
                    :description="comingSoonDescription"
                />

                <!-- Briefing Agent Dialog -->
                <BriefingAgentDialog v-model="showBriefingDialog" :watchlist-data="dataCache" />
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
    import CompanySearch from '../components/CompanySearch.vue';
    import EdgarCompanyProfileDialog from '../components/EdgarCompanyProfileDialog.vue';
    import ComingSoonDialog from '../components/ComingSoonDialog.vue';
    import SolvencyScoreDialog from '../components/SolvencyScoreDialog.vue';
    import BriefingAgentDialog from '../components/BriefingAgentDialog.vue';
    import type { SearchMatch } from '../composables/useWatchlistApi';
    import { useCompanyWatchlistData } from '../composables/useCompanyWatchlistData';

    interface WatchlistEntry {
        neid: string;
        name: string;
    }

    const WATCHLIST_STORAGE_KEY = 'fsi-monitor-watchlist';

    const showSearch = ref(false);
    const showEdgarProfile = ref(false);
    const showSolvencyScore = ref(false);
    const showBriefingDialog = ref(false);
    const showComingSoonDialog = ref(false);
    const comingSoonTitle = ref('');
    const comingSoonIcon = ref('');
    const comingSoonDescription = ref('');
    const selectedCompanyNeid = ref('');
    const selectedCompanyName = ref('');

    const watchlist = ref<WatchlistEntry[]>(loadWatchlist());

    const { getCompanyData, refreshCompanyData, removeCompanyData, initializeCompany, dataCache } =
        useCompanyWatchlistData();

    function loadWatchlist(): WatchlistEntry[] {
        if (import.meta.server) return [];
        try {
            const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.map((entry: any) => ({
                    neid: entry.neid,
                    name: entry.name,
                }));
            }
            return [];
        } catch {
            return [];
        }
    }

    function saveWatchlist() {
        if (import.meta.server) return;
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist.value));
    }

    function getCompanyLoading(neid: string): boolean {
        return dataCache.get(neid)?.loading ?? false;
    }

    function getEdgarFilingsCount(neid: string): string {
        const data = dataCache.get(neid);
        if (data?.edgarFilingsCount !== null && data?.edgarFilingsCount !== undefined) {
            return String(data.edgarFilingsCount);
        }
        return '--';
    }

    function getNewsMentionsCount(neid: string): string {
        const data = dataCache.get(neid);
        if (data?.newsMentionsCount !== null && data?.newsMentionsCount !== undefined) {
            return String(data.newsMentionsCount);
        }
        return '--';
    }

    async function addCompany(match: SearchMatch) {
        if (watchlist.value.some((c) => c.neid === match.neid)) return;

        const entry: WatchlistEntry = {
            neid: match.neid,
            name: match.name,
        };

        watchlist.value.push(entry);
        saveWatchlist();

        initializeCompany(match.neid, match.name);
        await refreshCompanyData(match.neid, match.name);
    }

    function removeCompany(neid: string) {
        watchlist.value = watchlist.value.filter((c) => c.neid !== neid);
        saveWatchlist();
        removeCompanyData(neid);
    }

    async function refreshCompany(company: WatchlistEntry) {
        await refreshCompanyData(company.neid, company.name);
    }

    function openEdgarProfile(company: WatchlistEntry) {
        selectedCompanyNeid.value = company.neid;
        selectedCompanyName.value = company.name;
        showEdgarProfile.value = true;
    }

    function openSolvencyScore(company: WatchlistEntry) {
        selectedCompanyNeid.value = company.neid;
        selectedCompanyName.value = company.name;
        showSolvencyScore.value = true;
    }

    function openComingSoon(title: string, icon: string, description?: string) {
        comingSoonTitle.value = title;
        comingSoonIcon.value = icon;
        comingSoonDescription.value = description || '';
        showComingSoonDialog.value = true;
    }

    onMounted(() => {
        for (const company of watchlist.value) {
            initializeCompany(company.neid, company.name);
            if (!getCompanyData(company.neid)?.lastRefreshed) {
                refreshCompanyData(company.neid, company.name);
            }
        }
    });
</script>

<style scoped>
    .watchlist-table-container {
        overflow-x: auto;
    }

    .watchlist-table {
        min-width: 1000px;
    }

    .watchlist-table th,
    .watchlist-table td {
        padding: 8px 12px !important;
        white-space: nowrap;
    }

    .watchlist-table th.group-end,
    .watchlist-table td.group-end {
        border-right: 2px solid rgba(var(--v-border-color), 0.5);
    }

    .company-name {
        font-weight: 500;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .clickable-cell {
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .clickable-cell:hover {
        background-color: rgba(var(--v-theme-primary), 0.08);
    }
</style>
