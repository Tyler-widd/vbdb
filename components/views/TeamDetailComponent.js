class TeamDetail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.teamData = null;
  }

  static get observedAttributes() {
    return ['league', 'team-name'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    // Check if data is already loaded
    if (window.vbdbData && window.vbdbData.teamsData) {
      this.findTeamData();
      this.render();
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
    
    // Remove the listener since we no longer need it
    document.removeEventListener('teams-data-loaded', this.dataLoadedListener);
  }
  
  handleDataError(event) {
    console.error('Error loading team data:', event.detail.error);
    this.render(); // Render with error state
    
    // Remove the listener
    document.removeEventListener('teams-data-error', this.dataErrorListener);
  }

  findTeamData() {
    const teamName = this.getAttribute('team-name');
    const league = this.getAttribute('league');
    
    if (!teamName || !league || !window.vbdbData || !window.vbdbData.teamsData) return;
    
    // Find the matching team by normalizing the name (removing dashes)
    const normalizedTeamName = teamName.replace(/-/g, ' ');
    
    // Get the teams for this league
    const leagueTeams = window.vbdbData.teamsData[league] || [];
    
    // Find the team with matching name (case-insensitive)
    this.teamData = leagueTeams.find(team => 
      team.name.toLowerCase() === normalizedTeamName.toLowerCase()
    );
  }

  render() {
    const teamName = this.getAttribute('team-name')?.replace(/-/g, ' ');
    const league = this.getAttribute('league');
    
    if (!teamName || !league) {
      this.shadowRoot.innerHTML = '<p>Loading team information...</p>';
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
      teamImageHTML = `<img src="${this.teamData.img}" alt="${this.teamData.name}" class="team-image">`;
    }
    
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
        
        .team-url {
          color: var(--accent, #5ca5c7);
          text-decoration: none;
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.8; }
          100% { opacity: 0.6; }
        }
        
        @media (max-width: 768px) {
          .team-info-card {
            flex-direction: column;
          }
          
          .team-image-container {
            width: 100%;
            height: 150px;
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
            <p class="team-meta"><strong>Conference:</strong> ${this.teamData.conference}</p>
            <p class="team-meta"><strong>Division:</strong> ${this.teamData.division}</p>
            <p class="team-meta"><strong>Website:</strong> <a href="https://${this.teamData.url}" target="_blank" class="team-url">${this.teamData.url}</a></p>
          ` : '<p class="team-meta">Team details not found</p>'}
        </div>
      </div>
    `;
  }
}

customElements.define('team-detail', TeamDetail);