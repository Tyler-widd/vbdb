<template>
    <v-container class='border-thin mt-4'>
    <!-- Header -->
    <v-card-title class="text-center">
        Players
    </v-card-title>

    <!-- Filter Section -->
    <v-row class="mt-2" no-gutters justify="center">
        <v-col cols="4" md="2">
            <v-autocomplete class="ml-1 mr-1 mb-1 mt-1" v-model="selectedLevel" hide-details label="Levels"
                variant="outlined" density="compact" :items="levelOptions" />
        </v-col>
        <v-col cols="4" md="2">
            <v-autocomplete class="ml-1 mr-1 mb-1 mt-1" v-model="selectedDivision" hide-details label="Divisions"
                variant="outlined" density="compact" :items="divisionOptions" />
        </v-col>
        <v-col cols="4" md="2">
            <v-autocomplete class="ml-1 mr-1 mb-1 mt-1" v-model="selectedConference" hide-details label="Conferences"
                variant="outlined" density="compact" :items="availableConferences" />
        </v-col>
        <v-col cols="4" md="2">
            <v-autocomplete class="ml-1 mr-1 mb-1 mt-1" v-model="selectedTeam" hide-details label="Teams"
                variant="outlined" density="compact" :items="availableTeams" />
        </v-col>
        <v-col cols="4" md="2">
            <v-autocomplete class="ml-1 mr-1 mb-1 mt-1" v-model="selectedPosition" hide-details label="Positions"
                variant="outlined" density="compact" :items="positionOptions" />
        </v-col>
        <v-col cols="4" md="2">
            <v-autocomplete class="ml-1 mr-1 mb-1 mt-1" v-model="selectedClass" hide-details label="Class"
                variant="outlined" density="compact" :items="classOptions" />
        </v-col>
    </v-row>

    <!-- Search and Column Selection Row -->
    <v-row no-gutters justify="center" align="center" class="mt-4 mb-4">
        <v-col cols="10">
            <v-text-field v-model="search" label="Search" variant="outlined" density="compact" hide-details />
        </v-col>
        <v-col cols="auto" class="ml-2">
            <v-menu :close-on-content-click="false">
                <template v-slot:activator="{ props }">
                    <v-icon icon="mdi-cog" v-bind="props" size="24" class="mt-1 cursor-pointer" />
                </template>
                <v-list>
                    <v-list-item>
                        <v-list-item-title class="text-subtitle-2 font-weight-bold mb-2">
                            Optional Columns
                        </v-list-item-title>
                    </v-list-item>
                    <v-list-item v-for="header in optionalHeaders" :key="header.key">
                        <v-checkbox v-model="selectedOptionalColumns" :label="header.title" :value="header.key"
                            hide-details density="compact" />
                    </v-list-item>
                </v-list>
            </v-menu>
        </v-col>
    </v-row>
    <!-- Data Table -->
    <v-data-table :headers="visibleHeaders" :items="filteredData" :search="search" density="compact" class="elevation-1"
        :items-per-page="10">
        <!-- Updated Name column template to use correct field name -->
        <template #item.Name="{ item }">
            <a v-if="item['Player URL']" :href="getPlayerURL(item)" target="_blank" rel="noopener noreferrer"
                class="text-decoration-none">
                {{ item.Name }}
            </a>
            <span v-else>
                {{ item.Name }}
            </span>
        </template>
    </v-data-table>
</v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import Papa from "papaparse";

// CSV data URL
const csvUrl = "https://raw.githubusercontent.com/widbuntu/vbdb-info/refs/heads/main/data/vbdb_players.csv";

// Reactive state variables
const fullData = ref([]);
const search = ref("");

// Store selected optional columns
const selectedOptionalColumns = ref([]);

// Computed property for visible headers
const visibleHeaders = computed(() => {
    const optionalVisibleHeaders = optionalHeaders
        .filter(header => selectedOptionalColumns.value.includes(header.key));
    return [...baseHeaders, ...optionalVisibleHeaders];
});

// Base headers (always visible)
const baseHeaders = [
    { title: "Name", key: "Name", align: "start" },
    { width: "10px", title: "Pos", key: "Position", align: "start" },
    { width: "10px", title: "Hgt", key: "Height", align: "start" },
    { width: "40px", title: "Class", key: "Class", align: "start" },
    { width: "100px", title: "Team", key: "team_short", align: "start" },
    { width: "100", title: "Conf", key: "conference_short", align: "start" },
    { width: "10px", title: "Div", key: "division", align: "start" },
];

// Optional headers that can be toggled
const optionalHeaders = [
    { title: "Hometown", key: "Hometown", align: "start" },
    { title: "High School", key: "High_School", align: "start" },
    { title: "Head Coach", key: "head_coach", align: "start" },
    { title: "State", key: "state", align: "start" },
    { title: "Sport Region", key: "sportRegion", align: "start" },
];

// Filter selections
const selectedLevel = ref("All Levels");
const selectedDivision = ref("All Divisions");
const selectedConference = ref("All Conferences");
const selectedTeam = ref("All Teams");
const selectedPosition = ref("All Positions");
const selectedClass = ref("All Classes");

// Filter options (will be populated dynamically)
const levelOptions = ref(["All Levels"]);
const divisionOptions = ref(["All Divisions"]);
const conferenceOptions = ref(["All Conferences"]);
const teamOptions = ref(["All Teams"]);
const positionOptions = ref(["All Positions"]);
const classOptions = ref(["All Classes"]);

const getPlayerURL = (player) => {
    let url = player["Player URL"];
    if (!url) return ""; // Handle empty URLs safely

    if ((player.level || "").toUpperCase().includes("NCAA")) {
        return `https://stats.ncaa.org${url}`;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `https://${url}`;
    }
    return url;
};

// Table headers
const headers = [
    { title: "Name", key: "Name", align: "start" },
    { width: "10px", title: "Pos", key: "Position", align: "start" },
    { width: "10px", title: "Hgt", key: "Height", align: "start" },
    { width: "40px", title: "Class", key: "Class", align: "start" },
    { width: "100px", title: "Team", key: "team_short", align: "start" },
    { width: "100", title: "Conf", key: "conference_short", align: "start" },
    { width: "10px", title: "Div", key: "division", align: "start" },
];

// Computed property for filtered data based on current selections
const filteredByBasicCriteria = computed(() => {
    return fullData.value.filter((row) => {
        const matchLevel = selectedLevel.value === "All Levels" || row.level === selectedLevel.value;
        const matchDivision = selectedDivision.value === "All Divisions" || row.division === selectedDivision.value;
        const matchPosition = selectedPosition.value === "All Positions" || row.Position === selectedPosition.value;
        const matchClass = selectedClass.value === "All Classes" || row.Class === selectedClass.value;
        return matchLevel && matchDivision && matchPosition && matchClass;
    });
});

// Computed property for available conferences based on other selections
const availableConferences = computed(() => {
    const conferences = new Set(filteredByBasicCriteria.value.map(row => row.conference_short).filter(Boolean));
    return ["All Conferences", ...Array.from(conferences).sort()];
});

// Computed property for available teams based on other selections and conference
const availableTeams = computed(() => {
    let filteredTeams = filteredByBasicCriteria.value;

    // Apply conference filter if selected
    if (selectedConference.value !== "All Conferences") {
        filteredTeams = filteredTeams.filter(row => row.conference_short === selectedConference.value);
    }

    const teams = new Set(filteredTeams.map(row => row.team_name).filter(Boolean));
    return ["All Teams", ...Array.from(teams).sort()];
});

// Computed property for final filtered data
const filteredData = computed(() => {
    return filteredByBasicCriteria.value.filter((row) => {
        const matchConference = selectedConference.value === "All Conferences" || row.conference_short === selectedConference.value;
        const matchTeam = selectedTeam.value === "All Teams" || row.team_name === selectedTeam.value;
        return matchConference && matchTeam;
    });
});

// Watch for changes in filters that should reset dependent filters
watch([selectedLevel, selectedDivision, selectedPosition, selectedClass], () => {
    // Reset conference and team when primary filters change
    selectedConference.value = "All Conferences";
    selectedTeam.value = "All Teams";
});

// Watch for changes in conference to reset team selection
watch(selectedConference, () => {
    selectedTeam.value = "All Teams";
});

// Function to update initial filter options from data
const updateFilterOptions = (data) => {
    const getUniqueValues = (field) => {
        const values = new Set(data.map(row => row[field]).filter(Boolean));
        return ["All " + field + "s", ...Array.from(values).sort()];
    };

    levelOptions.value = getUniqueValues("level");
    divisionOptions.value = getUniqueValues("division");
    positionOptions.value = getUniqueValues("Position");
    classOptions.value = getUniqueValues("Class");
};

// Fetch CSV data and initialize
const fetchCsvAndConvertToJson = async () => {
    try {
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                fullData.value = result.data;
                updateFilterOptions(result.data);
            },
        });
    } catch (error) {
        console.error("Error fetching CSV:", error);
    }
};

onMounted(fetchCsvAndConvertToJson);
</script>