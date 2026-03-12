import { defineFeatureModule } from '~/composables/useModuleRegistry';
import WatchlistPage from './pages/index.vue';

export default defineFeatureModule({
    id: 'watchlist',
    name: 'Watchlist',
    icon: 'mdi-eye',
    description: 'Company watchlist with SEC filing data',

    routes: [
        {
            path: '/watchlist',
            component: WatchlistPage,
            meta: { title: 'Watchlist' },
        },
    ],

    navigation: {
        title: 'Watchlist',
        order: 10,
    },

    requires: ['useQueryServer'],
    provides: ['useWatchlist'],
});
