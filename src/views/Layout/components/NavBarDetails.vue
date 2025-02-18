<template>
    <v-row align="center" justify="center" no-gutters>
        <v-col cols="auto" class="d-flex align-center">
            <v-slide-group show-arrows>
                <v-slide-group-item v-for="item in menu" :key="item.to">
                    <v-btn density="compact"
                        :to="item.to" 
                        flat 
                        variant="outlined" 
                        class="ma-1"
                    >
                        {{ item.title }}
                    </v-btn>
                </v-slide-group-item>
            </v-slide-group>
        </v-col>
    </v-row>
</template>

<script setup>
const menu = [
    { to: '/', title: 'VBDB' },
    { to: 'teams', title: 'Teams' },
    { to: 'players', title: 'Players' },
    { to: 'results', title: 'Results' },
    // { to: 'stats', title: 'Stats' }, 
    // { to: 'schedule', title: 'Schedule' }, 
    // { to: 'rankings', title: 'Rankings' }
];
</script>