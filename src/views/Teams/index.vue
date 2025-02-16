<template>
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
    <!-- Custom header slot for column width -->
    <template #header.cell="{ header }">
      <th :style="{ width: header.width }">
        {{ header.title }}
      </th>
    </template>

    <!-- Custom cell slot for team_short -->
    <template #item.team_short="{ item }">
      <a :href="item.school_athletic_url" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
        {{ item.team_short }}
      </a>
    </template>
  </v-data-table>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Papa from "papaparse";

/* =============================
   Constants and Reactive State
============================= */

// CSV data URL
const csvUrl =
  "https://raw.githubusercontent.com/widbuntu/vbdb-info/refs/heads/main/data/vbdb_teams.csv";

// Filter options for Level and Division
const levelOptions = ["All Levels", "NCAA Men", "NCAA Women", "Pro Women"];
const divisionOptions = ["All Divisions", "I", "II", "III"];

// State variables
const fullData = ref([]);         // CSV rows
const search = ref("");           // Global search input
const selectedLevel = ref("All Levels");
const selectedDivision = ref("All Divisions");
const selectedConference = ref("All Conferences");
const conferenceOptions = ref(["All Conferences"]);

// Columns to display (and their header settings)
const selectedColumns = [
  { key: "team_short", title: "Team" },
  { key: "conference_short", title: "Conf", width: "100px" },
  { key: "division", title: "Div", width: "60px" }
];

const headers = selectedColumns.map((col) => ({
  title: col.title,
  key: col.key,
  width: col.width || "auto",
  align: "start",
  sortable: true,
}));

/* =============================
   Utility Functions
============================= */

/**
 * Normalize a URL.
 * - If the URL already starts with "http://" or "https://", return it as-is.
 * - Otherwise, prepend "https://".
 */
function normalizeUrl(url) {
  if (!url) return "";
  url = url.trim();
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : "https://" + url;
}

/* =============================
   Computed Properties
============================= */

/**
 * Filter and transform CSV data for the table:
 * - Apply filters for Level, Division, and Conference.
 * - Map each row to only include selected columns.
 * - Normalize the URL for the team name link.
 */
const filteredData = computed(() => {
  return fullData.value
    .filter((row) => {
      const matchLevel =
        selectedLevel.value === "All Levels" || row.level === selectedLevel.value;
      const matchDivision =
        selectedDivision.value === "All Divisions" || row.division === selectedDivision.value;
      const matchConference =
        selectedConference.value === "All Conferences" ||
        row.conference_short === selectedConference.value;
      return matchLevel && matchDivision && matchConference;
    })
    .map((row) => {
      const displayRow = {};
      selectedColumns.forEach((col) => {
        displayRow[col.key] = row[col.key];
      });
      displayRow.school_athletic_url = normalizeUrl(row.school_athletic_url);
      return displayRow;
    });
});

/* =============================
   Data Fetching Function
============================= */

/**
 * Fetch CSV data from the provided URL, parse it,
 * store the result in fullData, and build conferenceOptions dynamically.
 */
async function fetchCsvData() {
  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        fullData.value = result.data;
        // Build a set of unique conferences from the CSV rows.
        const conferences = new Set();
        result.data.forEach((row) => {
          if (row.conference_short) {
            conferences.add(row.conference_short);
          }
        });
        conferenceOptions.value = ["All Conferences", ...Array.from(conferences).sort()];
      },
    });
  } catch (error) {
    console.error("Error fetching CSV:", error);
  }
}

onMounted(fetchCsvData);
</script>

<style scoped>
/* Add any additional custom styles here */
</style>
