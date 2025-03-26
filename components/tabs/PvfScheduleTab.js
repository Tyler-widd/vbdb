class PvfScheduleTab extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.matchResults = [];
        this.isLoading = true;
        this.filteredResults = [];
        this.selectedTeam = 'all';
        this.selectedYear = new Date().getFullYear(); // Default to current year
        this.allTeams = []; // Will store all PVF teams
        this.availableYears = [2024, 2025]; // Default available years
        this.viewMode = 'card'; // 'card' or 'table'
        
        // New properties for date range (but no toggle)
        const today = new Date();
  
        // Start date: 10 days before today
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 10);
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
        // Load all PVF teams to populate the dropdown
        const response = await fetch('https://api.volleyballdatabased.com/api/pvf_teams');
        if (!response.ok) {
          throw new Error('Failed to fetch PVF teams');
        }
        
        this.allTeams = await response.json();
      } catch (error) {
        console.error('Error loading PVF teams:', error);
        this.allTeams = [];
      }
    }
    
    async loadData() {
      this.isLoading = true;
      this.render(); // Show loading state
      
      const league = this.getAttribute('league');
      if (league === 'PVF Pro') {
        try {
          // First try to load the base results to get available years
          const baseResponse = await fetch('https://api.volleyballdatabased.com/api/pvf_results');
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
          
          // Then load the results for the selected team and year
          let endpoint;
          if (this.selectedTeam === 'all') {
            endpoint = `https://api.volleyballdatabased.com/api/pvf_results`;
          } else {
            endpoint = `https://api.volleyballdatabased.com/api/pvf_results/${this.selectedTeam}/${this.selectedYear}`;
          }
              
          const response = await fetch(endpoint);
          if (!response.ok) {
            throw new Error(`Failed to fetch match results from ${endpoint}`);
          }
          
          this.matchResults = await response.json();
          
          // Filter by year if we got all results
          if (this.selectedTeam === 'all') {
            this.matchResults = this.matchResults.filter(match => 
              match.year && match.year.toString() === this.selectedYear.toString()
            );
          }
          
          // Apply date range filter if enabled
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
        
        // Apply date range filter if both dates are provided
        if (this.startDate && this.endDate) {
          const startDateTime = new Date(this.startDate).getTime();
          const endDateTime = new Date(this.endDate + 'T23:59:59').getTime(); // Include the full end date
          
          this.filteredResults = this.filteredResults.filter(match => {
            if (!match.date) return true;
            
            const matchTime = new Date(match.date).getTime();
            return matchTime >= startDateTime && matchTime <= endDateTime;
          });
        }
      }
    
    sortMatchesByDate() {
      this.filteredResults.sort((a, b) => {
        // Parse ISO dates and sort in descending order (newest first)
        return new Date(b.date) - new Date(a.date);
      });
    }
    
    toggleView() {
      console.log(`Toggling view from ${this.viewMode} to ${this.viewMode === 'card' ? 'table' : 'card'}`);
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
            this.loadData(); // Reload data with the new team selection
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
        
        // Add event listeners for the action icons
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
    
    // Format date from ISO to a more readable format
    formatDate(dateString, format = 'default') {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        
        // Different format for table view
        if (format === 'table') {
          // Format: MM-DD-YY
          const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
          const day = date.getDate().toString().padStart(2, '0');
          const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
          return `${month}-${day}-${year}`;
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
    
    // Format time from ISO date
    formatTime(dateString) {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        // Format: HH:MM AM/PM
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (error) {
        console.error('Error formatting time:', error);
        return '';
      }
    }
    
    // Parse and format the score
    formatScore(score) {
      if (!score) return '';
      
      // Handle formats like "OMA, 3-0"
      if (score.includes(',')) {
        const [winner, setsScore] = score.split(',');
        return `${setsScore.trim()}`;
      }
      
      return score;
    }
    
    getTeamOptions() {
      if (!this.allTeams || this.allTeams.length === 0) {
        return '<option value="all">All Teams</option>';
      }
      
      return `
        <option value="all">All Teams</option>
        ${this.allTeams.map(team => {
          // Extract team ID (we'll need this for the API)
          const teamId = team.id || team.team_id || team.name.toLowerCase().replace(/\s+/g, '-');
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
        const matchTime = this.formatTime(match.date);
        
        return `
          <div class="match-card" data-url="${match.scoreboard || '#'}">
            <div class="match-content">
              <div class="team-block home-team">
                <div class="team-logo">
                  ${match.home_team_img ? `<img src="${match.home_team_img}" alt="${match.home_team_name}">` : ''}
                </div>
                <div class="team-name">${match.home_team_name}</div>
              </div>
              
              <div class="match-details">
                <span class="vs-badge">VS</span>
                <div class="match-date">${matchDate}</div>
                <div class="match-score">${this.formatScore(match.score)}</div>
              </div>
              
              <div class="team-block away-team">
                <div class="team-name">${match.away_team_name}</div>
                <div class="team-logo">
                  ${match.away_team_img ? `<img src="${match.away_team_img}" alt="${match.away_team_name}">` : ''}
                </div>
              </div>
            </div>
            
            <div class="actions-container">
              ${match.video ? `
                <button class="action-btn" data-url="${match.video}" title="Watch Video">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgb(159,159,159)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                  <span class="action-text">Video</span>
                </button>
              ` : ''}
              
              ${match.scoreboard ? `
                <button class="action-btn" data-url="${match.scoreboard}" title="View Scoreboard">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgb(159,159,159)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span class="action-text">Scoreboard</span>
                </button>
              ` : ''}
              
              ${match.team_stats ? `
                <button class="action-btn" data-url="${match.team_stats}" title="View Team Stats">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgb(159,159,159)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                    <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
                  </svg>
                  <span class="action-text">Stats</span>
                </button>
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
                <th>Home Team</th>
                <th>Away Team</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.filteredResults.map(match => {
                const matchDate = this.formatDate(match.date, 'table');
                const actionLinks = [];
                
                if (match.video) {
                  actionLinks.push(`<a href="${match.video}" target="_blank" class="table-action" title="Watch Video"><i class="video-icon"></i></a>`);
                }
                if (match.scoreboard) {
                  actionLinks.push(`<a href="${match.scoreboard}" target="_blank" class="table-action" title="View Scoreboard"><i class="scoreboard-icon"></i></a>`);
                }
                if (match.team_stats) {
                  actionLinks.push(`<a href="${match.team_stats}" target="_blank" class="table-action" title="View Stats"><i class="stats-icon"></i></a>`);
                }
                
                return `
                  <tr class="result-row" data-url="${match.scoreboard || '#'}">
                    <td>${matchDate}</td>
                    <td>
                      <div class="team-cell">
                        ${match.home_team_img ? `<img src="${match.home_team_img}" alt="${match.home_team_name}" class="table-team-logo">` : ''}
                        <span>${match.home_team_name}</span>
                      </div>
                    </td>
                    <td>
                      <div class="team-cell">
                        ${match.away_team_img ? `<img src="${match.away_team_img}" alt="${match.away_team_name}" class="table-team-logo">` : ''}
                        <span>${match.away_team_name}</span>
                      </div>
                    </td>
                    <td>${this.formatScore(match.score)}</td>
                    <td class="actions-cell">
                      <div class="table-actions">
                        ${actionLinks.join('')}
                      </div>
                    </td>
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
      
      // If league is not PVF Pro, show a placeholder
      if (league !== 'PVF Pro') {
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
      
      // For PVF Pro, show match results
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
            min-width: 200px;
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

          
          .date-range-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-right: 10px;
          }
          
          .date-range-inputs {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            flex-grow: 1;
          }
          
          .date-input-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          
          .date-label {
            font-size: 0.85rem;
            color: var(--text-secondary, #aaaaaa);
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
          
          .date-input:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          /* Checkbox styling */
          .toggle-checkbox {
            position: absolute;
            opacity: 0;
            height: 0;
            width: 0;
          }
          
          .toggle-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            user-select: none;
            color: var(--text);
          }
          
          .toggle-switch {
            position: relative;
            display: inline-block;
            width: 36px;
            height: 20px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            margin-right: 10px;
            transition: background-color 0.2s;
          }
          
          .toggle-switch:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            border-radius: 50%;
            transition: transform 0.2s;
          }
          
          .toggle-checkbox:checked + .toggle-label .toggle-switch {
            background-color: var(--accent, #5ca5c7);
          }
          
          .toggle-checkbox:checked + .toggle-label .toggle-switch:before {
            transform: translateX(16px);
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
  
          .match-date, .match-time {
            font-size: 0.9rem;
            color: var(--text-secondary, #aaaaaa);
            margin-bottom: 4px;
            text-align: center;
          }
  
          .match-venue {
            font-size: 0.8rem;
            color: var(--text-secondary, #aaaaaa);
            margin-bottom: 8px;
            text-align: center;
            font-style: italic;
          }
  
          .match-score {
            font-weight: 600;
            color: var(--text, #e0e0e0);
            text-align: center;
            line-height: 1.4;
            white-space: nowrap;
          }
  
          .winner-badge {
            display: inline-block;
            background-color: var(--accent, #5ca5c7);
            color: white;
            font-size: 0.75rem;
            padding: 1px 4px;
            border-radius: 3px;
            margin-right: 5px;
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
  
          .vs-badge {
            background-color: var(--accent, #5ca5c7);
            color: white;
            font-size: 0.75rem;
            padding: 2px 6px;
            border-radius: 4px;
            margin-bottom: 5px;
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
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            color: var(--text, #e0e0e0);
          }
          
          table::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(to right, var(--accent, #7577cd), var(--accent-hover, #5ca5c7));
          }
          
          th {
            background-color: rgba(0, 0, 0, 0.2);
            color: var(--accent, #5ca5c7);
            text-align: left;
            padding: 15px;
            font-weight: 600;
            position: sticky;
            top: 0;
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
          
          .video-icon, .scoreboard-icon, .stats-icon {
            width: 20px;
            height: 20px;
            display: inline-block;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
          }
          
          .video-icon {
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(159,159,159)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='23 7 16 12 23 17 23 7'/><rect x='1' y='5' width='15' height='14' rx='2' ry='2'/></svg>");
          }
          
          .scoreboard-icon {
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(159,159,159)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='3' width='20' height='14' rx='2' ry='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg>");
          }
          
          .stats-icon {
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(159,159,159)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34'/><polygon points='18 2 22 6 12 16 8 16 8 12 18 2'/></svg>");
          }
          
          /* Mobile responsiveness */
          @media (max-width: 768px) {
            .filter-container {
              justify-content: center;
            }
            
            .primary-filters {
              flex-direction: column;
              align-items: center;
              width: 100%;
            }
            
            .filters-wrapper {
              flex-direction: column;
              align-items: center;
              width: 100%;
            }
            
            .team-filter, .year-selector {
              width: 100%;
              max-width: 300px;
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
    width: 120px;
  }
            
            /* UPDATED: Keep the same layout on mobile, just scale things down */
            .match-content {
              /* Remove the flex-direction: column to keep horizontal layout */
              padding: 8px 0;
              /* Keep row direction but reduce overall size */
              min-height: 80px;
            }
            
            .team-block {
              padding: 5px;
              /* Maintain correct alignment */
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
              /* Keep central position */
              border: none;
            }
            
            .match-date, .match-score {
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
            
            th:nth-child(5), td:nth-child(5) {
              display: none; /* Hide actions column on mobile */
            }
          }
          
          @media (max-width: 500px) {
            /* Adjust table for very small screens */
            th:nth-child(1), td:nth-child(1) {
              white-space: nowrap;
              max-width: 80px;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            /* Smaller elements for very small screens */
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
          <h1>PVF Pro Schedule</h1>
          
          <div class="filter-container">
            <div class="primary-filters">
              <div class="filters-wrapper">
                <select class="team-filter">
                  ${this.getTeamOptions()}
                </select>
                
    <input type="date" id="start-date" class="date-input" value="${this.startDate || ''}">
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
  
  customElements.define('pvf-schedule-tab', PvfScheduleTab);