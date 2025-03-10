class LeagueCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['level', 'title', 'icon-src', 'icon-type', 'delay'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.shadowRoot.querySelector('.league-card')) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
    
    // Add animation class after a small delay
    setTimeout(() => {
      const card = this.shadowRoot.querySelector('.league-card');
      if (card) {
        card.classList.add('animate');
        
        // Add click event listener
        card.addEventListener('click', this.handleClick.bind(this));
      }
    }, 10);
  }

  handleClick() {
    const level = this.getAttribute('level');
    
    // Add subtle click animation
    const card = this.shadowRoot.querySelector('.league-card');
    card.classList.add('clicked');
    
    // Remove the class after animation completes
    setTimeout(() => {
      card.classList.remove('clicked');
    }, 300);
    
    // Create a custom event to communicate with parent components
    const event = new CustomEvent('league-selected', {
      bubbles: true,
      composed: true, // Allows the event to cross the shadow DOM boundary
      detail: { level }
    });
    
    this.dispatchEvent(event);
  }

  render() {
    const level = this.getAttribute('level') || '';
    const title = this.getAttribute('title') || level;
    const iconSrc = this.getAttribute('icon-src') || '';
    const iconType = this.getAttribute('icon-type') || 'img';
    const delay = this.getAttribute('delay') || '0';
    
    // Calculate animation delay
    const animationDelay = parseFloat(delay) * 0.2;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }
        
        .league-card {
          background-color: var(--card-bg, #1e1e1e);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
          height: 100%;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          color: var(--text, #e0e0e0);
        }
        
        .league-card.animate {
          animation: fadeInOpacity 0.8s ease forwards, fadeInMovement 0.8s ease;
          animation-delay: ${animationDelay}s, ${animationDelay}s;
        }
        
        .league-card.clicked {
          transform: scale(0.97);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        @keyframes fadeInOpacity {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
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
        
        .league-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(to right, var(--accent, #5ca5c7), var(--accent-hover, #7577cd));
          transition: height 0.3s ease;
        }
        
        .league-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        
        .league-card:hover::before {
          height: 6px;
        }
        
        .league-icon {
          height: 150px;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
        }
        
        .league-icon img {
          max-height: 150px;
          width: auto;
          object-fit: contain;
        }
        
        ::slotted(svg) {
          height: 150px;
          width: auto;
        }
        
        .league-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          flex-shrink: 0;
        }
        
        @media (max-width: 768px) {
          .league-card {
            padding: 1.5rem;
            height: 100%;
          }
          
          .league-icon {
            height: 120px;
          }
          
          .league-icon img, ::slotted(svg) {
            max-height: 120px;
          }
          
          .league-title {
            font-size: 1.3rem;
          }
        }
      </style>
      <div class="row">
      <div class="league-card" data-level="${level}">
        <div class="league-icon">
          ${iconType === 'svg' 
            ? `<slot name="icon"></slot>` 
            : `<img src="${iconSrc}" alt="${title}">`}
        </div>
        <h3 class="league-title">${title}</h3>
      </div>
      </div>
    `;
  }
}

customElements.define('league-card', LeagueCard);