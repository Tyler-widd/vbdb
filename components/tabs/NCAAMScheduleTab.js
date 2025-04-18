class NcaamScheduleTab extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.matchResults = [];
        this.isLoading = true;
        this.filteredResults = [];
        this.selectedTeam = 'all';
        this.selectedYear = new Date().getFullYear(); // Default to current year
        this.allTeams = []; // Will store all NCAA Men's teams
        this.availableYears = [2024, 2025]; // Default available years
        this.viewMode = 'card'; // 'card' or 'table'
        
        // Date range properties
        const today = new Date();
  
        // Start date: 10 days before today
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 5);
        this.startDate = startDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        // End date: 5 days after today
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 5);
        this.endDate = endDate.toISOString().split('T')[0]; 
        
        // Bind methods to preserve context
        this.toggleView = this.toggleView.bind(this);
        this.handleDateChange = this.handleDateChange.bind(this);
    }
    
    static get observedAttributes() {
      return ['league'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'league' && oldValue !== newValue) {
        this.loadData();
      }
    }
    
    async connectedCallback() {
      await this.loadTeams();
      await this.loadData();
    }
    
    async loadTeams() {
      try {
        // Load all NCAA Men's teams to populate the dropdown
        const response = await fetch('https://api.volleyballdatabased.com/api/ncaam_teams');
        if (!response.ok) {
          throw new Error('Failed to fetch NCAA Men\'s teams');
        }
        
        this.allTeams = await response.json();
      } catch (error) {
        console.error('Error loading NCAA Men\'s teams:', error);
        this.allTeams = [];
      }
    }
    
      async loadData() {
        this.isLoading = true;
        this.render(); // Show loading state
        
        const league = this.getAttribute('league');
        if (league === 'NCAA Men') {
          try {
            // First try to load the base results to get available years
            const baseResponse = await fetch('https://api.volleyballdatabased.com/api/ncaam_results');
            if (baseResponse.ok) {
              const baseData = await baseResponse.json();
              
              // Extract unique years from the results
              const years = [...new Set(baseData.map(match => match.year))].sort();
              if (years.length > 0) {
                this.availableYears = years;
                
                // Set selectedYear to the most recent year if it's not already set
                const latestYear = Math.max(...years.map(y => parseInt(y)));
                if (!this.selectedYear || this.availableYears.indexOf(this.selectedYear.toString()) === -1) {
                  this.selectedYear = latestYear;
                }
              }
            }
            
            // Load the results
            const endpoint = `https://api.volleyballdatabased.com/api/ncaam_results`;
            
            const response = await fetch(endpoint);
            if (!response.ok) {
              throw new Error(`Failed to fetch match results from ${endpoint}`);
            }
            
            let matchResults = await response.json();
            
            // Process each match to extract the location in parentheses
            matchResults = matchResults.map(match => {
              // Process the location to extract text between parentheses
              if (match.location) {
                const locationMatch = match.location.match(/\(([^)]+)\)/);
                if (locationMatch && locationMatch[1]) {
                  // Store the original location in full_location and update location to just the part in parentheses
                  match.full_location = match.location;
                  match.location = locationMatch[1].trim();
                }
              }
              return match;
            });
            
            this.matchResults = matchResults;
            
            // Filter by year
            this.matchResults = this.matchResults.filter(match => 
              match.year && match.year.toString() === this.selectedYear.toString()
            );
            
            // Apply filters
            this.applyFilters();
            
            // Sort by date (most recent first)
            this.sortMatchesByDate();
          } catch (error) {
            console.error('Error loading match results:', error);
            this.matchResults = [];
            this.filteredResults = [];
          }
          
          this.isLoading = false;
          this.render();
          this.setupEventListeners();
        } else {
          // For other leagues, just show a placeholder
          this.isLoading = false;
          this.render();
        }
      }
    
    // Apply all filters (year, team, and date range)
    applyFilters() {
        this.filteredResults = [...this.matchResults];
        
        // Apply team filter if not "all"
        if (this.selectedTeam !== 'all') {
          this.filteredResults = this.filteredResults.filter(match =>
            match.home_team_id === this.selectedTeam || match.away_team_id === this.selectedTeam
          );
        }
        
        // Apply date range filter if both dates are provided
        if (this.startDate && this.endDate) {
          const startDateTime = new Date(this.startDate).getTime();
          const endDateTime = new Date(this.endDate + 'T23:59:59').getTime(); // Include the full end date
          
          this.filteredResults = this.filteredResults.filter(match => {
            if (!match.date) return true;
            
            // Convert MM/DD/YYYY to Date object
            const [month, day, year] = match.date.split('/');
            const matchDate = new Date(`${year}-${month}-${day}`);
            const matchTime = matchDate.getTime();
            
            return matchTime >= startDateTime && matchTime <= endDateTime;
          });
        }
    }
    
    sortMatchesByDate() {
      this.filteredResults.sort((a, b) => {
        // Convert MM/DD/YYYY to Date objects for sorting
        const dateA = this.parseDate(a.date);
        const dateB = this.parseDate(b.date);
        
        // Sort in descending order (newest first)
        return dateB - dateA;
      });
    }
    
    parseDate(dateString) {
      // Handle MM/DD/YYYY format
      if (!dateString) return new Date(0);
      
      const [month, day, year] = dateString.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
    
    toggleView() {
      this.viewMode = this.viewMode === 'card' ? 'table' : 'card';
      this.render();
      this.setupEventListeners();
    }
    
    // Handle date filter changes
    handleDateChange() {
        const startDateInput = this.shadowRoot.querySelector('#start-date');
        const endDateInput = this.shadowRoot.querySelector('#end-date');
        
        this.startDate = startDateInput.value;
        this.endDate = endDateInput.value;
        
        // Apply the filters and re-render the results
        this.applyFilters();
        this.sortMatchesByDate();
        this.renderResults();
    }

    setupEventListeners() {
        // Match card click events
        const matchCards = this.shadowRoot.querySelectorAll('.match-card');
        matchCards.forEach(card => {
          card.addEventListener('click', () => {
            const url = card.getAttribute('data-url');
            if (url && url !== '#') {
              window.open(url, '_blank');
            }
          });
        });
        
        // Table row click events
        const tableRows = this.shadowRoot.querySelectorAll('tr.result-row');
        if (tableRows) {
          tableRows.forEach(row => {
            row.addEventListener('click', () => {
              const url = row.getAttribute('data-url');
              if (url && url !== '#') {
                window.open(url, '_blank');
              }
            });
          });
        }
        
        // Team filter change event
        const teamFilter = this.shadowRoot.querySelector('.team-filter');
        if (teamFilter) {
          teamFilter.addEventListener('change', (e) => {
            this.selectedTeam = e.target.value;
            this.applyFilters();
            this.sortMatchesByDate();
            this.renderResults();
          });
        }
        
        // Year selector change event
        const yearSelector = this.shadowRoot.querySelector('.year-selector');
        if (yearSelector) {
          yearSelector.addEventListener('change', (e) => {
            this.selectedYear = e.target.value;
            this.loadData(); // Reload data with the new year selection
          });
        }
        
        // View toggle event
        const viewToggle = this.shadowRoot.querySelector('.view-toggle');
        if (viewToggle) {
          // Remove any existing event listeners and add a fresh one
          viewToggle.removeEventListener('click', this.toggleView);
          viewToggle.addEventListener('click', this.toggleView);
        }
        
        // Date range input event listeners
        const startDateInput = this.shadowRoot.querySelector('#start-date');
        const endDateInput = this.shadowRoot.querySelector('#end-date');
        
        if (startDateInput) {
          startDateInput.addEventListener('change', this.handleDateChange);
        }
        
        if (endDateInput) {
          endDateInput.addEventListener('change', this.handleDateChange);
        }
        
        // Add event listeners for the action buttons
        const actionButtons = this.shadowRoot.querySelectorAll('.action-btn');
        if (actionButtons) {
          actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation(); // Prevent the match card click
              const url = btn.getAttribute('data-url');
              if (url && url !== '#') {
                window.open(url, '_blank');
              }
            });
          });
        }
        
        // Add click event listeners to table action links
        const tableActions = this.shadowRoot.querySelectorAll('.table-action');
        if (tableActions) {
          tableActions.forEach(action => {
            action.addEventListener('click', (e) => {
              e.stopPropagation(); // Prevent the row click event
            });
          });
        }
    }
    
    // Format date from MM/DD/YYYY to a more readable format
    formatDate(dateString, format = 'default') {
      if (!dateString) return '';
      
      try {
        // Convert MM/DD/YYYY to Date object
        const [month, day, year] = dateString.split('/');
        const date = new Date(`${year}-${month}-${day}`);
        
        // Different format for table view
        if (format === 'table') {
          // Format: MM-DD-YY
          const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
          const dayStr = date.getDate().toString().padStart(2, '0');
          const yearStr = date.getFullYear().toString().slice(-2); // Last 2 digits of year
          return `${monthStr}-${dayStr}-${yearStr}`;
        } else {
          // Default format: Day, Month DD
          return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'long', 
            day: 'numeric'
          });
        }
      } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
      }
    }
    
    // Parse and format the score
    formatScore(score) {
      if (!score) return '';
      
      // NCAA Men's score format is usually like "3-1 [19-25, 25-20, 25-18, 25-18]"
      return score;
    }
    
    getTeamOptions() {
      if (!this.allTeams || this.allTeams.length === 0) {
        return '<option value="all">All Teams</option>';
      }
      
      return `
        <option value="all">All Teams</option>
        ${this.allTeams.map(team => {
          // Extract team ID
          const teamId = team.team_id || team.id || '';
          return `<option value="${teamId}" ${teamId === this.selectedTeam ? 'selected' : ''}>${team.name}</option>`;
        }).join('')}
      `;
    }
    
    getYearOptions() {
      return this.availableYears.map(year => 
        `<option value="${year}" ${year.toString() === this.selectedYear.toString() ? 'selected' : ''}>${year}</option>`
      ).join('');
    }
    
    renderCardView() {
      return this.filteredResults.map(match => {
        const matchDate = this.formatDate(match.date);
        
        return `
          <div class="match-card" data-url="${match.box_score || '#'}">
            <div class="match-content">
              <div class="team-block home-team">
                <div class="team-logo">
                  ${match.away_team_img ? `<img src="${match.away_team_img}" alt="${match.away_team_name}">` : ''}
                </div>
                <div class="team-name">${match.away_team_name}</div>
              </div>
              
              <div class="match-details">
                <span class="vs-badge">VS</span>
                <div class="match-date">${matchDate}</div>
                <div class="match-score">${this.formatScore(match.score)}</div>
              </div>
              
              <div class="team-block away-team">
                <div class="team-name">${match.home_team_name}</div>
                <div class="team-logo">
                  ${match.home_team_img ? `<img src="${match.home_team_img}" alt="${match.home_team_name}">` : ''}
                </div>
              </div>
            </div>
            
            <div class="actions-container">
              ${match.box_score ? `
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
    
    renderTableView() {
        if (!this.filteredResults || this.filteredResults.length === 0) {
          return `<div class="no-results">No match results available for the selected team and year.</div>`;
        }
      
        return `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Location</th>
                <th>Away Team</th>
                <th>Home Team</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              ${this.filteredResults.map(match => {
                const matchDate = this.formatDate(match.date, 'table');
                
                // Create clickable score cell
                const scoreCell = match.box_score ? 
                  `<a href="${match.box_score}" target="_blank" class="score-link">${this.formatScore(match.score)}</a>` : 
                  this.formatScore(match.score);
                
                return `
                  <tr class="result-row">
                    <td>${matchDate}</td>
                    <td>${match.location}</td>
                    <td>
                      <div class="team-cell">
                        ${match.away_team_img ? `<img src="${match.away_team_img}" alt="${match.away_team_name}" class="table-team-logo">` : ''}
                        <span>${match.away_team_name}</span>
                      </div>
                    </td>
                    <td>
                      <div class="team-cell">
                        ${match.home_team_img ? `<img src="${match.home_team_img}" alt="${match.home_team_name}" class="table-team-logo">` : ''}
                        <span>${match.home_team_name}</span>
                      </div>
                    </td>
                    <td class="score-cell">${scoreCell}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    
    // Render just the results section
    renderResults() {
      const resultsContainer = this.shadowRoot.querySelector(this.viewMode === 'card' ? '.match-grid' : '.table-container-wrapper');
      
      if (!resultsContainer) return;
      
      if (this.viewMode === 'card') {
        resultsContainer.innerHTML = this.filteredResults && this.filteredResults.length > 0 ? 
          this.renderCardView() : 
          `<div class="no-results">No match results available for the selected filters.</div>`;
      } else {
        resultsContainer.innerHTML = this.renderTableView();
      }
      
      // Re-attach event listeners for the new content
      this.setupEventListeners();
    }
    
    render() {
      const league = this.getAttribute('league');
      
      if (this.isLoading) {
        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              width: 100%;
            }
            
            .loading {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 200px;
              color: var(--text, #e0e0e0);
            }
            
            .loading-spinner {
              display: inline-block;
              width: 30px;
              height: 30px;
              border: 3px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top-color: var(--accent, #5ca5c7);
              animation: spin 1s ease-in-out infinite;
              margin-right: 10px;
            }
            
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
          
          <div class="loading">
            <div class="loading-spinner"></div>
            <span>Loading match results...</span>
          </div>
        `;
        return;
      }
      
      // If league is not NCAA Men, show a placeholder
      if (league !== 'NCAA Men') {
        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
              width: 100%;
            }
            
            .content-card {
              background-color: var(--card-bg, #1e1e1e);
              border-radius: 12px;
              padding: 2rem;
              color: var(--text, #e0e0e0);
            }
            
            h2 {
              margin-top: 0;
              color: var(--accent, #5ca5c7);
              margin-bottom: 1rem;
            }
          </style>
          
        `;
        return;
      }
      
      // For NCAA Men, show match results
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            box-sizing: border-box;
            padding: 0 10px;
          }
  
          *, *::before, *::after {
            box-sizing: border-box;
          }
  
          .schedule-container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
          }
  
          h1 {
            color: var(--accent, #5ca5c7);
            text-align: center;
            margin-bottom: 20px;
            font-size: 1.8rem;
          }
  
          /* Filter container styling */
          .filter-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 20px;
          }
  
          .primary-filters {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
          }
  
          .filters-wrapper {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
          }
  
          .team-filter, .year-selector {
            padding: 10px 35px 10px 15px;
            border-radius: 5px;
            border: none;
            background-color: #2a2a2a;
            color: var(--text);
            min-width: 150px;
            appearance: none;
            position: relative;
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgb(159,159,159)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>");
            background-repeat: no-repeat;
            background-position: right 10px center;
          }
  
          .view-toggle {
            background-color: #2a2a2a;
            border: none;
            border-radius: 5px;
            color: var(--text-secondary, #aaaaaa);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px 12px;
            transition: all 0.2s ease;
          }
  
          .view-toggle:hover {
            background-color: #333;
            color: var(--accent, #5ca5c7);
          }
  
          .view-toggle svg {
            width: 24px;
            height: 24px;
          }
          
          /* Date range filter styles */
          .date-range-filter {
            display: flex;
            align-items: center;
            gap: 10px;
            background-color: #2a2a2a;
            border-radius: 5px;
            padding: 8px 12px;
          }
          .date-input-group {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .date-label {
            font-size: 0.85rem;
            color: var(--text-secondary, #aaaaaa);
            white-space: nowrap;
          }

          .date-input {
            padding: 6px 10px;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background-color: #333;
            color: var(--text);
            font-size: 0.9rem;
            width: 140px;
          }
          
          /* Match grid and cards */
          .match-grid {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 20px;
          }
  
          .match-card {
            background-color: var(--card-bg, #1e1e1e);
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
          }
  
          .match-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(to right, var(--accent, #7577cd), var(--accent-hover, #5ca5c7));
            transition: height 0.3s ease;
          }
  
          .match-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          }
  
          .match-card:hover::before {
            height: 6px;
          }
  
          /* Match content - uniform background */
          .match-content {
            display: flex;
            min-height: 100px;
            align-items: center;
            background-color: var(--card-bg, #1e1e1e);
          }
  
          /* Team blocks */
          .team-block {
            display: flex;
            align-items: center;
            flex: 1;
            padding: 15px;
          }
  
          .home-team {
            justify-content: flex-start;
          }
  
          .away-team {
            justify-content: flex-end;
            flex-direction: row;
          }
  
          /* Team logos */
          .team-logo {
            width: 60px;
            height: 60px;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
          }
  
          .home-team .team-logo {
            margin-right: 15px;
          }
  
          .away-team .team-logo {
            margin-left: 15px;
            margin-right: 0;
            order: 2;
          }
  
          .away-team .team-name {
            order: 1;
          }
  
          .team-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
  
          .team-name {
            font-weight: 600;
            color: var(--text, #e0e0e0);
          }
  
          /* Match details */
          .match-details {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 15px 20px;
            min-width: 180px;
          }
  
          .match-date, .match-location {
            font-size: 0.9rem;
            color: var(--text-secondary, #aaaaaa);
            margin-bottom: 4px;
            text-align: center;
          }
          
          .match-location {
            font-size: 0.8rem;
            font-style: italic;
            margin-bottom: 8px;
            white-space: normal;
            max-width: 200px;
            text-align: center;
          }
  
          .match-score {
            font-weight: 600;
            color: var(--text, #e0e0e0);
            text-align: center;
            line-height: 1.4;
            white-space: nowrap;
          }
  
          .vs-badge {
            background-color: var(--accent, #5ca5c7);
            color: white;
            font-size: 0.75rem;
            padding: 2px 6px;
            border-radius: 4px;
            margin-bottom: 5px;
          }
  
          /* Action buttons */
          .actions-container {
            display: flex;
            justify-content: center;
            gap: 15px;
            padding: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
  
          .action-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-secondary, #aaaaaa);
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            transition: color 0.2s ease;
          }
  
          .action-btn:hover {
            color: var(--accent, #5ca5c7);
          }
  
          .action-btn svg {
            width: 20px;
            height: 20px;
            margin-right: 5px;
          }
  
          .action-text {
            font-size: 0.8rem;
          }
  
          .no-results {
            background-color: var(--card-bg, #1e1e1e);
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            color: var(--text-secondary, #aaaaaa);
          }
          
          /* Results wrapper for better updating */
          .table-container-wrapper {
            width: 100%;
          }
          
          /* Table View Styles */
          .table-container {
            background-color: var(--card-bg, #1e1e1e);
            border-radius: 12px;
            overflow: hidden;
            margin-top: 20px;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
            max-height: 500px;
            overflow-y: auto;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            color: var(--text, #e0e0e0);
            position: relative;
          }
          
          thead::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(to right, var(--accent, #7577cd), var(--accent-hover, #5ca5c7));
            z-index: 11;
          }

          thead {
            position: sticky;
            top: 0;
            z-index: 10;
          }

          
          th {
            background-color: var(--card-bg, #1e1e1e);
            color: var(--accent, #5ca5c7);
            text-align: left;
            padding: 15px;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index:10;
          }

        th::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 1px;
            background-color: rgba(255, 255, 255, 0.1);
        }
          
          td {
            padding: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          
          tr.result-row {
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          tr.result-row:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }
          
          .team-cell {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .table-team-logo {
            width: 30px;
            height: 30px;
            object-fit: contain;
          }
          
          .actions-cell {
            width: 100px;
          }
          
          .table-actions {
            display: flex;
            gap: 10px;
          }
          
          .table-action {
            color: var(--text-secondary, #aaaaaa);
            transition: color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .table-action:hover {
            color: var(--accent, #5ca5c7);
          }
          
        .score-link {
        color: var(--text, #e0e0e0);
        text-decoration: none;
        transition: color 0.2s;
        display: block;
        font-weight: 600;
        }
        
        .score-link:hover {
            color: var(--accent, #5ca5c7);
            text-decoration: underline;
        }
        
        .score-cell {
            font-weight: 600;
        }

          .scoreboard-icon {
            width: 20px;
            height: 20px;
            display: inline-block;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(159,159,159)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='3' width='20' height='14' rx='2' ry='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg>");
          }
          
          /* Mobile responsiveness */
          @media (max-width: 768px) {
            .filter-container {
              justify-content: center;
            }
            
            .primary-filters {
              align-items: center;
              width: 100%;
            }
            
            .filters-wrapper {
              align-items: center;
              width: 100%;
            }
            
            .team-filter {
              width: 100%;
              max-width: 50px;
              padding: 12px 35px 12px 15px;
              font-size: 16px;
            }
            
            .view-toggle {
              margin-top: 0;
            }
            
            .date-range-filter {
              flex-wrap: wrap;
              justify-content: center;
              gap: 8px;
            }
            
            .date-input-group {
              min-width: 0;
              width: auto;
            }
            
            .date-input {
              width: 140px;
            }
            
            .match-content {
              padding: 8px 0;
              min-height: 80px;
            }
            
            .team-block {
              padding: 5px;
              justify-content: center;
            }
            
            .home-team {
              justify-content: flex-start;
            }
            
            .away-team {
              justify-content: flex-end;
            }
            
            .team-logo {
              width: 30px;
              height: 30px;
              min-width: 30px;
            }
            
            .home-team .team-logo {
              margin-right: 5px;
            }
            
            .away-team .team-logo {
              margin-left: 5px;
            }
            
            .team-name {
              font-size: 0.75rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 70px;
            }
            
            .match-details {
              padding: 5px;
              min-width: 80px;
              border: none;
            }
            
            .match-date, .match-location, .match-score {
              font-size: 0.7rem;
              margin-bottom: 4px;
            }
            
            .vs-badge {
              font-size: 0.65rem;
              padding: 1px 4px;
            }
            
            .actions-container {
              padding: 8px;
              gap: 10px;
            }
            
            .action-text {
              display: none;
            }
            
            /* Table view mobile styles */
            table {
              font-size: 0.85rem;
            }
            
            th, td {
              padding: 10px 5px;
            }
            
            .table-team-logo {
              width: 20px;
              height: 20px;
            }
            
            th:nth-child(2), td:nth-child(2) {
              display: none; /* Hide location column on mobile */
            }
            
            th:nth-child(6), td:nth-child(6) {
              display: none; /* Hide actions column on mobile */
            }
          }
          
          @media (max-width: 500px) {
            th:nth-child(1), td:nth-child(1) {
              white-space: nowrap;
              max-width: 80px;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .match-content {
              padding: 5px 0;
            }
            
            .team-name {
              max-width: 60px;
              font-size: 0.7rem;
            }
            
            .match-score {
              font-size: 0.7rem;
            }
            
            .team-logo {
              width: 25px;
              height: 25px;
              min-width: 25px;
            }
          }
        </style>
        
        <div class="schedule-container">
          <h1>NCAA Men's Schedule</h1>
          
          <div class="filter-container">
            <div class="primary-filters">
              <div class="filters-wrapper">
                <select class="team-filter">
                  ${this.getTeamOptions()}
                </select>

              <div class="date-input-group">
                <span class="date-label">From:</span>
                <input type="date" id="start-date" class="date-input" value="${this.startDate || ''}">
              </div>
              <div class="date-input-group">
                <span class="date-label">To:</span>
                <input type="date" id="end-date" class="date-input" value="${this.endDate || ''}">
              </div>
                          
              <button class="view-toggle" title="${this.viewMode === 'card' ? 'Switch to Table View' : 'Switch to Card View'}">
                ${this.viewMode === 'card' ? 
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>` : 
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>`
                }
              </button>
            </div>
          </div>
        </div>
          
          ${this.viewMode === 'card' ? 
            `<div class="match-grid">
              ${this.filteredResults && this.filteredResults.length > 0 ? 
                this.renderCardView() :
                `<div class="no-results">No match results available for the selected filters.</div>`
              }
            </div>` : 
            `<div class="table-container-wrapper">
              ${this.renderTableView()}
            </div>`
          }
        </div>
      `;
      
      // Setup event listeners
      this.setupEventListeners();
    }
  }
  
customElements.define('ncaam-schedule-tab', NcaamScheduleTab);