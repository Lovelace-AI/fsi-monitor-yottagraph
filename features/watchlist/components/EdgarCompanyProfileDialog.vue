<template>
    <v-dialog v-model="isOpen" max-width="900" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" size="small">mdi-file-document-multiple</v-icon>
                Edgar Company Profile
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

                <!-- Company Profile Box -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="blue" size="small" class="mr-2">mdi-domain</v-icon>
                        <span class="text-subtitle-1 font-weight-bold">Company Profile</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div v-if="profileLoading" class="d-flex justify-center pa-4">
                            <v-progress-circular indeterminate size="24" />
                        </div>
                        <div v-else>
                            <div
                                v-for="item in profileItems"
                                :key="item.label"
                                class="d-flex justify-space-between align-center py-1"
                            >
                                <span class="text-body-2 text-medium-emphasis">{{
                                    item.label
                                }}</span>
                                <span class="text-body-2 font-weight-medium">{{ item.value }}</span>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Leadership Box -->
                <v-card class="mb-4" variant="outlined">
                    <v-card-title class="d-flex align-center pb-1">
                        <v-icon color="purple" size="small" class="mr-2">mdi-account-group</v-icon>
                        <span class="text-subtitle-1 font-weight-bold">Leadership</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text>
                        <div v-if="leadershipLoading" class="d-flex justify-center pa-4">
                            <v-progress-circular indeterminate size="24" />
                        </div>
                        <div v-else>
                            <div class="d-flex justify-space-between align-center py-1">
                                <span class="text-body-2 text-medium-emphasis">Officer Count</span>
                                <span class="text-body-2 font-weight-medium">{{
                                    officerCount
                                }}</span>
                            </div>
                            <div class="d-flex justify-space-between align-center py-1">
                                <span class="text-body-2 text-medium-emphasis">Director Count</span>
                                <span class="text-body-2 font-weight-medium">{{
                                    directorCount
                                }}</span>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Financial Facts Box -->
                <FinancialFactsBox
                    :loading="financialFactsLoading"
                    :error="financialFactsError"
                    :rows="financialFactsRows"
                    :columns="financialFactsColumns"
                    class="mb-4"
                />

                <!-- 8-K Events Box -->
                <Form8kEventsBox
                    :loading="events8kLoading"
                    :error="events8kError"
                    :events="events8kEvents"
                />
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { useWatchlistApi } from '../composables/useWatchlistApi';
    import { useCompanyFilings } from '../composables/useCompanyFilings';
    import { useFinancialFacts } from '../composables/useFinancialFacts';
    import { use8kEvents } from '../composables/use8kEvents';
    import FinancialFactsBox from './FinancialFactsBox.vue';
    import Form8kEventsBox from './Form8kEventsBox.vue';

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

    const api = useWatchlistApi();

    const profileLoading = ref(true);
    const leadershipLoading = ref(true);
    const error = ref<string | null>(null);

    const ticker = ref('N/A');
    const companyCik = ref('N/A');
    const industrySic = ref('N/A');
    const stateOfIncorporation = ref('N/A');
    const officerCount = ref(0);
    const directorCount = ref(0);

    const companyNeid = computed(() => props.companyNeid);

    const { loading: filingsLoading, loadFilings } = useCompanyFilings(companyNeid);

    const {
        loading: financialFactsLoading,
        error: financialFactsError,
        rows: financialFactsRows,
        columns: financialFactsColumns,
        reload: reloadFinancialFacts,
    } = useFinancialFacts(companyNeid);

    const {
        loading: events8kLoading,
        error: events8kError,
        events: events8kEvents,
        reload: reload8kEvents,
    } = use8kEvents(companyNeid);

    const profileItems = computed(() => [
        { label: 'Company Name', value: props.companyName },
        { label: 'Ticker Symbol', value: ticker.value },
        { label: 'CIK', value: companyCik.value },
        { label: 'Industry (SIC)', value: industrySic.value },
        { label: 'State of Incorporation', value: stateOfIncorporation.value },
    ]);

    async function loadProfile() {
        profileLoading.value = true;
        try {
            const schema = await api.getSchema();

            const tickerPid = schema.properties.find((p) => p.name === 'ticker')?.pid;
            const companyCikPid = schema.properties.find((p) => p.name === 'company_cik')?.pid;
            const sicDescPid = schema.properties.find((p) => p.name === 'sic_description')?.pid;
            const stateOfIncPid = schema.properties.find(
                (p) => p.name === 'state_of_incorporation'
            )?.pid;

            const pidsToFetch = [tickerPid, companyCikPid, sicDescPid, stateOfIncPid].filter(
                (p): p is number => p !== undefined
            );

            if (pidsToFetch.length > 0) {
                const values = await api.getEntityProperties([props.companyNeid], pidsToFetch);
                for (const val of values) {
                    if (val.pid === tickerPid && val.value) ticker.value = String(val.value);
                    if (val.pid === companyCikPid && val.value)
                        companyCik.value = String(val.value);
                    if (val.pid === sicDescPid && val.value) industrySic.value = String(val.value);
                    if (val.pid === stateOfIncPid && val.value)
                        stateOfIncorporation.value = String(val.value);
                }
            }
        } catch (e: any) {
            error.value = e.message || 'Failed to load profile';
        } finally {
            profileLoading.value = false;
        }
    }

    async function loadLeadership() {
        leadershipLoading.value = true;
        officerCount.value = 0;
        directorCount.value = 0;

        try {
            const neid = props.companyNeid;
            const schema = await api.getSchema();

            const isOfficerPid = schema.properties.find((p) => p.name === 'is_officer')?.pid;
            const isDirectorPid = schema.properties.find((p) => p.name === 'is_director')?.pid;

            const [officerNeids, directorNeids] = await Promise.all([
                isOfficerPid
                    ? api.findEntities({
                          type: 'linked',
                          linked: {
                              to_entity: neid,
                              distance: 1,
                              pids: [isOfficerPid],
                              direction: 'incoming',
                          },
                      })
                    : Promise.resolve([]),
                isDirectorPid
                    ? api.findEntities({
                          type: 'linked',
                          linked: {
                              to_entity: neid,
                              distance: 1,
                              pids: [isDirectorPid],
                              direction: 'incoming',
                          },
                      })
                    : Promise.resolve([]),
            ]);

            officerCount.value = officerNeids.filter((id) => id !== neid).length;
            directorCount.value = directorNeids.filter((id) => id !== neid).length;
        } catch (e: any) {
            error.value = e.message || 'Failed to load leadership';
        } finally {
            leadershipLoading.value = false;
        }
    }

    async function loadData() {
        error.value = null;
        await Promise.all([
            loadProfile(),
            loadLeadership(),
            loadFilings(),
            reloadFinancialFacts(),
            reload8kEvents(),
        ]);
    }

    watch(isOpen, (open) => {
        if (open && props.companyNeid) {
            ticker.value = 'N/A';
            companyCik.value = 'N/A';
            industrySic.value = 'N/A';
            stateOfIncorporation.value = 'N/A';
            officerCount.value = 0;
            directorCount.value = 0;
            loadData();
        }
    });
</script>
