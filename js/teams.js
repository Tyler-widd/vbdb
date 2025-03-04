// Modify the filterTeams function in your teams.js file
function filterTeams() {
    // Reset to first page whenever filters change
    currentPage = 1;
    
    const levelFilter = document.getElementById('team-level-filter').value;
    const divisionFilter = document.getElementById('team-division-filter').value;
    const conferenceFilter = document.getElementById('team-conference-filter').value;
    
    console.log("Filtering teams with:", 
                "Level:", levelFilter, 
                "Division:", divisionFilter, 
                "Conference:", conferenceFilter);
    
    // Filter the teams data
    const filteredTeams = teamData.filter(team => {
        // Handle level filter
        const levelMatch = levelFilter === 'all' || team.level === levelFilter;
        
        // Handle division filter, accounting for null/empty values
        let divisionMatch = false;
        if (divisionFilter === 'all') {
            divisionMatch = true;
        } else if (divisionFilter === 'null' || divisionFilter === '') {
            divisionMatch = !team.division || team.division === '' || team.division === null;
        } else {
            divisionMatch = team.division === divisionFilter;
        }
        
        // Handle conference filter
        let conferenceMatch = false;
        if (conferenceFilter === 'all') {
            conferenceMatch = true;
        } else if (conferenceFilter === 'null' || conferenceFilter === '') {
            conferenceMatch = !team.conference || team.conference === '' || team.conference === null;
        } else {
            conferenceMatch = team.conference === conferenceFilter;
        }
        
        return levelMatch && divisionMatch && conferenceMatch;
    });
    
    console.log("Filtered teams:", filteredTeams.length);
    
    renderTeamsTable(filteredTeams);
}

// Render teams table with pagination
function renderTeamsTable(teams) {
    const container = document.getElementById('teams-data-container');

    // Handle empty results
    if (teams.length === 0) {
        container.innerHTML = `
            <div class="no-data-message">
                <p>No teams match your selected filters. Please try different criteria.</p>
            </div>
        `;
        return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(teams.length / rowsPerPage);

    // Make sure current page is valid
    if (currentPage > totalPages) {
        currentPage = totalPages;
    } else if (currentPage < 1) {
        currentPage = 1;
    }

    // Get current page of data
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, teams.length);
    const currentPageData = teams.slice(startIndex, endIndex);

    // Create the table
    let tableHtml = `
        <div class="pagination-info mb-2">
            Showing ${startIndex + 1} to ${endIndex} of ${teams.length} teams
        </div>
        <table class="data-table" id="teams-table">
            <thead>
                <tr>
                    <th data-sort="name">Team</th>
                    <th data-sort="conference">Conference</th>
                    <th data-sort="level">Level</th>
                    <th data-sort="division">Division</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Add rows for current page
    currentPageData.forEach(team => {
        // Normalize URL if it exists
        let normalizedUrl = team.url;
        if (normalizedUrl) {
            // Check if URL has protocol, if not add it
            if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
                normalizedUrl = 'https://' + normalizedUrl;
            }
            
            // Remove any references to localhost or 127.0.0.1
            normalizedUrl = normalizedUrl.replace(/http:\/\/127\.0\.0\.1:\d+\//, 'https://');
        }
        
        tableHtml += `
            <tr>
                <td>${normalizedUrl ? `<a href="${normalizedUrl}" target="_blank">${team.name}</a>` : team.name}</td>
                <td>${team.conference || ''}</td>
                <td>${team.level || ''}</td>
                <td>${team.division || ''}</td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    // Add pagination controls
    if (totalPages > 1) {
        tableHtml += generatePaginationControls(totalPages);
    }

    container.innerHTML = tableHtml;

    // Add event listeners for sorting
    document.querySelectorAll('#teams-table th').forEach(th => {
        th.addEventListener('click', () => {
            sortTable(th.getAttribute('data-sort'), 'teams-table', th);
        });
    });

    // Add event listeners for pagination
    if (totalPages > 1) {
        setupPaginationHandlers(teams, renderTeamsTable);
    }
}

function updateTeamDependentDropdowns(prefix) {
    const levelFilter = document.getElementById(`${prefix}-level-filter`);
    const level = levelFilter.value;

    // Get filtered sets for each dropdown
    const filteredDivisions = new Set();
    const filteredConferences = new Set();

    teamData.forEach(team => {
        if (level === 'all' || team.level === level) {
            if (team.division) filteredDivisions.add(team.division);
            if (team.conference) filteredConferences.add(team.conference);
        }
    });

    // Update dropdowns
    populateDropdown(`${prefix}-division-filter`, filteredDivisions);
    populateDropdown(`${prefix}-conference-filter`, filteredConferences);
}

// And similarly for updateTeamDependentConference
function updateTeamDependentConference(prefix) {
    const levelFilter = document.getElementById(`${prefix}-level-filter`);
    const divisionFilter = document.getElementById(`${prefix}-division-filter`);
    const level = levelFilter.value;
    const division = divisionFilter.value;

    // Get filtered sets
    const filteredConferences = new Set();

    teamData.forEach(team => {
        if ((level === 'all' || team.level === level) &&
            (division === 'all' || team.division === division)) {
            if (team.conference) filteredConferences.add(team.conference);
        }
    });

    // Update dropdowns
    populateDropdown(`${prefix}-conference-filter`, filteredConferences);
}