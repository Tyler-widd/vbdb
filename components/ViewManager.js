class ViewManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
  }
  
  connectedCallback() {
    // Set up initial structure with home view always present
    this.render();
    
    // Listen for league selection events
    document.addEventListener('league-selected', this.handleLeagueSelected.bind(this));
    
    // Listen for team selection events
    document.addEventListener('team-selected', this.handleTeamSelected.bind(this));
    
    // Set up history state handling
    window.addEventListener('popstate', (event) => {
      if (event.state) {
        if (event.state.teamName) {
          // Team detail view
          this.showTeamDetail(event.state.league, event.state.teamName, false);
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
  }
  
  handleLeagueSelected(event) {
    const league = event.detail.level;
    this.showLeagueContent(league, 'teams', true); // Show teams tab by default
  }
  
  handleTeamSelected(event) {
    const { teamName, league } = event.detail;
    this.showTeamDetail(league, teamName, true);
  }
  
  showTeamDetail(league, teamName, updateHistory = true) {
    this.activeLeague = league;
    this.activeTeam = teamName;
    
    // Update browser history if needed
    if (updateHistory) {
      const url = `/${league.toLowerCase().replace(/\s+/g, '-')}/team/${teamName.toLowerCase().replace(/\s+/g, '-')}`;
      window.history.pushState({ league, teamName }, `${teamName} - ${league}`, url);
    }
    
    // Get the overlay element
    const overlay = this.shadowRoot.querySelector('.league-overlay');
    
    // Update content before showing the overlay
    const contentContainer = overlay.querySelector('.league-content-container');
    contentContainer.innerHTML = this.getTeamDetailHTML(league, teamName);
    
    // Show the overlay with animation
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling of background
    
    // Animate content in
    setTimeout(() => {
      contentContainer.classList.add('active');
      
      // Add event listeners after content is loaded
      this.addTeamDetailEventListeners();
    }, 50);
  }
  
  showLeagueContent(league, tab = 'overview', updateHistory = true) {
    this.activeLeague = league;
    this.activeTab = tab;
    this.activeTeam = null; // Reset active team
    
    // Update browser history if needed
    if (updateHistory) {
      const url = `/${league.toLowerCase().replace(/\s+/g, '-')}/${tab}`;
      window.history.pushState({ league, tab }, `${league} - ${tab.charAt(0).toUpperCase() + tab.slice(1)}`, url);
    }
    
    // Get the overlay element
    const overlay = this.shadowRoot.querySelector('.league-overlay');
    
    // Update content before showing the overlay
    const contentContainer = overlay.querySelector('.league-content-container');
    contentContainer.innerHTML = this.getLeagueContentHTML(league, tab);
    
    // Show the overlay with animation
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling of background
    
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
      window.history.pushState({ league: null }, 'Volleyball Database', '/');
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
    const url = `/${this.activeLeague.toLowerCase().replace(/\s+/g, '-')}/${tab}`;
    window.history.pushState({ league: this.activeLeague, tab }, `${this.activeLeague} - ${tab.charAt(0).toUpperCase() + tab.slice(1)}`, url);
    
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
        const tabComponent = content.querySelector(`${tab}-tab`);
        if (tabComponent && !tabComponent.hasAttribute('league')) {
          tabComponent.setAttribute('league', this.activeLeague);
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
        tabComponent.setAttribute('league', league);
      }
    }
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
  
  getTeamDetailHTML(league, teamName) {
    const iconHTML = this.getLeagueIconHTML(league);
    // Format the team name in the same way it appears in the URL
    const teamNameFormatted = teamName.toLowerCase().replace(/\s+/g, '-');
    
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
        <!-- Use our new TeamDetail component here -->
        <team-detail league="${league}" team-name="${teamNameFormatted}"></team-detail>
        
        <div class="placeholder-section">
          <h2>Team Roster</h2>
          <div class="placeholder-table">
            <div class="placeholder-header">
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
            </div>
            <div class="placeholder-row">
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
            </div>
            <div class="placeholder-row">
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
            </div>
            <div class="placeholder-row">
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
              <div class="placeholder-cell"></div>
            </div>
          </div>
        </div>
        
        <div class="placeholder-section">
          <h2>Recent Results</h2>
          <div class="placeholder-results">
            <div class="placeholder-result-item">
              <div class="placeholder-date"></div>
              <div class="placeholder-teams"></div>
              <div class="placeholder-score"></div>
            </div>
            <div class="placeholder-result-item">
              <div class="placeholder-date"></div>
              <div class="placeholder-teams"></div>
              <div class="placeholder-score"></div>
            </div>
            <div class="placeholder-result-item">
              <div class="placeholder-date"></div>
              <div class="placeholder-teams"></div>
              <div class="placeholder-score"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  getLeagueContentHTML(league, activeTab = 'overview') {
    const iconHTML = this.getLeagueIconHTML(league);
    
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
            <li><a href="#" data-tab="overview" class="${activeTab === 'overview' ? 'active' : ''}">Overview</a></li>
            <li><a href="#" data-tab="teams" class="${activeTab === 'teams' ? 'active' : ''}">Teams</a></li>
            <li><a href="#" data-tab="players" class="${activeTab === 'players' ? 'active' : ''}">Players</a></li>
            <li><a href="#" data-tab="standings" class="${activeTab === 'standings' ? 'active' : ''}">Standings</a></li>
            <li><a href="#" data-tab="schedule" class="${activeTab === 'schedule' ? 'active' : ''}">Schedule</a></li>
          </ul>
        </nav>
        
        <div class="tab-content-container">
          <!-- Overview Tab -->
          <div class="tab-content" data-tab="overview" style="display: ${activeTab === 'overview' ? 'block' : 'none'}">
            <overview-tab league="${league}"></overview-tab>
          </div>
          
          <!-- Teams Tab -->
          <div class="tab-content" data-tab="teams" style="display: ${activeTab === 'teams' ? 'block' : 'none'}">
            <teams-tab league="${league}"></teams-tab>
          </div>
          
          <!-- Players Tab -->
          <div class="tab-content" data-tab="players" style="display: ${activeTab === 'players' ? 'block' : 'none'}">
            <players-tab league="${league}"></players-tab>
          </div>
          
          <!-- Standings Tab -->
          <div class="tab-content" data-tab="standings" style="display: ${activeTab === 'standings' ? 'block' : 'none'}">
            <standings-tab league="${league}"></standings-tab>
          </div>
          
          <!-- Schedule Tab -->
          <div class="tab-content" data-tab="schedule" style="display: ${activeTab === 'schedule' ? 'block' : 'none'}">
            <schedule-tab league="${league}"></schedule-tab>
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