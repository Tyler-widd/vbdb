// Add CSS for pagination styling
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .pagination-info {
            color: var(--text-secondary);
            font-size: 0.9rem;
            text-align: right;
        }

        .pagination-controls .page-link {
            background-color: var(--card-bg);
            border-color: var(--input-border);
            color: var(--text);
        }

        .pagination-controls .page-link:hover {
            background-color: var(--input-bg);
            color: var(--accent);
        }

        .pagination-controls .page-item.active .page-link {
            background-color: var(--accent);
            border-color: var(--accent);
            color: white;
        }

        .pagination-controls .page-item.disabled .page-link {
            background-color: var(--card-bg);
            border-color: var(--input-border);
            color: var(--text-secondary);
            opacity: 0.5;
        }
    </style>
`);

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Fetch data
    fetchData();

    // Handle league card clicks
    document.querySelectorAll('.league-card').forEach(card => {
        card.addEventListener('click', function () {
            const level = this.getAttribute('data-level');

            // Switch to players tab and set level filter
            document.getElementById('players-tab').click();
            const levelSelect = document.getElementById('player-level-filter');

            // Find the option with the matching text and select it
            Array.from(levelSelect.options).forEach(option => {
                if (option.text === level) {
                    option.selected = true;
                    levelSelect.dispatchEvent(new Event('change'));
                }
            });
        });
    });

    // Handle logo click
    document.getElementById('logo-link').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('home-tab').click();
    });

    // Player filter events
    document.getElementById('player-level-filter').addEventListener('change', function () {
        updateDependentDropdowns('player');
        filterPlayers();
    });

    document.getElementById('player-division-filter').addEventListener('change', function () {
        updateDependentConferenceTeam('player');
        filterPlayers();
    });

    document.getElementById('player-conference-filter').addEventListener('change', function () {
        updateDependentTeam('player');
        filterPlayers();
    });

    document.getElementById('player-team-filter').addEventListener('change', filterPlayers);
    document.getElementById('player-position-filter').addEventListener('change', filterPlayers);
    document.getElementById('player-class-filter').addEventListener('change', filterPlayers);

    // Team filter events
    document.getElementById('team-level-filter').addEventListener('change', function () {
        updateTeamDependentDropdowns('team');
        filterTeams();
    });

    document.getElementById('team-division-filter').addEventListener('change', function () {
        updateTeamDependentConference('team');
        filterTeams();
    });

    document.getElementById('team-conference-filter').addEventListener('change', filterTeams);

    // Results filter events
    document.getElementById('result-level-filter').addEventListener('change', function () {
        updateDependentDropdowns('result');
        filterResults();
    });

    document.getElementById('result-division-filter').addEventListener('change', function () {
        updateDependentConferenceTeam('result');
        filterResults();
    });

    document.getElementById('result-conference-filter').addEventListener('change', function () {
        updateDependentTeam('result');
        filterResults();
    });

    document.getElementById('result-team-filter').addEventListener('change', filterResults);

    document.getElementById('teams-tab').addEventListener('click', filterTeams);
    document.getElementById('players-tab').addEventListener('click', filterPlayers);
    document.getElementById('results-tab').addEventListener('click', filterResults);
});