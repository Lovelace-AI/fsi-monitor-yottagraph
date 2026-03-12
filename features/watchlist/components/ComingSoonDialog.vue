<template>
    <v-dialog v-model="isOpen" max-width="400">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" size="small">{{ icon }}</v-icon>
                {{ title }}
                <v-spacer />
                <v-btn icon variant="text" size="small" @click="isOpen = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text class="text-center pa-8">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clock-outline</v-icon>
                <div class="text-h5 text-medium-emphasis">Coming Soon</div>
                <div class="text-body-2 text-medium-emphasis mt-2">
                    {{ description || 'This feature is under development.' }}
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    const props = defineProps<{
        modelValue: boolean;
        title: string;
        icon?: string;
        description?: string;
    }>();

    const emit = defineEmits<{
        'update:modelValue': [value: boolean];
    }>();

    const isOpen = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value),
    });

    const icon = computed(() => props.icon || 'mdi-information');
    const description = computed(() => props.description);
</script>
