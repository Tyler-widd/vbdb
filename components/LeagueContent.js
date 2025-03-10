class LeagueContent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  
    static get observedAttributes() {
      return ['level'];
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'level') {
        this.render();
      }
    }
  
    connectedCallback() {
      this.render();
    }
  
    render() {
      const level = this.getAttribute('level') || '';
      
      let content = '';
      
      // Simple content switching based on level
      switch(level) {
        case 'NCAA Women':
          content = 'NCAA Women Content';
          break;
        case 'NCAA Men':
          content = 'NCAA Men Content';
          break;
        case 'LOVB':
          content = 'LOVB Content';
          break;
        case 'PVF Pro':
          content = 'PVF Pro Content';
          break;
        default:
          content = 'Select a league to view content';
      }
  
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
          }
          
          .league-content {
            background-color: var(--card-bg, #1e1e1e);
            border-radius: 12px;
            padding: 2rem;
            margin-top: 2rem;
            color: var(--text, #e0e0e0);
            animation: fadeIn 0.5s ease forwards;
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
          
          h2 {
            margin-top: 0;
            color: var(--accent, #5ca5c7);
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
          }
          
          @media (max-width: 768px) {
            .league-content {
              padding: 1.5rem;
            }
            
            h2 {
              font-size: 1.5rem;
            }
          }
        </style>
        <div class="league-content">
          <h2>${level}</h2>
          <div>${content}</div>
        </div>
      `;
    }
  }
  
  customElements.define('league-content', LeagueContent);