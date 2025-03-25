class ViewManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // Handle redirect from 404 page
    this.pendingRedirect = sessionStorage.getItem('redirectPath');
    if (this.pendingRedirect) {
      sessionStorage.removeItem('redirectPath');
    }
    this.activeLeague = null;
    this.activeTab = 'overview'; // Default tab
    this.activeTeam = null; // For team detail view

    // Define league icons directly in the component
    this.leagueIcons = {
      'NCAA Women': 'https://www.ncaa.com/modules/custom/casablanca_core/img/sportbanners/volleyball-women.png',
      'NCAA Men': 'https://www.ncaa.com/modules/custom/casablanca_core/img/sportbanners/volleyball-men.svg',
      'LOVB': null,  // Special handling for SVG
      'PVF Pro': 'https://provolleyball.com/dist/assets/logo.afbb3762.png'
    };

    // LOVB SVG as a string
    this.lovbSvg = `
    <svg fill="currentColor" height="100px" viewBox="0 0 127 40" width="100px" xmlns="http://www.w3.org/2000/svg">
      <path d="M37.0675 34.7316C30.1366 34.7316 25.2069 29.122 25.2069 21.9511C25.2069 14.8292 30.1366 9.17067 37.0675 9.17067C43.9985 9.17067 48.9771 14.8292 48.9771 21.9511C48.9771 29.122 43.7057 34.7316 37.0675 34.7316ZM37.0675 3.90255C26.5736 3.90255 19.5449 11.9024 19.5449 21.9511C19.5449 32.0001 26.5736 40 37.0675 40C47.5616 40 54.639 32.0001 54.639 21.9511C54.639 12.0487 47.5616 3.90255 37.0675 3.90255Z"></path>
      <path d="M70.8645 32.4878H70.7669L60.9561 4.39027H54.6597L68.0823 39.5122H73.5002L86.9228 4.39027H80.8704L70.8645 32.4878Z"></path>
      <path d="M5.46671 4.33233H0V39.5122H15.4427L20.6498 34.3413H5.46671V4.33233Z"></path>
      <path d="M109.812 29.9972L105.396 34.3901H96.1088V23.7072H101.01L105.396 19.3171H109.585C113.246 19.3171 115.296 21.4634 115.296 24.6341C115.296 27.7866 113.331 29.9101 109.812 29.9972ZM96.1088 9.51204H101.004L105.396 5.12188H109.293C112.319 5.12188 114.271 6.92683 114.271 9.65856C114.271 12.2874 112.657 14.044 109.799 14.2278L105.396 18.634H96.1088V9.51204ZM115.345 16.8293V16.7317C115.98 16.4878 119.933 13.9999 119.933 9.12195C119.933 3.65857 115.735 -7.62939e-06 110.122 -7.62939e-06H109.78L105.396 4.39029H90.6421V39.5121H101.001L105.396 35.1219H110.318C116.419 35.1219 120.958 31.0731 120.958 25.1219C120.958 20.0487 117.297 17.5121 115.345 16.8293Z"></path>
      <path d="M124.102 5.66608V5.02446H124.526C124.76 5.02446 124.888 5.13839 124.888 5.34531C124.888 5.55511 124.763 5.66608 124.526 5.66608H124.102ZM125.268 5.34531C125.268 4.92908 124.978 4.67054 124.511 4.67054H123.727V6.96912H124.102V6.02007H124.346L124.924 6.96912H125.359L124.739 5.99935C125.076 5.92518 125.268 5.68933 125.268 5.34531Z"></path>
      <path d="M124.485 7.38385C123.622 7.38385 122.92 6.68225 122.92 5.81988C122.92 4.95758 123.622 4.25598 124.485 4.25598C125.348 4.25598 126.05 4.95758 126.05 5.81988C126.05 6.68225 125.348 7.38385 124.485 7.38385ZM124.485 3.87621C123.412 3.87621 122.54 4.74814 122.54 5.81988C122.54 6.89163 123.412 7.76355 124.485 7.76355C125.557 7.76355 126.43 6.89163 126.43 5.81988C126.43 4.74814 125.557 3.87621 124.485 3.87621Z"></path>
    </svg>
    `;
    
    // Track active tab components to manage state
    this.activeTabComponents = {};
  }

  connectedCallback() {
    // Set up initial structure with home view always present
    this.render();

    this.initializeHashRouting();

    // Listen for league selection events
    document.addEventListener('league-selected', this.handleLeagueSelected.bind(this));

    // Listen for team selection events
    document.addEventListener('team-selected', this.handleTeamSelected.bind(this));

    // Set up history state handling
    window.addEventListener('popstate', (event) => {
      if (event.state) {
        if (event.state.teamName) {
          // Team detail view
          this.showTeamDetail(event.state.league, event.state.teamName, event.state.teamId, false);
        } else if (event.state.league) {
          // League view
          this.showLeagueContent(event.state.league, event.state.tab || 'overview', false);
        } else {
          // Home view
          this.hideLeagueContent(false);
        }
      } else {
        this.hideLeagueContent(false);
      }
    });

    // Handle any pending redirect after a short delay to ensure data is loaded
    if (this.pendingRedirect) {
      setTimeout(() => {
        this.handlePathRoute(this.pendingRedirect);
      }, 500);
    }
  }

  initializeHashRouting() {
    // Handle hash changes (both initial load and when hash changes)
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/')) {
        // Remove the #/ prefix to get the path
        const path = hash.substring(2);
        
        // Wait for data to load before handling the route
        this.waitForDataToLoadWithRetry(() => {
          this.handlePathRoute(path);
        });
      }
    };
  
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle initial hash on page load
    if (window.location.hash) {
      handleHashChange();
    }
  }

  waitForDataToLoadWithRetry(callback, maxWaitTime = 10000, retryInterval = 300) {
    console.log("Waiting for data to load with retry...");
    
    // Track start time to avoid infinite waiting
    const startTime = Date.now();
    let retryCount = 0;
    
    // Function to check if data is available
    const checkData = () => {
      retryCount++;
      
      // Check if basic data structure exists
      if (window.vbdbData && window.vbdbData.teamsData) {
        // Check if there's actual team data for at least one league
        const levels = Object.keys(window.vbdbData.teamsData);
        let hasData = false;
        
        for (const level of levels) {
          const teams = window.vbdbData.teamsData[level];
          if (teams && teams.length > 0) {
            hasData = true;
            console.log(`Data loaded successfully. Found ${teams.length} teams in ${level}.`);
            break;
          }
        }
        
        if (hasData) {
          console.log(`Data loaded after ${retryCount} checks.`);
          callback();
          return;
        }
      }
      
      // Check if we've waited too long
      if (Date.now() - startTime > maxWaitTime) {
        console.warn(`Timed out waiting for data after ${retryCount} checks.`);
        // Try to proceed anyway
        callback();
        return;
      }
      
      // Try again after a delay
      setTimeout(checkData, retryInterval);
    };
    
    // Start checking
    checkData();
  }

  handlePathRoute(path) {
    console.log("Handling route path:", path);
  
    // Remove leading slash if present
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
  
    const pathParts = path.split('/').filter(part => part);
  
    if (pathParts.length >= 1) {
      const levelSegment = pathParts[0].replace(/-/g, ' ');
  
      // Convert kebab case back to proper case for level names
      let properLevel;
      switch (levelSegment.toLowerCase()) {
        case 'pvf-pro':
        case 'pvf pro':
          properLevel = 'PVF Pro';
          break;
        case 'lovb':
          properLevel = 'LOVB';
          break;
        case 'ncaa-women':
        case 'ncaa women':
          properLevel = 'NCAA Women';
          break;
        case 'ncaa-men':
        case 'ncaa men':
          properLevel = 'NCAA Men';
          break;
        default:
          properLevel = levelSegment;
      }
  
      const waitForData = () => {
        if (window.vbdbData && window.vbdbData.teamsData) {
          if (pathParts.length >= 3 && pathParts[1] === 'team') {
            const teamId = pathParts[2];
            
            // Find team by ID instead of name
            const teamData = this.findTeamById(properLevel, teamId);
  
            if (teamData) {
              console.log(`Found team by ID: ${teamData.name} (ID: ${teamId}) in ${properLevel}`);
              this.showTeamDetail(properLevel, teamData.name, teamId, false);
            } else {
              console.warn(`Team with ID ${teamId} not found in ${properLevel}`);
              // Attempt to show using whatever info we have
              this.showTeamDetail(properLevel, `Team ${teamId}`, teamId, false);
            }
          } else if (pathParts.length >= 2) {
            // Handle level tab view
            const tab = pathParts[1];
            console.log(`Showing level: ${properLevel}, tab: ${tab}`);
            this.showLeagueContent(properLevel, tab, false);
          } else {
            // Just level view
            console.log(`Showing level: ${properLevel}`);
            this.showLeagueContent(properLevel, 'overview', false);
          }
        } else {
          // Data not loaded yet, try again after a short delay
          setTimeout(waitForData, 100);
        }
      };
  
      waitForData();
    } else {
      console.log("Invalid path format:", path);
    }
  }

  handleLeagueSelected(event) {
    const league = event.detail.level;
    // Clear any active tab components when changing leagues
    this.activeTabComponents = {};
    this.showLeagueContent(league, 'teams', true); // Show teams tab by default
  }

  handleTeamSelected(event) {
    console.log("Team selected event:", event.detail);
    
    // Get the team name, id and level/league from the event
    const teamName = event.detail.teamName;
    const teamId = event.detail.teamId || event.detail.id; // Support both properties
    const level = event.detail.league;
    
    if (!level) {
      console.error("No level or league property found in team-selected event:", event.detail);
      return;
    }
    
    if (!teamId) {
      console.error("No team ID found in team-selected event:", event.detail);
      return;
    }
    
    console.log(`Handling team selection: ${teamName} (ID: ${teamId}) in ${level}`);
    this.showTeamDetail(level, teamName, teamId, true);
  }

  showTeamDetail(level, teamName, teamId, updateHistory = true) {
    console.log(`showTeamDetail called with level: "${level}", teamName: "${teamName}", teamId: "${teamId}"`);
    
    // Store the active level and team
    this.activeLeague = level;
    this.activeTeam = teamName;
    this.activeTeamId = teamId;
    
    // Update browser history if needed
    if (updateHistory) {
      const hashUrl = `#/${level.toLowerCase().replace(/\s+/g, '-')}/team/${teamId}`;
      window.history.pushState({ league: level, teamName, teamId }, `${teamName} - ${level}`, hashUrl);
    }
    
    // Get the overlay element
    const overlay = this.shadowRoot.querySelector('.league-overlay');
    
    // Update content before showing the overlay
    const contentContainer = overlay.querySelector('.league-content-container');
    
    // Pass teamId to getTeamDetailHTML
    contentContainer.innerHTML = this.getTeamDetailHTML(level, teamName, teamId);
    
    // Show the overlay with animation
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling of background
    
    // Let the browser finish this update before triggering the team-detail initialization
    setTimeout(() => {
      contentContainer.classList.add('active');
      this.addTeamDetailEventListeners();
    }, 50);
  }

  showLeagueContent(league, tab = 'overview', updateHistory = true) {
    // Check if we're changing leagues
    const isLeagueChange = this.activeLeague !== league;
    if (isLeagueChange) {
      // Clear active tab components when changing leagues
      this.activeTabComponents = {};
    }
    
    this.activeLeague = league;
    this.activeTab = tab;
    this.activeTeam = null; // Reset active team

    // Update browser history if needed
    if (updateHistory) {
      const hashUrl = `#/${league.toLowerCase().replace(/\s+/g, '-')}/${tab}`;
      window.history.pushState({ league, tab }, `${league} - ${tab.charAt(0).toUpperCase() + tab.slice(1)}`, hashUrl);
    }

    // Get the overlay element
    const overlay = this.shadowRoot.querySelector('.league-overlay');

    // Update content before showing the overlay
    const contentContainer = overlay.querySelector('.league-content-container');
    contentContainer.innerHTML = this.getLeagueContentHTML(league, tab);

    // Show the overlay with animation
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Animate content in
    setTimeout(() => {
      contentContainer.classList.add('active');

      // Add event listeners after content is loaded
      this.addEventListeners();

      // Initialize the tab components
      this.initializeTabComponents(league, tab);
    }, 50);
  }

  hideLeagueContent(updateHistory = true) {
    // Update browser history if needed
    if (updateHistory) {
      window.history.pushState({ league: null }, 'Volleyball Database', '#/');
    }

    // Get the overlay and content container
    const overlay = this.shadowRoot.querySelector('.league-overlay');
    const contentContainer = overlay.querySelector('.league-content-container');

    // Animate content out first
    contentContainer.classList.remove('active');

    // Then hide the overlay
    setTimeout(() => {
      overlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
      this.activeLeague = null;
      this.activeTeam = null;
      
      // Clear active tab components when returning to home
      this.activeTabComponents = {};
    }, 300);
  }

  addEventListeners() {
    // Back button event listener
    const backButton = this.shadowRoot.querySelector('.back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.hideLeagueContent(true);
      });
    }

    // Tab navigation event listeners
    const tabLinks = this.shadowRoot.querySelectorAll('.league-nav a');
    tabLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        // Get the tab name from the data attribute
        const tab = e.target.getAttribute('data-tab');

        // Only switch tabs if it's different
        if (tab !== this.activeTab) {
          this.switchTab(tab);
        }
      });
    });
  }

  addTeamDetailEventListeners() {
    // Back button event listener
    const backButton = this.shadowRoot.querySelector('.back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        // Go back to the league's teams tab
        this.showLeagueContent(this.activeLeague, 'teams', true);
      });
    }
  }

  switchTab(tab) {
    // Update active tab
    this.activeTab = tab;

    // Update URL
    const hashUrl = `#/${this.activeLeague.toLowerCase().replace(/\s+/g, '-')}/${tab}`;
    window.history.pushState({ league: this.activeLeague, tab }, `${this.activeLeague} - ${tab.charAt(0).toUpperCase() + tab.slice(1)}`, hashUrl);

    // Update tab highlight
    const tabLinks = this.shadowRoot.querySelectorAll('.league-nav a');
    tabLinks.forEach(link => {
      if (link.getAttribute('data-tab') === tab) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Show the active tab content and hide others
    const tabContents = this.shadowRoot.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      if (content.getAttribute('data-tab') === tab) {
        content.style.display = 'block';

        // Initialize the component with the league attribute if needed
        if (!this.activeTabComponents[tab]) {
          const tabComponent = content.querySelector(`${tab}-tab`);
          if (tabComponent) {
            // Force component recreation when switching to this tab
            tabComponent.setAttribute('league', this.activeLeague);
            this.activeTabComponents[tab] = true;
          }
        }
      } else {
        content.style.display = 'none';
      }
    });
  }

  initializeTabComponents(league, activeTab) {
    // Set the league attribute on the active tab component
    const tabContent = this.shadowRoot.querySelector(`.tab-content[data-tab="${activeTab}"]`);
    if (tabContent) {
      const tabComponent = tabContent.querySelector(`${activeTab}-tab`);
      if (tabComponent) {
        // First, remove the old component to ensure full reset
        const parent = tabComponent.parentElement;
        const oldComponent = tabComponent;
        
        // Create a fresh component
        const newComponent = document.createElement(`${activeTab}-tab`);
        newComponent.setAttribute('league', league);
        
        // Replace the old component with the new one
        if (parent && oldComponent) {
          parent.replaceChild(newComponent, oldComponent);
        }
        
        // Mark this tab as initialized
        this.activeTabComponents[activeTab] = true;
      }
    }
  }

  // Additional methods for finding teams, rendering components, etc.
  findTeamById(level, teamId) {
    // [existing implementation]
    console.log(`Searching for team with ID "${teamId}" in level "${level}"...`);
    
    if (!window.vbdbData || !window.vbdbData.teamsData) {
      console.error("No data available - vbdbData or teamsData is undefined");
      return null;
    }
    
    // Log all available keys for debugging
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
    for (const levelVariant of levelVariants) {
      if (window.vbdbData.teamsData[levelVariant] && window.vbdbData.teamsData[levelVariant].length > 0) {
        console.log(`Found teams using level key: "${levelVariant}"`);
        teams = window.vbdbData.teamsData[levelVariant];
        break;
      }
    }
    
    // If still no teams found, get all teams from all levels
    if (!teams || teams.length === 0) {
      console.log("Trying to find team by ID across all data...");
      
      const allTeams = [];
      for (const levelKey of availableLevels) {
        if (Array.isArray(window.vbdbData.teamsData[levelKey])) {
          allTeams.push(...window.vbdbData.teamsData[levelKey]);
        }
      }
      
      // Try to find by ID
      const idMatch = allTeams.find(team => 
        team.id === teamId || 
        team.teamId === teamId ||
        (team.id && team.id.toString() === teamId) ||
        (team.teamId && team.teamId.toString() === teamId)
      );
      
      if (idMatch) {
        console.log(`Found team "${idMatch.name}" with ID "${teamId}" in a different level: ${idMatch.level || idMatch.league || 'unknown'}`);
        return idMatch;
      }
      
      console.error(`No team found with ID: "${teamId}" in any level`);
      return null;
    }
    
    console.log(`Found ${teams.length} teams for search`);
    
    // Find the team by ID
    const match = teams.find(team => 
      team.id === teamId || 
      team.teamId === teamId ||
      (team.id && team.id.toString() === teamId) ||
      (team.teamId && team.teamId.toString() === teamId)
    );
    
    if (match) {
      console.log(`Found team with ID "${teamId}": "${match.name}"`);
      return match;
    }
    
    console.error(`Team with ID "${teamId}" not found`);
    return null;
  }

  getLeagueIconHTML(league) {
    if (league === 'LOVB') {
      return `
        <div class="league-icon">
          ${this.lovbSvg}
        </div>
      `;
    } else if (this.leagueIcons[league]) {
      return `
        <div class="league-icon">
          <img src="${this.leagueIcons[league]}" alt="${league}" />
        </div>
      `;
    }

    return '';
  }

  getTeamDetailHTML(level, teamName, teamId) {
    const iconHTML = this.getLeagueIconHTML(level);
    
    return `
      <div class="team-detail-header">
        <button class="back-button">
          <i class="fas fa-arrow-left"></i> Back to Teams
        </button>
        <div class="league-title-container">
          ${iconHTML}
          <h1>${teamName}</h1>
        </div>
      </div>
      
      <div class="team-detail-content">
        <!-- Pass team-id attribute to the component -->
        <team-detail level="${level}" team-name="${teamName}" team-id="${teamId}"></team-detail>
      </div>
    `;
  }

  getLeagueContentHTML(league, activeTab = 'overview') {
    const iconHTML = this.getLeagueIconHTML(league);

    // Generate a unique identifier to help force component refresh
    const timestamp = Date.now();

    return `
      <div class="league-header">
        <button class="back-button">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <div class="league-title-container">
          ${iconHTML}
          <h1>${league}</h1>
        </div>
      </div>
      
      <div class="league-data">
        <nav class="league-nav">
          <ul>
            <li><a href="#" data-tab="teams" class="${activeTab === 'teams' ? 'active' : ''}">Teams</a></li>
            <li><a href="#" data-tab="players" class="${activeTab === 'players' ? 'active' : ''}">Players</a></li>
            <li><a href="#" data-tab="standings" class="${activeTab === 'standings' ? 'active' : ''}">Standings</a></li>
            <li><a href="#" data-tab="schedule" class="${activeTab === 'schedule' ? 'active' : ''}">Schedule</a></li>
          </ul>
        </nav>
        
        <div class="tab-content-container">
          <!-- Teams Tab -->
          <div class="tab-content" data-tab="teams" style="display: ${activeTab === 'teams' ? 'block' : 'none'}">
            <teams-tab league="${league}" data-timestamp="${timestamp}"></teams-tab>
          </div>
          
          <!-- Players Tab -->
          <div class="tab-content" data-tab="players" style="display: ${activeTab === 'players' ? 'block' : 'none'}">
            <players-tab league="${league}" data-timestamp="${timestamp}"></players-tab>
          </div>
          
          <!-- Standings Tab -->
          <div class="tab-content" data-tab="standings" style="display: ${activeTab === 'standings' ? 'block' : 'none'}">
            <standings-tab league="${league}" data-timestamp="${timestamp}"></standings-tab>
          </div>
          
          <!-- Schedule Tab -->
          <div class="tab-content" data-tab="schedule" style="display: ${activeTab === 'schedule' ? 'block' : 'none'}">
            <schedule-tab league="${league}" data-timestamp="${timestamp}"></schedule-tab>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        /* Overlay styling */
        .league-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: var(--dark-bg, #121212);
          z-index: 1000;
          visibility: hidden;
          opacity: 0;
          transition: visibility 0.3s ease, opacity 0.3s ease;
          overflow-y: auto;
        }
        
        .league-overlay.active {
          visibility: visible;
          opacity: 1;
        }
        
        /* Content container styling */
        .league-content-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .league-content-container.active {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Header styling */
        .league-header, .team-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .league-title-container {
          display: flex;
          align-items: center;
        }
        
        .league-icon {
          margin-right: 1rem;
          height: 100px;
          width: auto;
          display: flex;
          align-items: center;
        }
        
        .league-icon img, .league-icon svg {
          max-height: 100px;
          max-width: 100px;
          object-fit: contain;
        }
        
        h1 {
          margin: 0;
          font-size: 2.5rem;
          background: linear-gradient(to right, var(--accent, #5ca5c7), var(--accent-hover, #7577cd));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        h2 {
          font-size: 1.8rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: var(--text, #e0e0e0);
        }
        
        .back-button {
          background: none;
          border: 1px solid var(--accent, #5ca5c7);
          color: var(--accent, #5ca5c7);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
        }
        
        .back-button:hover {
          background-color: var(--accent, #5ca5c7);
          color: white;
        }
        
        /* Navigation styling */
        .league-nav {
          margin-bottom: 2rem;
        }
        
        .league-nav ul {
          display: flex;
          list-style: none;
          padding: 0;
          margin: 0;
          gap: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 1rem;
        }
        
        .league-nav a {
          color: var(--text-secondary, #aaaaaa);
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .league-nav a.active {
          color: var(--accent, #5ca5c7);
          background-color: rgba(92, 165, 199, 0.1);
          font-weight: 500;
        }
        
        .league-nav a:hover:not(.active) {
          color: var(--text, #e0e0e0);
        }
        
        /* Team detail page placeholders */
        .team-info-placeholder {
          margin-top: 2rem;
        }
        
        .placeholder-section {
          margin-bottom: 3rem;
        }
        
        .placeholder-card {
          background-color: var(--card-bg, #1e1e1e);
          border-radius: 10px;
          padding: 1.5rem;
          display: flex;
          gap: 2rem;
          animation: pulse 1.5s infinite;
        }
        
        .placeholder-img {
          width: 200px;
          height: 200px;
          background-color: #2a2a2a;
          border-radius: 8px;
        }
        
        .placeholder-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .placeholder-line {
          height: 20px;
          background-color: #2a2a2a;
          border-radius: 4px;
          margin-bottom: 1rem;
          width: 100%;
        }
        
        .placeholder-line:nth-child(2) {
          width: 70%;
        }
        
        .placeholder-line:nth-child(3) {
          width: 50%;
        }
        
        .placeholder-table {
          background-color: var(--card-bg, #1e1e1e);
          border-radius: 10px;
          padding: 1.5rem;
          animation: pulse 1.5s infinite;
        }
        
        .placeholder-header {
          display: flex;
          border-bottom: 1px solid #333;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
        
        .placeholder-row {
          display: flex;
          border-bottom: 1px solid #222;
          padding: 0.8rem 0;
        }
        
        .placeholder-cell {
          flex: 1;
          height: 20px;
          background-color: #2a2a2a;
          border-radius: 4px;
          margin-right: 1rem;
        }
        
        .placeholder-results {
          background-color: var(--card-bg, #1e1e1e);
          border-radius: 10px;
          padding: 1.5rem;
          animation: pulse 1.5s infinite;
        }
        
        .placeholder-result-item {
          display: flex;
          padding: 1rem 0;
          border-bottom: 1px solid #222;
        }
        
        .placeholder-date {
          width: 100px;
          height: 20px;
          background-color: #2a2a2a;
          border-radius: 4px;
          margin-right: 1rem;
        }
        
        .placeholder-teams {
          flex: 1;
          height: 20px;
          background-color: #2a2a2a;
          border-radius: 4px;
          margin-right: 1rem;
        }
        
        .placeholder-score {
          width: 80px;
          height: 20px;
          background-color: #2a2a2a;
          border-radius: 4px;
        }
        
        @keyframes pulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0.6;
          }
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .league-header, .team-detail-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .back-button {
            margin-bottom: 1rem;
          }
          
          .league-title-container {
            width: 100%;
            justify-content: flex-start;
          }
          
          .league-nav ul {
            flex-wrap: wrap;
          }
          
          h1 {
            font-size: 2rem;
          }
          
          .league-content-container {
            padding: 1rem;
          }
          
          .placeholder-card {
            flex-direction: column;
            gap: 1rem;
          }
          
          .placeholder-img {
            width: 100%;
            height: 150px;
          }
        }
      </style>
      
      <!-- Overlay for league content -->
      <div class="league-overlay">
        <div class="league-content-container"></div>
      </div>
    `;
  }
}

customElements.define('view-manager', ViewManager);