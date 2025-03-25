class TeamDetail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.teamData = null;
    this.rosterData = null;
    this.resultsData = null;
    this.isLoadingRoster = false;
    this.isLoadingResults = false;
    this.hasRosterError = false;
    this.hasResultsError = false;
    this.activeTab = 'roster'; // Default tab
    
    // Sorting state
    this.sortColumn = 'name';  // Default sort by name
    this.sortDirection = 'asc'; // Default ascending
  }

  static get observedAttributes() {
    return ['level', 'team-name', 'team-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      
      // If team-id changed, fetch roster and results data
      if (name === 'team-id' && newValue) {
        this.fetchRosterData();
        
        // Only fetch results for LOVB teams
        if (this.getAttribute('level') === 'LOVB') {
          this.fetchResultsData();
        }
      }
    }
  }

  connectedCallback() {
    // Check if data is already loaded
    if (window.vbdbData && window.vbdbData.teamsData) {
      this.findTeamData();
      this.render();
      
      // Fetch roster data if team ID is available
      if (this.getAttribute('team-id')) {
        this.fetchRosterData();
        
        // Only fetch results for LOVB teams
        if (this.getAttribute('level') === 'LOVB') {
          this.fetchResultsData();
        }
      }
    } else {
      // If data isn't loaded yet, listen for the data-loaded event
      this.dataLoadedListener = this.handleDataLoaded.bind(this);
      document.addEventListener('teams-data-loaded', this.dataLoadedListener);
      
      // Also set up error handling
      this.dataErrorListener = this.handleDataError.bind(this);
      document.addEventListener('teams-data-error', this.dataErrorListener);
      
      // Initial render with loading state
      this.render();
    }
  }
  
  disconnectedCallback() {
    // Clean up event listeners when component is removed
    if (this.dataLoadedListener) {
      document.removeEventListener('teams-data-loaded', this.dataLoadedListener);
    }
    if (this.dataErrorListener) {
      document.removeEventListener('teams-data-error', this.dataErrorListener);
    }
  }
  
  handleDataLoaded(event) {
    // Data is now loaded
    this.findTeamData();
    this.render();
    
    // Fetch roster data if team ID is available
    if (this.getAttribute('team-id')) {
      this.fetchRosterData();
      
      // Only fetch results for LOVB teams
      if (this.getAttribute('level') === 'LOVB') {
        this.fetchResultsData();
      }
    }
    
    // Remove the listener since we no longer need it
    document.removeEventListener('teams-data-loaded', this.dataLoadedListener);
  }
  
  handleDataError(event) {
    console.error('Error loading team data:', event.detail.error);
    this.render(); // Render with error state
    
    // Remove the listener
    document.removeEventListener('teams-data-error', this.dataErrorListener);
  }

  // Method to fetch roster data based on team ID and level
  fetchRosterData() {
    const teamId = this.getAttribute('team-id');
    const level = this.getAttribute('level');
    
    if (!teamId || !level) {
      console.error("Missing team-id or level attribute for roster fetch");
      return;
    }
    
    // Set loading state
    this.isLoadingRoster = true;
    this.hasRosterError = false;
    this.rosterData = null;
    this.renderTabContent();
    
    // Determine API endpoint based on level
    let endpoint = '';
    
    // Map level to the correct API endpoint
    if (level === 'NCAA Women') {
      endpoint = `https://api.volleyballdatabased.com/api/ncaaw_players/${teamId}`;
    } else if (level === 'NCAA Men') {
      endpoint = `https://api.volleyballdatabased.com/api/ncaam_players/${teamId}`;
    } else if (level === 'PVF Pro') {
      endpoint = `https://api.volleyballdatabased.com/api/pvf_players/${teamId}`;
    } else if (level === 'LOVB') {
      endpoint = `https://api.volleyballdatabased.com/api/lovb_players/${teamId}`;
    } else {
      console.error(`Unsupported level for roster data: ${level}`);
      this.isLoadingRoster = false;
      this.hasRosterError = true;
      this.renderTabContent();
      return;
    }
    
    console.log(`Fetching roster data from: ${endpoint}`);
    
    // Fetch roster data
    fetch(endpoint)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        this.rosterData = data;
        this.isLoadingRoster = false;
        console.log(`Loaded roster data for ${teamId}:`, data);
        this.renderTabContent();
      })
      .catch(error => {
        console.error(`Error fetching roster data for ${teamId}:`, error);
        this.isLoadingRoster = false;
        this.hasRosterError = true;
        this.renderTabContent();
      });
  }
  
  // New method to fetch match results for a team
  fetchResultsData() {
    const teamId = this.getAttribute('team-id');
    const level = this.getAttribute('level');
    
    if (level !== 'LOVB' || !teamId) {
      return;
    }
    
    // Set loading state
    this.isLoadingResults = true;
    this.hasResultsError = false;
    this.resultsData = null;
    
    if (this.activeTab === 'results') {
      this.renderTabContent();
    }
    
    console.log(`Fetching match results for ${teamId}`);
    
    // Fetch all LOVB results and filter for this team
    fetch('https://api.volleyballdatabased.com/api/lovb_results')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Filter results for this team
        this.resultsData = data.filter(match => 
          match.home_team_id === teamId || match.away_team_id === teamId
        );
        
        // Sort by date (most recent first)
        this.resultsData.sort((a, b) => {
          // Simple string comparison for dates like "Wed, January 8th"
          return b.date.localeCompare(a.date);
        });
        
        this.isLoadingResults = false;
        console.log(`Loaded ${this.resultsData.length} match results for ${teamId}`);
        
        if (this.activeTab === 'results') {
          this.renderTabContent();
        }
      })
      .catch(error => {
        console.error(`Error fetching match results for ${teamId}:`, error);
        this.isLoadingResults = false;
        this.hasResultsError = true;
        
        if (this.activeTab === 'results') {
          this.renderTabContent();
        }
      });
  }
  
  // Method to sort data by column
  sortData(data, column, direction) {
    return [...data].sort((a, b) => {
      // Handle special cases for certain columns
      let valueA, valueB;
      
      // Get values based on column
      if (column === 'jersey') {
        // Sort jerseys as numbers when possible
        valueA = a.jersey ? parseInt(a.jersey) || a.jersey : '';
        valueB = b.jersey ? parseInt(b.jersey) || b.jersey : '';
      } else {
        valueA = a[column] || '';
        valueB = b[column] || '';
      }
      
      // Special handling for height column - convert to inches for sorting
      if (column === 'height') {
        valueA = this.heightToInches(valueA);
        valueB = this.heightToInches(valueB);
      }
      
      // Handle strings vs numbers
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        if (direction === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      } else {
        // Handle numeric comparison
        if (direction === 'asc') {
          return valueA - valueB;
        } else {
          return valueB - valueA;
        }
      }
    });
  }
  
  // Helper method to convert height string (e.g. "6'2\"") to inches for sorting
  heightToInches(heightStr) {
    if (!heightStr || typeof heightStr !== 'string') return 0;
    
    // Try to match the format X'Y" (feet and inches)
    const feetInchesRegex = /(\d+)'(\d+)"/;
    const match = heightStr.match(feetInchesRegex);
    
    if (match) {
      const feet = parseInt(match[1], 10);
      const inches = parseInt(match[2], 10);
      return (feet * 12) + inches;
    }
    
    // Try to match just inches
    const inchesRegex = /(\d+)"/;
    const inchesMatch = heightStr.match(inchesRegex);
    
    if (inchesMatch) {
      return parseInt(inchesMatch[1], 10);
    }
    
    // If no matches, return the original string for alphabetical sorting
    return heightStr;
  }
  
  // Handle sorting when header is clicked
  handleSortClick(column) {
    // If same column, toggle direction, otherwise set to asc
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Re-render the active tab with new sort
    this.renderTabContent();
  }
  
  // Setup column sort handlers
  setupSortListeners() {
    const headers = this.shadowRoot.querySelectorAll('th.sortable');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const column = header.getAttribute('data-column');
        this.handleSortClick(column);
      });
    });
  }
  
  // Setup tab navigation handlers
  setupTabListeners() {
    const tabLinks = this.shadowRoot.querySelectorAll('.tab-link');
    tabLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = link.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });
  }
  
  // Switch between tabs
  switchTab(tabName) {
    if (tabName === this.activeTab) return;
    
    this.activeTab = tabName;
    
    // Update the tab UI
    const tabLinks = this.shadowRoot.querySelectorAll('.tab-link');
    tabLinks.forEach(link => {
      const tab = link.getAttribute('data-tab');
      if (tab === tabName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Update the content
    this.renderTabContent();
  }
  
  // Render the active tab content
  renderTabContent() {
    if (this.activeTab === 'roster') {
      this.renderRosterTab();
    } else if (this.activeTab === 'results') {
      this.renderResultsTab();
    }
  }
  
  // Format score for display
  formatScore(scoreText) {
    if (!scoreText) return '';
    
    const parts = scoreText.split(' ');
    if (parts.length < 2) return scoreText;
    
    const setsScore = parts[0];
    const detailedScore = parts.slice(1).join(' ');
    
    if (detailedScore.startsWith('[') && detailedScore.endsWith(']')) {
      const scoresInside = detailedScore.substring(1, detailedScore.length - 1);
      const sets = scoresInside.split(', ');
      
      if (sets.length > 2) {
        const firstPart = sets.slice(0, 2).join(', ');
        const secondPart = sets.slice(2).join(', ');
        return `${setsScore} [<span class="score-first-part">${firstPart}</span>, <span class="score-second-part">${secondPart}</span>]`;
      }
    }
    
    return scoreText;
  }
  
  // Remove "LOVB " prefix from team names
  removeLeaguePrefix(teamName) {
    return teamName.replace(/^LOVB /, '');
  }
  
  // Render just the roster tab
  renderRosterTab() {
    const tabContentContainer = this.shadowRoot.querySelector('.tab-content-container');
    if (!tabContentContainer) return;
    
    if (this.isLoadingRoster) {
      tabContentContainer.innerHTML = `
        <div class="loading-message">
          <div class="loading-spinner"></div>
          <p>Loading team roster...</p>
        </div>
      `;
      return;
    }
    
    if (this.hasRosterError) {
      tabContentContainer.innerHTML = `
        <div class="error-message">
          <p>Unable to load roster data. Please try again later.</p>
        </div>
      `;
      return;
    }
    
    if (!this.rosterData || this.rosterData.length === 0) {
      tabContentContainer.innerHTML = `
        <div class="empty-message">
          <p>No roster data available for this team.</p>
        </div>
      `;
      return;
    }
    
    // Sort the data
    const sortedData = this.sortData(this.rosterData, this.sortColumn, this.sortDirection);
    
    // Render the roster table
    tabContentContainer.innerHTML = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="name-col sortable ${this.sortColumn === 'name' ? `sort-${this.sortDirection}` : ''}" data-column="name">Name</th>
              <th class="position-col sortable ${this.sortColumn === 'position' ? `sort-${this.sortDirection}` : ''}" data-column="position">Position</th>
              <th class="year-col sortable ${this.sortColumn === 'year' ? `sort-${this.sortDirection}` : ''}" data-column="year">Year</th>
              <th class="height-col sortable ${this.sortColumn === 'height' ? `sort-${this.sortDirection}` : ''}" data-column="height">Height</th>
              <th class="hometown-col sortable ${this.sortColumn === 'hometown' ? `sort-${this.sortDirection}` : ''}" data-column="hometown">Hometown</th>
            </tr>
          </thead>
          <tbody>
            ${sortedData.map(player => `
              <tr>
                <td>
                <div class="player-name">
                  ${player.profile_url ? 
                    `<a href="${player.profile_url}" target="_blank" class="player-link" title="View ${player.name}'s profile">
                      ${player.jersey ? player.jersey + ' - ' : ''}${player.name}
                    </a>` : 
                    `${player.jersey ? player.jersey + ' - ' : ''}${player.name}`
                  }
                </div>
                </td>
                <td>${player.position || '-'}</td>
                <td>${player.class_year || '-'}</td>
                <td>${player.height || '-'}</td>
                <td>${player.hometown || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // Set up sort event listeners
    this.setupSortListeners();
  }
  
  // Render the results tab
  renderResultsTab() {
    const tabContentContainer = this.shadowRoot.querySelector('.tab-content-container');
    if (!tabContentContainer) return;
    
    // Show loading state
    if (this.isLoadingResults) {
      tabContentContainer.innerHTML = `
        <div class="loading-message">
          <div class="loading-spinner"></div>
          <p>Loading match results...</p>
        </div>
      `;
      return;
    }
    
    // Show error state
    if (this.hasResultsError) {
      tabContentContainer.innerHTML = `
        <div class="error-message">
          <p>Unable to load match results. Please try again later.</p>
        </div>
      `;
      return;
    }
    
    // Show empty state
    if (!this.resultsData || this.resultsData.length === 0) {
      tabContentContainer.innerHTML = `
        <div class="empty-message">
          <p>No match results available for this team.</p>
        </div>
      `;
      return;
    }
    
    const teamId = this.getAttribute('team-id');
    
    // Render the results table
    tabContentContainer.innerHTML = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="date-col">Date</th>
              <th class="location-col">Location</th>
              <th class="opponent-col">Opponent</th>
              <th class="score-col">Score</th>
              <th class="result-col">Result</th>
            </tr>
          </thead>
          <tbody>
            ${this.resultsData.map(match => {
              const isHome = match.home_team_id === teamId;
              const opponent = isHome ? 
                this.removeLeaguePrefix(match.away_team_name) : 
                this.removeLeaguePrefix(match.home_team_name);
              
              // Determine win/loss
              const scoreParts = match.score.split(' ')[0].split('-');
              const homeScore = parseInt(scoreParts[0], 10);
              const awayScore = parseInt(scoreParts[1], 10);
              
              let result = '';
              if (isHome) {
                result = homeScore > awayScore ? 'Win' : 'Loss';
              } else {
                result = awayScore > homeScore ? 'Win' : 'Loss';
              }
              
              const resultClass = result === 'Win' ? 'win-result' : 'loss-result';
              
              return `
                <tr data-url="${match.match_url}" class="result-row">
                  <td>${match.date}</td>
                  <td>${isHome ? 'Home' : 'Away'}</td>
                  <td>${opponent}</td>
                  <td class="score-cell">${this.formatScore(match.score)}</td>
                  <td class="${resultClass}">${result}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // Add click listeners to the rows
    const resultRows = tabContentContainer.querySelectorAll('.result-row');
    resultRows.forEach(row => {
      row.addEventListener('click', () => {
        const url = row.getAttribute('data-url');
        if (url) {
          window.open(url, '_blank');
        }
      });
    });
  }

  // Updated findTeamData method that prioritizes team-id
  findTeamData() {
    const teamName = this.getAttribute('team-name');
    const teamId = this.getAttribute('team-id');
    const level = this.getAttribute('level');
    
    console.log(`Finding team data for: ID="${teamId}", name="${teamName}" in level: "${level}"`);
    
    if (!level) {
      console.error("Missing level attribute");
      return;
    }
    
    if (!teamId && !teamName) {
      console.error("Missing both team-id and team-name attributes");
      return;
    }
    
    if (!window.vbdbData || !window.vbdbData.teamsData) {
      console.error("No vbdbData available");
      return;
    }
    
    // Log available levels
    const availableLevels = Object.keys(window.vbdbData.teamsData);
    console.log("Available levels in data:", availableLevels);
    
    // Try different casing/formats of the level name
    const levelVariants = [
      level,
      level.toUpperCase(),
      level.toLowerCase(),
      level.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    ];
    
    // Try to find teams using any of the level variants
    let teams = null;
    let usedLevel = null;
    
    for (const levelVariant of levelVariants) {
      if (window.vbdbData.teamsData[levelVariant] && window.vbdbData.teamsData[levelVariant].length > 0) {
        console.log(`Found teams using level key: "${levelVariant}"`);
        teams = window.vbdbData.teamsData[levelVariant];
        usedLevel = levelVariant;
        break;
      }
    }
    
    if (!teams || teams.length === 0) {
      console.error(`No teams found for any variant of level "${level}". Available levels:`, availableLevels);
      
      // Search across all teams
      const allTeams = [];
      for (const key of availableLevels) {
        if (Array.isArray(window.vbdbData.teamsData[key])) {
          allTeams.push(...window.vbdbData.teamsData[key]);
        }
      }
      
      // First try by ID if we have it
      if (teamId) {
        this.teamData = allTeams.find(team => 
          team.id === teamId || 
          team.team_id === teamId ||
          (team.id && team.id.toString() === teamId) ||
          (team.team_id && team.team_id.toString() === teamId)
        );
        
        if (this.teamData) {
          console.log(`Found team "${this.teamData.name}" with ID "${teamId}" in a different level: ${this.teamData.level || this.teamData.league || 'unknown'}`);
          return;
        }
      }
      
      // If ID search failed, try by name
      if (teamName) {
        this.teamData = allTeams.find(team => 
          team.name === teamName || 
          team.name.toLowerCase() === teamName.toLowerCase()
        );
        
        if (this.teamData) {
          console.log(`Found team "${this.teamData.name}" by name in a different level: ${this.teamData.level || 'unknown'}`);
          return;
        }
      }
      
      console.error(`Team not found with ID "${teamId}" or name "${teamName}" in any level.`);
      return;
    }
    
    console.log(`Found ${teams.length} teams in level: ${usedLevel}`);
    
    // First priority: find by ID if we have it
    if (teamId) {
      this.teamData = teams.find(team => 
        team.id === teamId || 
        team.team_id === teamId ||
        (team.id && team.id.toString() === teamId) ||
        (team.team_id && team.team_id.toString() === teamId)
      );
      
      if (this.teamData) {
        console.log(`Found team with ID "${teamId}": "${this.teamData.name}"`);
        return;
      }
      console.warn(`Team with ID "${teamId}" not found, falling back to name search`);
    }
    
    // Second priority: find by name
    if (teamName) {
      // Try exact match first
      this.teamData = teams.find(team => team.name === teamName);
      
      if (this.teamData) {
        console.log(`Found team with exact name match: ${this.teamData.name}`);
        return;
      }
      
      // Try case-insensitive match
      this.teamData = teams.find(team => 
        team.name.toLowerCase() === teamName.toLowerCase()
      );
      
      if (this.teamData) {
        console.log(`Found team with case-insensitive name match: ${this.teamData.name}`);
        return;
      }
      
      // Try normalized match (removing special chars)
      const normalizedName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
      this.teamData = teams.find(team => {
        const normalizedTeamName = team.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedTeamName === normalizedName;
      });
      
      if (this.teamData) {
        console.log(`Found team with normalized name match: ${this.teamData.name}`);
        return;
      }
    }
    
    // Still not found
    console.error(`Team not found with ID "${teamId}" or name "${teamName}" in ${usedLevel}`);
  }

  render() {
    const teamName = this.getAttribute('team-name')?.replace(/-/g, ' ');
    const teamId = this.getAttribute('team-id');
    const level = this.getAttribute('level');
    
    if (!level) {
      this.shadowRoot.innerHTML = '<p>Error: Missing level attribute</p>';
      return;
    }
    
    if (!teamId && !teamName) {
      this.shadowRoot.innerHTML = '<p>Error: Missing both team-id and team-name attributes</p>';
      return;
    }
    
    // If global data isn't available yet, show loading state
    if (!window.vbdbData || !window.vbdbData.teamsData) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
          }
          
          .loading-message {
            background-color: var(--card-bg, #1e1e1e);
            border-radius: 10px;
            padding: 1.5rem;
            text-align: center;
            color: var(--text, #e0e0e0);
          }
        </style>
        <h2>Team Information</h2>
        <div class="loading-message">Loading team data...</div>
      `;
      return;
    }
    
    // Display team image if available, otherwise show placeholder
    let teamImageHTML = '<div class="team-image-placeholder"></div>';
    if (this.teamData && this.teamData.img) {
      // Check if the image data is an SVG string (starts with <svg)
      if (this.teamData.img.includes('<svg')) {
        // Decode the HTML entities in the SVG string
        const decodedSvg = this.teamData.img
          .replace(/\\u003C/g, '<')
          .replace(/\\u003E/g, '>')
          .replace(/\\"/g, '"');
        
        // Use the SVG directly in the HTML
        teamImageHTML = `<div class="svg-container">${decodedSvg}</div>`;
      } else {
        // Regular image URL
        teamImageHTML = `<img src="${this.teamData.img}" alt="${this.teamData.name}" class="team-image">`;
      }
    }
    
    // Check if team is LOVB or PVF to determine display format
    const isProfessionalLeague = this.teamData && 
      (this.teamData.conference === 'LOVB' || this.teamData.conference === 'PVF' || 
       level === 'LOVB' || level === 'PVF Pro');
    
    // Determine which tabs to show based on league
    const showResultsTab = level === 'LOVB';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        .team-info-card {
          background-color: var(--card-bg, #1e1e1e);
          border-radius: 10px;
          padding: 1.5rem;
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .team-image-container {
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          overflow: hidden;
          background-color: #2a2a2a;
        }
        
        .team-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .svg-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .svg-container svg {
          width: 80%;
          height: 80%;
          color: var(--text, #e0e0e0); /* For SVGs using currentColor */
        }
        
        .team-image-placeholder {
          width: 100%;
          height: 100%;
          background-color: #2a2a2a;
          animation: pulse 1.5s infinite;
        }
        
        .team-info {
          flex: 1;
        }
        
        .team-name {
          font-size: 1.8rem;
          margin-top: 0;
          margin-bottom: 1rem;
          color: var(--text, #e0e0e0);
        }
        
        .team-meta {
          color: var(--text-secondary, #aaaaaa);
          margin-bottom: 0.5rem;
        }
        
        .team-id {
          font-family: monospace;
          background-color: rgba(0,0,0,0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .team-url {
          color: var(--accent, #5ca5c7);
          text-decoration: none;
        }
        
        /* Tab Navigation */
        .tabs-container {
          margin-top: 2rem;
        }
        
        .tabs-nav {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 1rem;
        }
        
        .tab-link {
          padding: 0.8rem 1.5rem;
          color: var(--text-secondary, #aaaaaa);
          text-decoration: none;
          position: relative;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .tab-link.active {
          color: var(--accent, #5ca5c7);
        }
        
        .tab-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--accent, #5ca5c7);
        }
        
        .tab-link:hover:not(.active) {
          color: var(--text, #e0e0e0);
        }
        
        .tab-content-container {
          background-color: var(--card-bg, #1e1e1e);
          border-radius: 10px;
          margin-bottom: 2rem;
          overflow-x: auto;
        }
        
        /* Table styles */
        .table-container {
          background-color: var(--card-bg, #1e1e1e);
          color: var(--text, #e0e0e0);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
        }
        
        table {
          width: 100%;
          min-width: 700px;
          border-collapse: collapse;
          border-radius: 8px;
          overflow: hidden;
          table-layout: fixed;
          position: relative;
        }
        
        table::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(to right, var(--accent, #7577cd), var(--accent-hover, #5ca5c7));
          transition: height 0.3s ease;
          z-index: 1; /* Ensure it appears above the table content */
        }

        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* Column widths for roster */
        .name-col {
          width: 40%;
        }
        
        .position-col {
          width: 10%;
        }
        
        .height-col {
          width: 10%;
        }
        
        .hometown-col {
          width: 30%;
        }
        
        .year-col {
          width: 10%;
        }
        
        /* Column widths for results */
        .date-col {
          width: 20%;
        }
        
        .location-col {
          width: 10%;
        }
        
        .opponent-col {
          width: 30%;
        }
        
        .score-col {
          width: 25%;
        }
        
        .result-col {
          width: 15%;
        }
        
        th {
          background-color: rgba(0, 0, 0, 0.2);
          font-weight: 600;
          color: var(--text-secondary, #5ca5c7);
          position: relative;
        }
        
        th.sortable {
          cursor: pointer;
          user-select: none;
        }
        
        th.sortable:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
        
        th.sort-asc::after {
          content: '▲';
          display: inline-block;
          margin-left: 5px;
          font-size: 0.7rem;
          vertical-align: middle;
        }
        
        th.sort-desc::after {
          content: '▼';
          display: inline-block;
          margin-left: 5px;
          font-size: 0.7rem;
          vertical-align: middle;
        }
        
        tbody tr:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .result-row {
          cursor: pointer;
        }
        
        .win-result {
          color: #4caf50;
          font-weight: 600;
        }
        
        .loss-result {
          color: #f44336;
          font-weight: 600;
        }
        
        .score-cell {
          font-weight: 600;
        }
        
        td.text-center {
          text-align: start;
        }
        
        .player-name {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        /* Player link styling */
        .player-link {
          color: var(--accent, #5ca5c7);
          text-decoration: none;
          transition: color 0.2s, text-decoration 0.2s;
        }
        
        .player-link:hover {
          color: var(--accent-hover, #7577cd);
          text-decoration: underline;
        }
        
        .loading-message, .error-message, .empty-message {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary, #aaaaaa);
        }
        
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: var(--accent, #5ca5c7);
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }
        
        /* Score formatting - no line breaks on desktop */
        .score-first-part, .score-second-part {
          display: inline !important;
        }
        
        .score-first-part::after {
          content: none !important;
          display: none !important;
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.8; }
          100% { opacity: 0.6; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .team-info-card {
            flex-direction: column;
          }
          
          .team-image-container {
            width: 100%;
            height: 150px;
          }
          
          .tabs-nav {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .tab-link {
            padding: 0.8rem 1rem;
            white-space: nowrap;
          }
          
          /* Apply line breaks on mobile */
          .score-first-part::after {
            content: "" !important;
            display: block !important;
          }
          
          .score-second-part {
            display: inline-block !important;
          }
        }
      </style>

      <h2>Team Information</h2>
      <div class="team-info-card">
        <div class="team-image-container">
          ${teamImageHTML}
        </div>
        <div class="team-info">
          <h3 class="team-name">${this.teamData?.name || teamName}</h3>
          ${this.teamData ? `
            ${isProfessionalLeague ? 
              `<p class="team-meta"><strong>League:</strong> ${this.teamData.conference || (level === 'LOVB' ? 'LOVB' : 'PVF')}</p>` : 
              `<p class="team-meta"><strong>Conference:</strong> ${this.teamData.conference || 'N/A'}</p>
               <p class="team-meta"><strong>Division:</strong> ${this.teamData.division || 'N/A'}</p>`
            }
            ${this.teamData.url ? `<p class="team-meta"><strong>Website:</strong> <a href="${this.teamData.url.startsWith('http') ? this.teamData.url : 'https://' + this.teamData.url}" target="_blank" class="team-url">${this.teamData.url}</a></p>` : ''}
            <p class="team-meta"><strong>Team ID:</strong> <span class="team-id">${teamId}</span></p>
          ` : '<p class="team-meta">Team details not found</p>'}
        </div>
      </div>
      
      <div class="tabs-container">
        <div class="tabs-nav">
          <a class="tab-link ${this.activeTab === 'roster' ? 'active' : ''}" data-tab="roster">Roster</a>
          ${showResultsTab ? `<a class="tab-link ${this.activeTab === 'results' ? 'active' : ''}" data-tab="results">Results</a>` : ''}
        </div>
        <div class="tab-content-container">
          <!-- Tab content will be rendered here by the renderTabContent method -->
        </div>
      </div>
    `;
    
    // Set up tab navigation
    this.setupTabListeners();
    
    // Render the active tab content
    this.renderTabContent();
  }
}

customElements.define('team-detail', TeamDetail);