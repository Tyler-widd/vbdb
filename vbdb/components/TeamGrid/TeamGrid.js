// TeamGrid.js - Main team grid component with URL routing
// Updated to hide hero section and add animations

import { dataService } from '../../services/DataService.js';
import './TeamCard.js';
import './Pagination.js';
import './FilterBar.js';
import './NoResults.js';

export class TeamGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize properties
    this.filteredTeams = [];
    this.currentPage = 1;
    this.teamsPerPage = 12;
    this.selectedLeague = '';
    this.searchQuery = '';
    this.selectedDivision = 'all';
    this.isLoading = false;
    this.uniqueDivisions = [];
    
    // Bind methods
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleDivisionChange = this.handleDivisionChange.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleBackButton = this.handleBackButton.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
    this.handleUrlChange = this.handleUrlChange.bind(this);
  }
  
  connectedCallback() {
    // Check if there's a league in the URL path
    this.checkUrlPath();
    
    // Listen for popstate events (browser back/forward buttons)
    window.addEventListener('popstate', this.handlePopState);
    
    // Listen for league selection events
    document.addEventListener('league-selected', this.handleLeagueSelected.bind(this));
    
    // Listen for URL change events
    document.addEventListener('url-changed', this.handleUrlChange);
  }
  
  disconnectedCallback() {
    // Clean up event listeners when component is removed
    window.removeEventListener('popstate', this.handlePopState);
    document.removeEventListener('league-selected', this.handleLeagueSelected.bind(this));
    document.removeEventListener('url-changed', this.handleUrlChange);
  }
  
  // Helper to toggle visibility of sections
  toggleSections(showLeague) {
    // Handle league section
    const leagueSection = document.getElementById('league-section');
    if (leagueSection) {
      leagueSection.style.display = showLeague ? 'block' : 'none';
    }
    
    // Handle hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      heroSection.style.display = showLeague ? 'block' : 'none';
    }
  }
  
  checkUrlPath() {
    // Get the path from the URL
    const path = window.location.pathname;
    const slug = path.slice(1); // Remove the leading slash
    
    if (slug) {
      // Look up the league from the slug
      const league = dataService.getLeagueFromSlug(slug);
      if (league) {
        this.selectedLeague = dataService.getLeagueApiValue(league);
        this.fetchTeams();
        
        // Hide the league and hero sections
        this.toggleSections(false);
      } else {
        // If the slug doesn't match any league, redirect to home
        window.history.replaceState(null, '', '/');
        this.render();
      }
    } else {
      // No league in URL, just render the initial state
      this.render();
      
      // Make sure league and hero sections are visible
      this.toggleSections(true);
    }
  }
  
  handleUrlChange(event) {
    const { slug } = event.detail;
    const league = dataService.getLeagueFromSlug(slug);
    
    if (league) {
      this.selectedLeague = dataService.getLeagueApiValue(league);
      this.currentPage = 1;
      this.filteredTeams = [];
      this.searchQuery = '';
      this.selectedDivision = 'all';
      
      // Hide the league and hero sections
      this.toggleSections(false);
      
      // Fetch teams for the selected league
      this.fetchTeams();
    }
  }
  
  handlePopState(event) {
    // Check if there's a league in the URL path after navigation
    this.checkUrlPath();
  }
  
  handleLeagueSelected(event) {
    const { level } = event.detail;
    // Map the display name to API value
    this.selectedLeague = dataService.getLeagueApiValue(level);
    this.currentPage = 1;
    this.filteredTeams = [];
    this.searchQuery = '';
    this.selectedDivision = 'all';
    
    // Hide the league and hero sections
    this.toggleSections(false);
    
    // Fetch teams for the selected league
    this.fetchTeams();
  }
  
  async fetchTeams() {
    this.isLoading = true;
    this.render(); // Show loading state
    
    try {
      // Fetch teams for the selected league
      const teams = await dataService.fetchTeams(this.selectedLeague);
      
      // Set filtered teams
      this.filteredTeams = teams;
      
      // Extract unique divisions for filter
      this.uniqueDivisions = [...new Set(teams.map(team => team.division))]
        .filter(division => division) // Remove null/undefined values
        .sort();
      
    } catch (error) {
      console.error('Error fetching team data:', error);
      this.filteredTeams = [];
      this.uniqueDivisions = [];
    } finally {
      this.isLoading = false;
      this.render();
      this.setupEventListeners();
    }
  }
  
  async applyFilters() {
    const teams = await dataService.fetchTeams(this.selectedLeague);
    this.filteredTeams = dataService.filterTeams(
      teams, 
      this.searchQuery,
      this.selectedDivision
    );
    this.currentPage = 1; // Reset to first page when filters change
    this.render();
    this.setupEventListeners();
  }
  
  handleSearchChange(event) {
    this.searchQuery = event.detail.query;
    this.applyFilters();
  }
  
  handleDivisionChange(event) {
    this.selectedDivision = event.detail.division;
    this.applyFilters();
  }
  
  handlePageChange(event) {
    this.currentPage = event.detail.page;
    this.render();
    this.setupEventListeners();
    
    // Scroll to top of grid
    this.shadowRoot.querySelector('.team-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  handleBackButton() {
    // Navigate to home URL
    window.history.pushState(null, '', '/');
    
    this.selectedLeague = '';
    this.render();
    
    // Show league and hero sections
    this.toggleSections(true);
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  setupEventListeners() {
    // Listen for filter events from FilterBar
    this.shadowRoot.addEventListener('search', this.handleSearchChange);
    this.shadowRoot.addEventListener('division-change', this.handleDivisionChange);
    
    // Back button listener
    const backButton = this.shadowRoot.querySelector('.back-button');
    if (backButton) {
      backButton.addEventListener('click', this.handleBackButton);
    }
    
    // Pagination listener
    this.shadowRoot.addEventListener('page-change', this.handlePageChange);
  }
  
  render() {
    // If no league is selected yet, show initial state
    if (!this.selectedLeague) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
          }
          
          .initial-state {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--text-secondary, #aaaaaa);
          }
        </style>
      `;
      return;
    }
    
    // Show loading state while fetching data
    if (this.isLoading) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
          }
          
          .loading {
            background-color: #2a2a2a;
            color: var(--text, #e0e0e0);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin: 2rem auto;
            max-width: 500px;
          }
          
          .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: var(--accent, #5ca5c7);
            animation: spin 1s ease-in-out infinite;
            margin-right: 10px;
            vertical-align: middle;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
        <div class="loading">
          <span class="loading-spinner"></span>
          Loading team data...
        </div>
      `;
      return;
    }

    // Calculate pagination
    const teams = this.filteredTeams;
    const totalPages = Math.ceil(teams.length / this.teamsPerPage);
    const startIndex = (this.currentPage - 1) * this.teamsPerPage;
    const endIndex = Math.min(startIndex + this.teamsPerPage, teams.length);
    const currentTeams = teams.slice(startIndex, endIndex);

    // Get league display name
    const leagueDisplayName = dataService.getDisplayName(this.selectedLeague);

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
        
        h1 {
          color: var(--accent, #5ca5c7);
          text-align: center;
          margin-bottom: 20px;
          font-size: 1.8rem;
          opacity: 0;
          animation: fadeIn 0.6s ease forwards;
        }
        
        .team-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 15px;
          margin-top: 20px;
          min-height: 300px; /* Prevents layout shift during searches */
        }
        
        /* Animation classes */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Back button */
        .back-button {
          background-color: #2a2a2a;
          color: var(--text, #e0e0e0);
          border: none;
          border-radius: 5px;
          padding: 8px 15px;
          font-size: 0.9rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          margin-bottom: 20px;
          transition: background-color 0.2s ease;
          opacity: 0;
          animation: fadeIn 0.5s ease forwards;
        }
        
        .back-button:hover {
          background-color: #333;
        }
        
        /* Animation delays */
        .delay-1 {
          animation-delay: 0.1s;
        }
        
        .delay-2 {
          animation-delay: 0.2s;
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .team-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 15px;
          }
        }
        
        /* Extra small screens */
        @media (max-width: 400px) {
          .team-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
          }
        }
      </style>
      
      <div class="team-container">
        <button class="back-button">Back to Leagues</button>
        <h1 class="delay-1">${leagueDisplayName} Teams</h1>
        
        <filter-bar
          class="delay-2"
          divisions='${JSON.stringify(this.uniqueDivisions)}'
          search-query="${this.searchQuery}"
          selected-division="${this.selectedDivision}">
        </filter-bar>
        
        <div class="team-grid">
          ${currentTeams.length > 0 ? 
            currentTeams.map((team, index) => `
              <team-card 
                team-data='${JSON.stringify(team).replace(/'/g, "&apos;")}' 
                style="animation-delay: ${0.1 + (index % 4) * 0.1}s">
              </team-card>
            `).join('') :
            `<no-results message="No teams match your search criteria. Try adjusting your filters."></no-results>`
          }
        </div>
        
        <team-pagination
          current-page="${this.currentPage}"
          total-pages="${totalPages}"
          total-items="${teams.length}"
          items-per-page="${this.teamsPerPage}"
          style="${totalPages <= 1 ? 'display: none;' : ''}">
        </team-pagination>
      </div>
    `;
    
    this.setupEventListeners();
  }
}

customElements.define('team-grid', TeamGrid);