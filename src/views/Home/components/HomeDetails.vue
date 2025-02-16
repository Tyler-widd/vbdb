<template>
    <v-card-title class="text-center">Volleyball Databased</v-card-title>
    <div class="d-flex justify-center align-center mb-2">
        <v-img src="https://raw.githubusercontent.com/widbuntu/vbdb-info/refs/heads/main/assets/favicon.svg" height="40"
            width="40" contain />
    </div>
    <v-card class="align-center text-center">
        <v-card-text class="bg-surface home-text">NCAA Women, NCAA Men, LOVB, and PVF Pro Leagues rosters, teams and
            results.</v-card-text>
    </v-card>
    <!-- Downloads -->
    <v-card-title class="text-center">Downloads</v-card-title>
    <v-list lines="two">
        <v-list-item class="text-center" v-for="item in urls" :key="item.title" :title="item.title" :subtitle="item.url" :href="item.url"
            target="_blank" rel="noopener noreferrer" link />
    </v-list>
</template>

<script setup>
import { ref } from 'vue';

const urls = ref([
    { title: "Teams", url: "https://raw.githubusercontent.com/widbuntu/vbdb-info/refs/heads/main/data/vbdb_teams.csv" },
    { title: "Players", url: "https://raw.githubusercontent.com/widbuntu/vbdb-info/refs/heads/main/data/vbdb_players.csv" },
    { title: "Results", url: "https://raw.githubusercontent.com/widbuntu/vbdb-info/refs/heads/main/data/vbdb_results.csv" }
]);
</script>
