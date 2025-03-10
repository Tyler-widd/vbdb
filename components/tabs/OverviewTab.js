class OverviewTab extends HTMLElement {
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
    
    getLeagueDescription(league) {
      const descriptions = {
        'NCAA Women': `
          NCAA Women's Volleyball is one of the most competitive collegiate sports in the United States. 
          The NCAA (National Collegiate Athletic Association) divides women's volleyball into three divisions, 
          with Division I being the highest level of competition. The sport has seen tremendous growth in popularity, 
          with packed arenas and increasing television coverage.
          
          The NCAA Women's Volleyball Championship is held annually in December, featuring 64 teams in a single-elimination 
          tournament. Since the championship began in 1981, teams like Stanford, Penn State, Nebraska, and UCLA have 
          established themselves as volleyball powerhouses.
        `,
        'NCAA Men': `
          NCAA Men's Volleyball has a smaller footprint than the women's game but features extremely high-level competition. 
          The NCAA sponsors men's volleyball in Divisions I and II combined, along with Division III. Due to Title IX and other factors, 
          there are fewer than 25 Division I-II men's volleyball programs in the country.
          
          The NCAA Men's Volleyball Championship features a seven-team tournament held each May. Traditional powerhouses include 
          UCLA, Long Beach State, Hawaii, and Ohio State. The sport continues to grow, with more universities adding programs 
          as boys' volleyball participation increases at the high school level.
        `,
        'LOVB': `
          League One Volleyball (LOVB) is a new professional women's volleyball league in the United States launched in 2022. 
          The league is designed to create a sustainable professional path for volleyball athletes while building community-based teams 
          across the country.
          
          LOVB features teams like Atlanta Vibe, Omaha Supernovas, Grand Rapids Rise, and Houston Skywalkers. The league 
          operates with a unique structure that combines national professional teams with local volleyball clubs, creating a 
          development pathway from youth volleyball to the professional level.
        `,
        'PVF Pro': `
          The Professional Volleyball Federation (PVF) is a women's professional volleyball league in the United States that 
          began play in January 2024. The league aims to provide the highest level of professional volleyball in North America 
          with competitive salaries and benefits for players.
          
          PVF Pro launched with seven teams, including the Orlando Valkyries, Vegas Thrill, Columbus Fury, and San Diego Mojo. 
          With an emphasis on creating an exciting fan experience and building sustainable team operations, the PVF represents 
          a significant step forward for professional volleyball in the United States.
        `
      };
      
      return descriptions[league] || 'Information about this league will be coming soon.';
    }
    
    render() {
      const league = this.getAttribute('league');
      const description = this.getLeagueDescription(league);
      
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
          }
          
          .content-layout {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          @media (min-width: 768px) {
            .content-layout {
              grid-template-columns: 2fr 1fr;
            }
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
          
          p {
            line-height: 1.6;
            margin-bottom: 1rem;
          }
          
          .news-section {
            margin-top: 2rem;
          }
          
          .news-item {
            padding-bottom: 1rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .news-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          
          .news-date {
            color: var(--text-secondary, #aaaaaa);
            font-size: 0.8rem;
          }
          
          .news-title {
            font-size: 1.1rem;
            margin: 0.5rem 0;
            color: var(--text, #e0e0e0);
          }
        </style>
        
        <div class="content-layout">
          <div class="content-card">
            <h2>About ${league}</h2>
            <p>${description}</p>
          </div>
          
          <div class="content-card">
            <h2>Recent News</h2>
            <div class="news-section">
              <div class="news-item">
                <div class="news-date">March 5, 2025</div>
                <h3 class="news-title">Championship Tournament Announced</h3>
                <p>The ${league} championship tournament dates have been announced, with matches beginning April 15th.</p>
              </div>
              
              <div class="news-item">
                <div class="news-date">February 28, 2025</div>
                <h3 class="news-title">All-Conference Teams Selected</h3>
                <p>The ${league} has announced the All-Conference selections for the 2024-2025 season, highlighting outstanding players.</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  customElements.define('overview-tab', OverviewTab);