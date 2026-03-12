<template>
    <v-card class="fill-height" variant="outlined">
        <v-card-title class="d-flex align-center pb-1">
            <v-icon :color="color" size="small" class="mr-2">{{ icon }}</v-icon>
            <span class="text-subtitle-1 font-weight-bold">{{ title }}</span>
        </v-card-title>
        <v-divider />
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-4">
                <v-progress-circular indeterminate size="24" />
            </div>
            <div v-else>
                <div
                    v-for="item in items"
                    :key="item.label"
                    class="d-flex justify-space-between align-center py-1"
                >
                    <span class="text-body-2 text-medium-emphasis">{{ item.label }}</span>
                    <span class="text-body-2 font-weight-medium">{{ item.value }}</span>
                </div>
            </div>
            <div v-if="!loading && footer" class="text-caption text-medium-emphasis mt-3">
                {{ footer }}
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    export interface FeatureBoxItem {
        label: string;
        value: string;
    }

    defineProps<{
        title: string;
        icon: string;
        color: string;
        items: FeatureBoxItem[];
        loading?: boolean;
        footer?: string;
    }>();
</script>
