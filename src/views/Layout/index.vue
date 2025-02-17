<!-- src/views/Layout/index.vue -->
<template>
    <v-app>
        <v-card class="pa-4">
            <v-container class="bg-background">
                <NavBarDetails />
            </v-container>
        </v-card>
        <v-main>
            <router-view /> <!-- This will render the Home, Teams, Players, Results components -->
        </v-main>
    </v-app>
</template>

<script setup>
import NavBarDetails from './components/NavBarDetails.vue';
</script>