// Global variables
let playerData = [];
let teamData = [];
let currentPage = 1;
const rowsPerPage = 10;

// Position normalization
function normalizePosition(position) {
    if (!position) return position;

    const positionMapping = {
        "L": "Libero",
        "Libero": "Libero",
        "S": "Setter",
        "Setter": "Setter",
        "Libero, Setter": "Libero/Setter",
        "OH": "Outside Hitter",
        "Outside Hitter": "Outside Hitter",
        "MB": "Middle Blocker",
        "Middle Blocker": "Middle Blocker",
        "MH": "Middle Blocker",
        "OPP": "Opposite Hitter",
        "Opposite Hitter": "Opposite Hitter",
        "DS": "Defensive Specialist",
        "L/DS": "Libero/Defensive Specialist",
        "Head Coach": "Head Coach",
        "Assistant Coach": "Assistant Coach",
        "Director of Volleyball Operations/Technical Director": "Technical Staff"
    };

    return positionMapping[position] || position;
}

// Fetch data from APIs
function fetchData() {
    document.getElementById('players-loader').style.display = 'flex';

    Promise.all([
        // Fetch player data
        fetch('https://raw.githubusercontent.com/Tyler-widd/vbdb-data/refs/heads/master/data/vbdb_players.json')
            .then(response => {
                if (!response.ok) throw new Error('Player data fetch failed');
                return response.text();
            })
            .then(text => {
                const fixedText = text.replace(/: NaN,/g, ': null,').replace(/: NaN}/g, ': null}');
                return JSON.parse(fixedText);
            }),

        // Fetch team data  
        fetch('https://raw.githubusercontent.com/Tyler-widd/vbdb-data/refs/heads/master/data/vbdb_teams.json')
            .then(response => {
                if (!response.ok) throw new Error('Team data fetch failed');
                return response.json();
            })
    ])
        .then(([players, teams]) => {
            playerData = players;
            teamData = teams;

            console.log("Data loaded - Players:", playerData.length, "Teams:", teamData.length);

            initializeFilters();
            filterPlayers();

            document.getElementById('players-loader').style.display = 'none';
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('players-data-container').innerHTML = `
            <div class="no-data-message">
                <p>Error loading data. Please try again later.</p>
                <p>Error: ${error.message}</p>
                <p>Check the browser console for more details.</p>
            </div>
        `;
            document.getElementById('players-loader').style.display = 'none';
        });
}

// Initialize filters based on data
function initializeFilters() {
    const levels = new Set();
    const divisions = new Set();
    const conferences = new Set();
    const teams = new Set();
    const positions = new Set();
    const classes = new Set();
    const teamLevels = new Set();
    const teamDivisions = new Set();
    const teamConferences = new Set();

    // Store normalized positions for filtering
    window.normalizedPositions = new Map();

    teamData.forEach(team => {
        if (team.level) teamLevels.add(team.level);
        if (team.division) teamDivisions.add(team.division);
        if (team.conference) teamConferences.add(team.conference);
    });

    populateDropdown('team-level-filter', teamLevels);
    populateDropdown('team-division-filter', teamDivisions);
    populateDropdown('team-conference-filter', teamConferences);

    // Process player data to extract filter options
    playerData.forEach(player => {
        if (player.level) levels.add(player.level);
        if (player.division) divisions.add(player.division);
        if (player.conference) conferences.add(player.conference);
        if (player.team) teams.add(player.team);

        if (player.position) {
            const normalizedPos = normalizePosition(player.position);
            positions.add(normalizedPos);
            window.normalizedPositions.set(player.position, normalizedPos);
        }

        if (player.class_year) classes.add(player.class_year);
    });

    // Populate all filter dropdowns
    populateDropdown('player-level-filter', levels);
    populateDropdown('player-division-filter', divisions);
    populateDropdown('player-conference-filter', conferences);
    populateDropdown('player-team-filter', teams);
    populateDropdown('player-position-filter', positions);
    populateDropdown('player-class-filter', classes);

    populateDropdown('team-level-filter', levels);
    populateDropdown('team-division-filter', divisions);
    populateDropdown('team-conference-filter', conferences);

    populateDropdown('result-level-filter', levels);
    populateDropdown('result-division-filter', divisions);
    populateDropdown('result-conference-filter', conferences);
    populateDropdown('result-team-filter', teams);
}

// Populate dropdown with options
function populateDropdown(id, values) {
    const select = document.getElementById(id);
    const currentValue = select.value;

    // Clear all options except 'All'
    while (select.options.length > 1) {
        select.remove(1);
    }

    // Add new options
    const sortedValues = Array.from(values).sort();
    sortedValues.forEach(value => {
        if (value) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        }
    });

    // Restore selected value if it still exists
    if (currentValue !== 'all') {
        const exists = Array.from(select.options).some(option => option.value === currentValue);
        if (exists) {
            select.value = currentValue;
        } else {
            select.value = 'all';
        }
    }
}

// Generic function to sort tables
function sortTable(field, tableId, headerElement) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Get current sort direction
    let sortDirection = 'asc';

    // Toggle sort direction
    if (headerElement.classList.contains('sorted-asc')) {
        sortDirection = 'desc';
        headerElement.classList.remove('sorted-asc');
        headerElement.classList.add('sorted-desc');
    } else if (headerElement.classList.contains('sorted-desc')) {
        sortDirection = 'asc';
        headerElement.classList.remove('sorted-desc');
        headerElement.classList.add('sorted-asc');
    } else {
        // Reset all headers
        table.querySelectorAll('th').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
        });
        headerElement.classList.add('sorted-asc');
    }

    // Sort the rows
    rows.sort((a, b) => {
        let valueA = a.querySelector(`td:nth-child(${getColumnIndex(field, tableId)})`).textContent.trim();
        let valueB = b.querySelector(`td:nth-child(${getColumnIndex(field, tableId)})`).textContent.trim();

        // Handle numeric values
        if (!isNaN(valueA) && !isNaN(valueB)) {
            valueA = parseFloat(valueA);
            valueB = parseFloat(valueB);
        }

        // Handle empty values
        if (!valueA) return 1;
        if (!valueB) return -1;

        // Compare values
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Reorder the rows in the table
    rows.forEach(row => tbody.appendChild(row));
}

function getColumnIndex(field, tableId) {
    const headers = document.querySelectorAll(`#${tableId} th`);
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].getAttribute('data-sort') === field) {
            return i + 1; // +1 because CSS nth-child is 1-based
        }
    }
    return 1; // Default to first column
}

// Generate pagination controls HTML
function generatePaginationControls(totalPages) {
    // Generate page numbers
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
                    ${pageNumbersHtml}
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