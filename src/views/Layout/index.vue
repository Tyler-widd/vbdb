<!-- src/views/Layout/index.vue -->
<template>
    <v-card class="pa-4">
        <v-container class="bg-background">
            <NavBarDetails />
            <router-view></router-view>
        </v-container>
    </v-card>
</template>

<script setup>
import NavBarDetails from './components/NavBarDetails.vue';
</script>