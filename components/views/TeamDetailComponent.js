class TeamDetail extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.teamData = null;
  }

  static get observedAttributes() {
    return ['level', 'team-name', 'team-id'];
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
          team.teamId === teamId ||
          (team.id && team.id.toString() === teamId) ||
          (team.teamId && team.teamId.toString() === teamId)
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
        team.teamId === teamId ||
        (team.id && team.id.toString() === teamId) ||
        (team.teamId && team.teamId.toString() === teamId)
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
    const isProfessionalLeague = this.teamData && (this.teamData.conference === 'LOVB' || this.teamData.conference === 'PVF');
    
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
            ${isProfessionalLeague ? 
              `<p class="team-meta"><strong>League:</strong> ${this.teamData.conference}</p>` : 
              `<p class="team-meta"><strong>Conference:</strong> ${this.teamData.conference}</p>
               <p class="team-meta"><strong>Division:</strong> ${this.teamData.division}</p>`
            }
            <p class="team-meta"><strong>Website:</strong> <a href="https://${this.teamData.url}" target="_blank" class="team-url">${this.teamData.url}</a></p>
          ` : '<p class="team-meta">Team details not found</p>'}
        </div>
      </div>
    `;
  }
}

customElements.define('team-detail', TeamDetail);