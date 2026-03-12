<template>
    <v-dialog v-model="isOpen" max-width="500" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" size="small">mdi-file-document</v-icon>
                Briefing Agent
                <v-spacer />
                <v-btn icon variant="text" size="small" @click="isOpen = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
                <v-alert v-if="configError" type="warning" density="compact" class="mb-4">
                    {{ configError }}
                </v-alert>

                <v-alert v-else-if="error" type="error" density="compact" class="mb-4" closable>
                    {{ error }}
                </v-alert>

                <div v-else-if="loading" class="text-center py-8">
                    <v-progress-circular indeterminate size="48" color="primary" class="mb-4" />
                    <div class="text-body-1 text-medium-emphasis">Generating briefing...</div>
                </div>

                <div v-else-if="briefingText" class="briefing-content">
                    <div class="text-body-1" style="line-height: 1.6">{{ briefingText }}</div>
                </div>

                <div v-else class="text-center py-8">
                    <v-icon size="48" color="grey-lighten-1" class="mb-4"
                        >mdi-file-document-outline</v-icon
                    >
                    <div class="text-body-2 text-medium-emphasis">
                        Click to generate a briefing of your watchlist.
                    </div>
                </div>
            </v-card-text>
            <v-divider v-if="!loading && !configError" />
            <v-card-actions v-if="!loading && !configError" class="pa-4">
                <v-spacer />
                <v-btn variant="outlined" @click="generateBriefing" :disabled="loading">
                    <v-icon start>mdi-refresh</v-icon>
                    {{ briefingText ? 'Regenerate' : 'Generate Briefing' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { useUserState } from '~/composables/useUserState';
    import { useTenantConfig } from '~/composables/useTenantConfig';
    import type { WatchlistCompanyData } from '../composables/useCompanyWatchlistData';

    const props = defineProps<{
        modelValue: boolean;
        watchlistData: Map<string, WatchlistCompanyData>;
    }>();

    const emit = defineEmits<{
        'update:modelValue': [value: boolean];
    }>();

    const isOpen = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value),
    });

    const { accessToken } = useUserState();
    const { config: tenantConfig, fetchConfig } = useTenantConfig();

    const loading = ref(false);
    const error = ref<string | null>(null);
    const briefingText = ref<string | null>(null);
    const configError = ref<string | null>(null);

    function getGatewayUrl(): string {
        const config = useRuntimeConfig();
        return (config.public as any).gatewayUrl || '';
    }

    function getTenantOrgId(): string {
        const config = useRuntimeConfig();
        return (config.public as any).tenantOrgId || '';
    }

    function findBriefingAgent(): string | null {
        if (!tenantConfig.value?.agents) return null;
        const agent = tenantConfig.value.agents.find(
            (a) =>
                a.name.toLowerCase().includes('briefing') ||
                a.display_name?.toLowerCase().includes('briefing')
        );
        return agent?.engine_id || null;
    }

    function buildWatchlistMessage(): string {
        const companies: { name: string; edgarFilings: string }[] = [];
        for (const [, data] of props.watchlistData) {
            companies.push({
                name: data.name,
                edgarFilings:
                    data.edgarFilingsCount !== null ? String(data.edgarFilingsCount) : '--',
            });
        }

        if (companies.length === 0) {
            return 'The watchlist is currently empty. Please provide a briefing noting this.';
        }

        const companyLines = companies
            .map((c) => `- ${c.name}: ${c.edgarFilings} Edgar filings`)
            .join('\n');

        return `Please provide a briefing summary (max 100 words) for the following watchlist:\n\n${companyLines}`;
    }

    async function generateBriefing() {
        const gatewayUrl = getGatewayUrl();
        const orgId = getTenantOrgId();

        if (!gatewayUrl || !orgId) {
            configError.value =
                'Agent gateway not configured. Deploy a briefing agent to enable this feature.';
            return;
        }

        await fetchConfig();

        const agentId = findBriefingAgent();
        if (!agentId) {
            configError.value =
                'No briefing agent deployed. Deploy the briefing_agent using /deploy_agent in Cursor.';
            return;
        }

        loading.value = true;
        error.value = null;
        configError.value = null;

        try {
            const url = `${gatewayUrl}/api/agents/${orgId}/${agentId}/query`;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (accessToken.value) {
                headers['Authorization'] = `Bearer ${accessToken.value}`;
            }

            const message = buildWatchlistMessage();

            const response = await $fetch<{ output: any; session_id: string | null }>(url, {
                method: 'POST',
                headers,
                body: { message },
            });

            briefingText.value = extractAgentText(response.output);
        } catch (e: any) {
            error.value = e.data?.statusMessage || e.message || 'Failed to generate briefing';
        } finally {
            loading.value = false;
        }
    }

    function extractAgentText(output: any): string {
        if (typeof output === 'string') return output;
        if (output?.text) return output.text;
        if (output?.content)
            return typeof output.content === 'string'
                ? output.content
                : JSON.stringify(output.content, null, 2);
        if (output?.messages) {
            const last = output.messages[output.messages.length - 1];
            if (last?.parts?.[0]?.text) return last.parts[0].text;
            if (last?.content) return last.content;
        }
        if (output?.output) return extractAgentText(output.output);
        return JSON.stringify(output, null, 2);
    }

    watch(isOpen, async (open) => {
        if (open) {
            briefingText.value = null;
            error.value = null;
            configError.value = null;
            await generateBriefing();
        }
    });
</script>

<style scoped>
    .briefing-content {
        background: rgba(var(--v-theme-primary), 0.04);
        border-radius: 8px;
        padding: 16px;
    }
</style>
