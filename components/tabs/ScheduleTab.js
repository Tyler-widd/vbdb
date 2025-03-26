class ScheduleTab extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.matchResults = [];
      this.isLoading = true;
      this.filteredResults = [];
      this.selectedTeam = 'all';
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
      await this.loadData();
    }
    
    async loadData() {
      this.isLoading = true;
      this.render(); // Show loading state
      
      const league = this.getAttribute('league');
      if (league === 'LOVB') {
        try {
          const response = await fetch('https://api.volleyballdatabased.com/api/lovb_results');
          if (!response.ok) {
            throw new Error('Failed to fetch match results');
          }
          
          this.matchResults = await response.json();
          this.filteredResults = [...this.matchResults]; // Initialize filtered results with all results
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
    
    setupEventListeners() {
      // Match card click events
      const matchCards = this.shadowRoot.querySelectorAll('.match-card');
      matchCards.forEach(card => {
        card.addEventListener('click', () => {
          const url = card.getAttribute('data-url');
          if (url) {
            window.open(url, '_blank');
          }
        });
      });
      
      // Team filter change event
      const teamFilter = this.shadowRoot.querySelector('.team-filter');
      if (teamFilter) {
        teamFilter.addEventListener('change', (e) => {
          this.selectedTeam = e.target.value;
          this.filterResults();
        });
      }
    }
    
    // Filter results based on selected team
    filterResults() {
      if (this.selectedTeam === 'all') {
        this.filteredResults = [...this.matchResults];
      } else {
        this.filteredResults = this.matchResults.filter(match => {
          const homeTeam = this.removeLeaguePrefix(match.home_team_name);
          const awayTeam = this.removeLeaguePrefix(match.away_team_name);
          return homeTeam === this.selectedTeam || awayTeam === this.selectedTeam;
        });
      }
      
      // Re-render the results with the new filter
      this.renderResults();
    }
    
    // Render just the results part of the page
    renderResults() {
      const matchGrid = this.shadowRoot.querySelector('.match-grid');
      if (!matchGrid) return;
      
      if (this.filteredResults && this.filteredResults.length > 0) {
        matchGrid.innerHTML = this.filteredResults.map(match => {
          const homeTeam = this.removeLeaguePrefix(match.home_team_name);
          const awayTeam = this.removeLeaguePrefix(match.away_team_name);
          
          // Handle SVG content which might be in the team_img fields
          const homeLogoContent = match.home_team_img && match.home_team_img.includes('<svg') 
            ? match.home_team_img 
            : (match.home_team_img ? `<img src="${match.home_team_img}" alt="${homeTeam}">` : '');
          
          const awayLogoContent = match.away_team_img && match.away_team_img.includes('<svg') 
            ? match.away_team_img 
            : (match.away_team_img ? `<img src="${match.away_team_img}" alt="${awayTeam}">` : '');
          
          return `
            <div class="match-card" data-url="${match.match_url}">
              <div class="match-content">
                <div class="team-block home-team">
                  <div class="team-logo">
                    ${homeLogoContent}
                  </div>
                  <div class="team-name">${homeTeam}</div>
                </div>
                
                <div class="match-details">
                  <span class="vs-badge">VS</span>
                  <div class="match-date">${match.date}</div>
                  <div class="match-score">${match.score}</div>
                </div>
                
                <div class="team-block away-team">
                  <div class="team-name">${awayTeam}</div>
                  <div class="team-logo">
                    ${awayLogoContent}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        matchGrid.innerHTML = `<div class="no-results">No match results available for the selected team.</div>`;
      }
      
      // Reattach event listeners to the new cards
      this.setupEventListeners();
    }
    
    // Remove "LOVB " prefix from team names
    removeLeaguePrefix(teamName) {
      return teamName.replace(/^LOVB /, '');
    }
    
    // Get unique team names for the filter dropdown
    getUniqueTeams() {
      const teams = new Set();
      
      this.matchResults.forEach(match => {
        teams.add(this.removeLeaguePrefix(match.home_team_name));
        teams.add(this.removeLeaguePrefix(match.away_team_name));
      });
      
      return Array.from(teams).sort();
    }

    formatScore(scoreText) {
        if (!scoreText) return '';
        
        // Extract the sets score (like "3-2") and the detailed score (like "[20-25, 25-15, 17-25, 32-30, 15-7]")
        const parts = scoreText.split(' ');
        if (parts.length < 2) return scoreText;
        
        const setsScore = parts[0];
        const detailedScore = parts.slice(1).join(' ');
        
        // Parse the detailed score and add spans with classes
        if (detailedScore.startsWith('[') && detailedScore.endsWith(']')) {
          const scoresInside = detailedScore.substring(1, detailedScore.length - 1);
          const sets = scoresInside.split(', ');
          
          if (sets.length > 2) {
            // Wrap first two sets and remaining sets in different spans
            const firstPart = sets.slice(0, 2).join(', ');
            const secondPart = sets.slice(2).join(', ');
            return `${setsScore} [<span class="score-first-part">${firstPart}</span>, <span class="score-second-part">${secondPart}</span>]`;
          }
        }
        
        // If we can't format it properly, return the original
        return scoreText;
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
      
      // If league is not LOVB, show a placeholder
      if (league !== 'LOVB') {
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
      
      // Get unique teams for filter dropdown
      const uniqueTeams = this.getUniqueTeams();
      
      // For LOVB, show match results
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

/* Filter styling */
.filter-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.team-filter {
  padding: 10px 35px 10px 15px;
  border-radius: 5px;
  border: none;
  background-color: #2a2a2a;
  color: var(--text);
  min-width: 200px;
  appearance: none;
  position: relative;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23777777' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
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
  background: linear-gradient(to right, var(--accent, #5ca5c7), var(--accent-hover, #7577cd));
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

.team-logo svg {
  width: 50px;
  height: 50px;
  color: var(--accent, #5ca5c7);
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
  padding: 15px 20px; /* Fixed padding */
  min-width: 180px;
  min-height: 80px; /* Fixed minimum height */
}

.match-date {
  font-size: 0.9rem;
  color: var(--text-secondary, #aaaaaa);
  margin-bottom: 8px;
  text-align: center;
}

.match-score {
  font-weight: 600;
  color: var(--text, #e0e0e0);
  text-align: center;
  line-height: 1.4;
  max-width: 180px;
  white-space: normal;
}

.vs-badge {
  background-color: var(--accent, #5ca5c7);
  color: white;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 5px;
}

.no-results {
  background-color: var(--card-bg, #1e1e1e);
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  color: var(--text-secondary, #aaaaaa);
}
          
          @media (max-width: 768px) {
.match-card { 
      display: flex;
      flex-direction: column;
}

  .vs-badge {
    font-size: 0.65rem;
    padding: 1px 4px;
  }

            .match-content {
    flex-direction: row; /* Keep the same layout on mobile */
    align-items: center;
    padding: 8px 0;
            }
            
            .match-score {
    font-size: 0.8rem;
    white-space: nowrap;
            }

            .match-grid {
                gap: 20px;
            }

            .filter-container {
              justify-content: center;
            }
            
            .team-filter {
              width: 100%;
              max-width: 300px;
              padding: 12px 35px 12px 15px;
              font-size: 16px;
            }
            
            .match-details {
    padding: 5px;
    min-width: 80px;
            }
            
            .team-block {
    padding: 5px;
    min-width: 0;
            }
            
            .home-team, .away-team {
              border: none;
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
            
            .match-date, .match-score {
    font-size: 0.7rem;
    margin-bottom: 4px;
            }
          }

          @media (max-width: 400px) {
  .match-content {
    padding: 5px 0;
  }
  
  .team-name {
    max-width: 60px; /* Even smaller on tiny screens */
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
        </style>
        
        <div class="schedule-container">
          <h1>LOVB Results</h1>
          
          <div class="filter-container">
            <select class="team-filter">
              <option value="all">All Teams</option>
              ${uniqueTeams.map(team => `<option value="${team}">${team}</option>`).join('')}
            </select>
          </div>
          
          <div class="match-grid">
            ${this.filteredResults && this.filteredResults.length > 0 ? 
              this.filteredResults.map(match => {
                const homeTeam = this.removeLeaguePrefix(match.home_team_name);
                const awayTeam = this.removeLeaguePrefix(match.away_team_name);
                
                // Handle SVG content which might be in the team_img fields
                const homeLogoContent = match.home_team_img && match.home_team_img.includes('<svg') 
                  ? match.home_team_img 
                  : (match.home_team_img ? `<img src="${match.home_team_img}" alt="${homeTeam}">` : '');
                
                const awayLogoContent = match.away_team_img && match.away_team_img.includes('<svg') 
                  ? match.away_team_img 
                  : (match.away_team_img ? `<img src="${match.away_team_img}" alt="${awayTeam}">` : '');
                
                return `
                  <div class="match-card" data-url="${match.match_url}">
                    <div class="match-content">
                      <div class="team-block home-team">
                        <div class="team-logo">
                          ${homeLogoContent}
                        </div>
                        <div class="team-name">${homeTeam}</div>
                      </div>
                      
                      <div class="match-details">
                        <span class="vs-badge">VS</span>
                        <div class="match-date">${match.date}</div>
                        <div class="match-score">${this.formatScore(match.score)}</div>
                      </div>
                      
                      <div class="team-block away-team">
                        <div class="team-name">${awayTeam}</div>
                        <div class="team-logo">
                          ${awayLogoContent}
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('') :
              `<div class="no-results">No match results available at this time.</div>`
            }
          </div>
        </div>
      `;
      
      // Setup event listeners
      this.setupEventListeners();
    }
  }
  
  customElements.define('schedule-tab', ScheduleTab);