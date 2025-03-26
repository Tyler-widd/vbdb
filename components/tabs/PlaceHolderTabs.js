// Players Tab
class PlayersTab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  static get observedAttributes() {
    return ['league'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'league' && oldValue !== newValue) {
      this.render();
    }
  }
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    const league = this.getAttribute('league');
    
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
      
      <div class="content-card">
        <h2>${league} Players</h2>
        <p>Player information and statistics will be displayed here. This section is under development.</p>
      </div>
    `;
  }
}

// Standings Tab
class StandingsTab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  static get observedAttributes() {
    return ['league'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'league' && oldValue !== newValue) {
      this.render();
    }
  }
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    const league = this.getAttribute('league');
    
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
      
      <div class="content-card">
        <h2>${league} Standings</h2>
        <p>League standings and rankings will be displayed here. This section is under development.</p>
      </div>
    `;
  }
}

// Schedule Tab
class ScheduleTab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  static get observedAttributes() {
    return ['league'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'league' && oldValue !== newValue) {
      this.render();
    }
  }
  
  connectedCallback() {
    this.render();
  }
  
  render() {
    const league = this.getAttribute('league');
    
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
      
      <div class="content-card">
        <h2>${league} Schedule</h2>
        <p>Upcoming matches and results will be displayed here. This section is under development.</p>
      </div>
    `;
  }
}

// Register the components
customElements.define('players-tab', PlayersTab);
customElements.define('standings-tab', StandingsTab);
customElements.define('schedule-tab', ScheduleTab);
customElements.define('pvf-schedule-tab', PvfScheduleTab);