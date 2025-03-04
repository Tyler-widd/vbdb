// Update dependent dropdowns based on level selection
function updateDependentDropdowns(prefix) {
    const levelFilter = document.getElementById(`${prefix}-level-filter`);
    const level = levelFilter.value;

    // Get filtered sets for each dropdown
    const filteredDivisions = new Set();
    const filteredConferences = new Set();
    const filteredTeams = new Set();
    const filteredPositions = new Set();
    const filteredClasses = new Set();

    playerData.forEach(player => {
        if (level === 'all' || player.level === level) {
            if (player.division) filteredDivisions.add(player.division);
            if (player.conference) filteredConferences.add(player.conference);
            if (player.team) filteredTeams.add(player.team);
            if (player.position) {
                const normalizedPosition = normalizePosition(player.position);
                filteredPositions.add(normalizedPosition);
            }
            if (player.class_year) filteredClasses.add(player.class_year);
        }
    });

    // Update dropdowns
    populateDropdown(`${prefix}-division-filter`, filteredDivisions);
    populateDropdown(`${prefix}-conference-filter`, filteredConferences);
    populateDropdown(`${prefix}-team-filter`, filteredTeams);

    // Only update these if they exist (player tab only)
    if (document.getElementById(`${prefix}-position-filter`)) {
        populateDropdown(`${prefix}-position-filter`, filteredPositions);
    }

    if (document.getElementById(`${prefix}-class-filter`)) {
        populateDropdown(`${prefix}-class-filter`, filteredClasses);
    }
}

// Update conference and team dropdowns based on division selection
function updateDependentConferenceTeam(prefix) {
    const levelFilter = document.getElementById(`${prefix}-level-filter`);
    const divisionFilter = document.getElementById(`${prefix}-division-filter`);
    const level = levelFilter.value;
    const division = divisionFilter.value;

    // Get filtered sets
    const filteredConferences = new Set();
    const filteredTeams = new Set();

    playerData.forEach(player => {
        if ((level === 'all' || player.level === level) &&
            (division === 'all' || player.division === division)) {
            if (player.conference) filteredConferences.add(player.conference);
            if (player.team) filteredTeams.add(player.team);
        }
    });

    // Update dropdowns
    populateDropdown(`${prefix}-conference-filter`, filteredConferences);
    populateDropdown(`${prefix}-team-filter`, filteredTeams);
}

// Update team dropdown based on conference selection
function updateDependentTeam(prefix) {
    const levelFilter = document.getElementById(`${prefix}-level-filter`);
    const divisionFilter = document.getElementById(`${prefix}-division-filter`);
    const conferenceFilter = document.getElementById(`${prefix}-conference-filter`);
    const level = levelFilter.value;
    const division = divisionFilter.value;
    const conference = conferenceFilter.value;

    // Get teams that match all criteria
    const filteredTeams = new Set();

    playerData.forEach(player => {
        if ((level === 'all' || player.level === level) &&
            (division === 'all' || player.division === division) &&
            (conference === 'all' || player.conference === conference)) {
            if (player.team) filteredTeams.add(player.team);
        }
    });

    // Update dropdown
    populateDropdown(`${prefix}-team-filter`, filteredTeams);
}

// Filter players based on all criteria
function filterPlayers() {
    // Reset to first page whenever filters change
    currentPage = 1;

    const levelFilter = document.getElementById('player-level-filter').value;
    const divisionFilter = document.getElementById('player-division-filter').value;
    const conferenceFilter = document.getElementById('player-conference-filter').value;
    const teamFilter = document.getElementById('player-team-filter').value;
    const positionFilter = document.getElementById('player-position-filter').value;
    const classFilter = document.getElementById('player-class-filter').value;

    // Filter player data
    const filteredPlayers = playerData.filter(player => {
        const normalizedPosition = normalizePosition(player.position);

        return (levelFilter === 'all' || player.level === levelFilter) &&
            (divisionFilter === 'all' || player.division === divisionFilter) &&
            (conferenceFilter === 'all' || player.conference === conferenceFilter) &&
            (teamFilter === 'all' || player.team === teamFilter) &&
            (positionFilter === 'all' || normalizedPosition === positionFilter) &&
            (classFilter === 'all' || player.class_year === classFilter);
    });

    // Render the filtered data
    renderPlayersTable(filteredPlayers);
}

// Render players table with pagination
function renderPlayersTable(players) {
    const container = document.getElementById('players-data-container');

    // Handle empty results
    if (players.length === 0) {
        container.innerHTML = `
            <div class="no-data-message">
                <p>No players match your selected filters. Please try different criteria.</p>
            </div>
        `;
        return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(players.length / rowsPerPage);

    // Make sure current page is valid
    if (currentPage > totalPages) {
        currentPage = totalPages;
    } else if (currentPage < 1) {
        currentPage = 1;
    }

    // Get current page of data
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, players.length);
    const currentPageData = players.slice(startIndex, endIndex);

    // Create the table
    let tableHtml = `
        <div class="pagination-info mb-2">
            Showing ${startIndex + 1} to ${endIndex} of ${players.length} players
        </div>
        <table class="data-table" id="players-table">
            <thead>
                <tr>
                    <th data-sort="name">Name</th>
                    <th data-sort="jersey">Jersey</th>
                    <th data-sort="position">Position</th>
                    <th data-sort="height">Height</th>
                    <th data-sort="team">Team</th>
                    <th data-sort="conference">Conference</th>
                    <th data-sort="level">Level</th>
                    <th data-sort="division">Division</th>
                    <th data-sort="college">College</th>
                    <th data-sort="class_year">Class</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Add rows for current page
    currentPageData.forEach(player => {
        tableHtml += `
            <tr>
                <td>${player.profile_url ? `<a href="${player.profile_url}" target="_blank">${player.name}</a>` : player.name}</td>
                <td>${player.jersey || ''}</td>
                <td>${normalizePosition(player.position) || ''}</td>
                <td>${player.height || ''}</td>
                <td>${player.team || ''}</td>
                <td>${player.conference || ''}</td>
                <td>${player.level || ''}</td>
                <td>${player.division || ''}</td>
                <td>${player.college || ''}</td>
                <td>${player.class_year || ''}</td>
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
    document.querySelectorAll('#players-table th').forEach(th => {
        th.addEventListener('click', () => {
            sortTable(th.getAttribute('data-sort'), 'players-table', th);
        });
    });

    // Add event listeners for pagination
    if (totalPages > 1) {
        setupPaginationHandlers(players, renderPlayersTable);
    }
}

// Generate pagination controls HTML
function generatePaginationControls(totalPages) {
    return `
        <div class="pagination-controls mt-3">
            <nav aria-label="Data table pagination">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="first" aria-label="First">
                            <span aria-hidden="true">&laquo;&laquo;</span>
                        </a>
                    </li>
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="previous" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                    ${generatePageNumbers(totalPages)}
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="next" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="last" aria-label="Last">
                            <span aria-hidden="true">&raquo;&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    `;
}

// Generate page number buttons
function generatePageNumbers(totalPages) {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're at the end
    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    let pageNumbersHtml = '';
    for (let i = startPage; i <= endPage; i++) {
        pageNumbersHtml += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    return pageNumbersHtml;
}

// Set up pagination event handlers
function setupPaginationHandlers(data, renderFunction) {
    document.querySelectorAll('.pagination-controls .page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const container = e.target.closest('.data-table-container');
            const pageAction = link.getAttribute('data-page');
            const totalPages = Math.ceil(data.length / rowsPerPage);

            switch (pageAction) {
                case 'first':
                    currentPage = 1;
                    break;
                case 'previous':
                    currentPage = Math.max(1, currentPage - 1);
                    break;
                case 'next':
                    currentPage = Math.min(totalPages, currentPage + 1);
                    break;
                case 'last':
                    currentPage = totalPages;
                    break;
                default:
                    // If it's a number
                    currentPage = parseInt(pageAction, 10);
            }

            // Re-render with new page
            renderFunction(data);

            // Scroll back to top of table
            container.scrollIntoView({ behavior: 'smooth' });
        });
    });
}