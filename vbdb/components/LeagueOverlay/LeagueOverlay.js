// LeagueOverlay.js - Main overlay component for league pages with tabbed navigation

import { dataService } from '../../services/DataService.js';
import '../TeamGrid/index.js';
import './TabComponents.js';

export class LeagueOverlay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize properties
    this.selectedLeague = '';
    this.leagueDisplayName = '';
    this.leagueIconSrc = '';
    this.activeTab = 'teams'; // Default tab
    
    // Bind methods
    this.handleBackButton = this.handleBackButton.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleUrlChange = this.handleUrlChange.bind(this);
  }
  
  connectedCallback() {
    // Check if there's a league in the URL path
    this.checkUrlPath();
    
    // Listen for URL change events
    document.addEventListener('url-changed', this.handleUrlChange);
    document.addEventListener('league-selected', this.handleLeagueSelected.bind(this));
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }
  
  disconnectedCallback() {
    document.removeEventListener('url-changed', this.handleUrlChange);
    document.removeEventListener('league-selected', this.handleLeagueSelected.bind(this));
    window.removeEventListener('popstate', this.handlePopState.bind(this));
  }
  
  handlePopState(event) {
    this.checkUrlPath();
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
        this.leagueDisplayName = league;
        this.leagueIconSrc = this.getLeagueIconSrc(league);
        this.showOverlay();
      } else {
        // If the slug doesn't match any league, hide overlay
        this.hideOverlay();
      }
    } else {
      // No league in URL, hide overlay
      this.hideOverlay();
    }
  }
  
  handleUrlChange(event) {
    const { slug } = event.detail;
    const league = dataService.getLeagueFromSlug(slug);
    
    if (league) {
      this.selectedLeague = dataService.getLeagueApiValue(league);
      this.leagueDisplayName = league;
      this.leagueIconSrc = this.getLeagueIconSrc(league);
      this.showOverlay();
    }
  }
  
  handleLeagueSelected(event) {
    const { level } = event.detail;
    this.selectedLeague = dataService.getLeagueApiValue(level);
    this.leagueDisplayName = level;
    this.leagueIconSrc = this.getLeagueIconSrc(level);
    this.showOverlay();
  }
  
  getLeagueIconSrc(leagueName) {
    // Map league names to icon sources
    const iconMap = {
      'NCAA Women': 'assets/ncaaW.svg',
      'NCAA Men': 'assets/ncaaM.svg',
      'LOVB': 'assets/lovb.svg',
      'PVF Pro': 'assets/pvf.png'
    };
    
    return iconMap[leagueName] || '';
  }
  
  showOverlay() {
    // Hide league section and hero section
    const leagueSection = document.getElementById('league-section');
    if (leagueSection) leagueSection.style.display = 'none';
    
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) heroSection.style.display = 'none';
    
    // Make our overlay active
    this.classList.add('active');
    
    // Render after setting league info
    this.render();
    this.setupEventListeners();
    
    // Animate the overlay
    setTimeout(() => {
      const container = this.shadowRoot.querySelector('.league-content-container');
      if (container) container.classList.add('active');
    }, 50);
  }
  
  hideOverlay() {
    // Show league section and hero section
    const leagueSection = document.getElementById('league-section');
    if (leagueSection) leagueSection.style.display = 'block';
    
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) heroSection.style.display = 'block';
    
    // Hide our overlay
    this.classList.remove('active');
    
    // Remove the active class from content container for animation
    const container = this.shadowRoot.querySelector('.league-content-container');
    if (container) container.classList.remove('active');
  }
  
  handleBackButton() {
    // Navigate to home URL
    window.history.pushState(null, '', '/');
    
    // Hide our overlay
    this.hideOverlay();
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  handleTabClick(event) {
    const tab = event.target.dataset.tab;
    if (tab && tab !== this.activeTab) {
      this.activeTab = tab;
      this.render();
      this.setupEventListeners();
    }
  }
  
  setupEventListeners() {
    // Back button listener
    const backButton = this.shadowRoot.querySelector('.back-button');
    if (backButton) {
      backButton.addEventListener('click', this.handleBackButton);
    }
    
    // Tab navigation listeners
    const tabLinks = this.shadowRoot.querySelectorAll('.league-nav a');
    tabLinks.forEach(link => {
      link.addEventListener('click', this.handleTabClick);
    });
  }
  
  render() {
    if (!this.selectedLeague) {
      this.shadowRoot.innerHTML = '';
      return;
    }
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.85);
          z-index: 1000;
          display: none;
          overflow-y: auto;
        }
        
        :host(.active) {
          display: block;
        }
        
        .league-content-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          background-color: var(--dark-bg, #121212);
          min-height: 100vh;
          transform: translateY(50px);
          opacity: 0;
          transition: transform 0.5s ease, opacity 0.5s ease;
          padding: 20px;
        }
        
        .league-content-container.active {
          transform: translateY(0);
          opacity: 1;
        }
        
        .league-header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }
        
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
          transition: background-color 0.2s ease;
        }
        
        .back-button:hover {
          background-color: #333;
        }
        
        .back-button i {
          margin-right: 8px;
        }
        
        .league-title-container {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-grow: 1;
        }
        
        .league-icon {
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .league-icon img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .league-title-container h1 {
          color: var(--accent, #5ca5c7);
          margin: 0;
          font-size: 1.8rem;
        }
        
        .league-nav {
          margin-bottom: 20px;
          border-bottom: 1px solid #333;
        }
        
        .league-nav ul {
          display: flex;
          list-style: none;
          padding: 0;
          margin: 0;
          overflow-x: auto;
        }
        
        .league-nav li {
          margin-right: 5px;
        }
        
        .league-nav a {
          display: block;
          padding: 10px 15px;
          color: var(--text-secondary, #aaaaaa);
          text-decoration: none;
          border-bottom: 3px solid transparent;
          font-weight: 500;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .league-nav a:hover {
          color: var(--text, #e0e0e0);
        }
        
        .league-nav a.active {
          color: var(--accent, #5ca5c7);
          border-bottom-color: var(--accent, #5ca5c7);
        }
        
        .tab-content-container {
          min-height: 500px;
        }
        
        .tab-content {
          display: none;
          animation: fadeIn 0.5s ease;
        }
        
        .tab-content.active {
          display: block;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .league-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .league-nav {
            overflow-x: auto;
            width: 100%;
          }
          
          .league-nav ul {
            width: max-content;
            min-width: 100%;
          }
          
          .league-content-container {
            padding: 15px;
          }
        }
      </style>
      
      <div class="league-content-container">
        <div class="league-header">
          <button class="back-button">
            <i class="fas fa-arrow-left"></i> Back
          </button>
          <div class="league-title-container">
            <div class="league-icon">
              <img src="${this.leagueIconSrc}" alt="${this.leagueDisplayName}">
            </div>
            <h1>${this.leagueDisplayName}</h1>
          </div>
        </div>
        
        <div class="league-data">
          <nav class="league-nav">
            <ul>
              <li><a href="#" data-tab="overview" class="${this.activeTab === 'overview' ? 'active' : ''}">Overview</a></li>
              <li><a href="#" data-tab="teams" class="${this.activeTab === 'teams' ? 'active' : ''}">Teams</a></li>
              <li><a href="#" data-tab="players" class="${this.activeTab === 'players' ? 'active' : ''}">Players</a></li>
              <li><a href="#" data-tab="standings" class="${this.activeTab === 'standings' ? 'active' : ''}">Standings</a></li>
              <li><a href="#" data-tab="schedule" class="${this.activeTab === 'schedule' ? 'active' : ''}">Schedule</a></li>
            </ul>
          </nav>
          
          <div class="tab-content-container">
            <!-- Overview Tab -->
            <div class="tab-content ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
              <overview-tab league="${this.selectedLeague}"></overview-tab>
            </div>
            
            <!-- Teams Tab -->
            <div class="tab-content ${this.activeTab === 'teams' ? 'active' : ''}" data-tab="teams">
              <teams-tab league="${this.selectedLeague}"></teams-tab>
            </div>
            
            <!-- Players Tab -->
            <div class="tab-content ${this.activeTab === 'players' ? 'active' : ''}" data-tab="players">
              <players-tab league="${this.selectedLeague}"></players-tab>
            </div>
            
            <!-- Standings Tab -->
            <div class="tab-content ${this.activeTab === 'standings' ? 'active' : ''}" data-tab="standings">
              <standings-tab league="${this.selectedLeague}"></standings-tab>
            </div>
            
            <!-- Schedule Tab -->
            <div class="tab-content ${this.activeTab === 'schedule' ? 'active' : ''}" data-tab="schedule">
              <schedule-tab league="${this.selectedLeague}"></schedule-tab>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
  }
}

customElements.define('league-overlay', LeagueOverlay);