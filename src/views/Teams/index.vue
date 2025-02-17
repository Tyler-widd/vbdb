<template>
  <v-container class='border-thin mt-4'>
  <!-- Header -->
  <v-card-title class="text-center">
    Teams
  </v-card-title>

  <!-- Filter Section -->
  <v-row class="mt-2" no-gutters justify="center">
    <v-col cols="4" md="2">
      <v-autocomplete class="ml-1 mr-1 mb-1 mt-1" v-model="selectedLevel" :items="levelOptions" label="Level"
        variant="outlined" dense hide-details density="compact" />
    </v-col>
    <v-col cols="4" md="2">
      <v-autocomplete class="ml-1 mr-1 mb-1 mt-1" v-model="selectedDivision" :items="divisionOptions" label="Division"
        variant="outlined" dense hide-details density="compact" />
    </v-col>
    <v-col cols="4" md="2">
      <v-autocomplete class="ml-1 mr-1 mb-1 mt-1" v-model="selectedConference" :items="conferenceOptions"
        label="Conference" variant="outlined" dense hide-details density="compact" />
    </v-col>
  </v-row>

  <!-- Global Search Field -->
  <v-text-field v-model="search" label="Search" variant="outlined" density="compact" hide-details class="mt-4 mb-4" />

  <!-- Data Table Section -->
  <v-data-table density="compact" :headers="headers" :items="filteredData" :search="search" class="elevation-1" dense
    :items-per-page="10">
    <template #item.name="{ item }">
      <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-accent">
        {{ item.name }}
      </a>
    </template>
  </v-data-table>
</v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

// JSON data URL
const jsonUrl =
  "https://raw.githubusercontent.com/Tyler-widd/vbdb-data/refs/heads/master/data/vbdb_teams.json";

// Filter options for Level (static)
const levelOptions = ["All Levels", "NCAA Men", "NCAA Women", "Pro Women"];
const divisionOptions = ref(["All Divisions"]);
const conferenceOptions = ref(["All Conferences"]);

// State variables
const fullData = ref([]);
const search = ref("");
const selectedLevel = ref("All Levels");
const selectedDivision = ref("All Divisions");
const selectedConference = ref("All Conferences");

// Columns to display (and their header settings)
const selectedColumns = [
  { key: "division", title: "Div", width: "1%" },
  { key: "name", title: "Team", width: '69%' },
  { key: "conference", title: "Conf", width: "30%" },
];

const headers = selectedColumns.map((col) => ({
  title: col.title,
  key: col.key,
  width: col.width || "auto",
  align: "start",
  sortable: true,
}));

function normalizeUrl(url) {
  if (!url) return "";
  url = url.trim();
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : "https://" + url;
}

const filteredData = computed(() => {
  return fullData.value
    .filter((row) => {
      const matchLevel =
        selectedLevel.value === "All Levels" || row.level === selectedLevel.value;
      const matchDivision =
        selectedDivision.value === "All Divisions" || row.division === selectedDivision.value;
      const matchConference =
        selectedConference.value === "All Conferences" ||
        row.conference === selectedConference.value;
      return matchLevel && matchDivision && matchConference;
    })
    .map((row) => {
      const displayRow = {};
      selectedColumns.forEach((col) => {
        displayRow[col.key] = row[col.key];
      });
      displayRow.url = normalizeUrl(row.url);
      return displayRow;
    });
});

// Watch for changes in selectedLevel and selectedDivision to update options
watch([selectedLevel, selectedDivision], () => {
  updateAvailableOptions();
});

function updateAvailableOptions() {
  // Get unique divisions based on level and available divisions
  const divisions = new Set();
  const conferences = new Set();
  fullData.value.forEach((row) => {
    if (
      (selectedLevel.value === "All Levels" || row.level === selectedLevel.value) &&
      (selectedDivision.value === "All Divisions" || row.division === selectedDivision.value)
    ) {
      if (row.division) divisions.add(row.division);
      if (row.conference) conferences.add(row.conference);
    }
  });

  // Update division and conference options
  divisionOptions.value = ["All Divisions", ...Array.from(divisions).sort()];
  conferenceOptions.value = ["All Conferences", ...Array.from(conferences).sort()];
}

async function fetchJsonData() {
  try {
    const response = await fetch(jsonUrl);
    const data = await response.json();
    fullData.value = data;

    // Initial population of division and conference options
    updateAvailableOptions();
  } catch (error) {
    console.error("Error fetching JSON:", error);
  }
}

onMounted(fetchJsonData);
</script>
