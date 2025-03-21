class PlayersTab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.players = [];
    this.isLoading = true;
    this.currentPage = 1;
    this.playersPerPage = 10;
    this.sortColumn = 'name';
    this.sortDirection = 'asc';
    this.filterText = '';
    this.debounceTimer = null;
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
  
  disconnectedCallback() {
    // Clear any pending debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
  
  async loadData() {
    this.isLoading = true;
    this.render(); // Show loading state
    
    const league = this.getAttribute('league');
    if (league) {
      try {
        // Import dynamically to avoid issues with module loading
        const { fetchPlayers } = await import('../../data/players.js');
        this.players = await fetchPlayers(league);
        
        // Filter out staff members
        this.players = this.players.filter(player => player.jersey !== 'Staff');
      } catch (error) {
        console.error('Error loading player data:', error);
        this.players = [];
      }
      
      this.isLoading = false;
      this.render();
      this.setupEventListeners();
    }
  }
  
  getPositionFullName(pos) {
    const positions = {
      'OH': 'Outside Hitter',
      'MB': 'Middle Blocker',
      'S': 'Setter',
      'L': 'Libero',
      'DS': 'Defensive Specialist',
      'OPP': 'Opposite Hitter'
    };
    
    return positions[pos] || pos;
  }
  
  formatTeamName(teamId) {
    if (!teamId) return '';
    // Convert team-id-format to Team Name Format
    return teamId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace('Lovb ', '');
  }
  
  setupEventListeners() {
    // Search functionality
    const searchInput = this.shadowRoot.querySelector('.player-search input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        // Clear any existing timer
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        
        // Capture the search value immediately
        const searchValue = e.target.value.toLowerCase().trim();
        
        // Set debounce timer
        this.debounceTimer = setTimeout(() => {
          this.filterText = searchValue;
          this.currentPage = 1; // Reset to first page
          this.renderTable();
        }, 300);
      });
    }
    
    // Sort functionality
    const tableHeaders = this.shadowRoot.querySelectorAll('th.sortable');
    if (tableHeaders) {
      tableHeaders.forEach(header => {
        header.addEventListener('click', this.handleSort.bind(this));
      });
    }
    
    // Pagination
    const prevButton = this.shadowRoot.querySelector('.prev-page');
    const nextButton = this.shadowRoot.querySelector('.next-page');
    
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderTable();
        }
      });
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        const totalPages = Math.ceil(this.getFilteredPlayers().length / this.playersPerPage);
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderTable();
        }
      });
    }
    
    // Page size selector
    const pageSizeSelector = this.shadowRoot.querySelector('.page-size-selector');
    if (pageSizeSelector) {
      pageSizeSelector.addEventListener('change', (e) => {
        this.playersPerPage = parseInt(e.target.value);
        this.currentPage = 1; // Reset to first page
        this.renderTable();
      });
    }
  }
  
  getFilteredPlayers() {
    if (!this.filterText) {
      return this.players;
    }
    
    return this.players.filter(player => {
      // Check name (always present)
      const nameMatch = player.name.toLowerCase().includes(this.filterText);
      
      // Check position (might be empty)
      const positionMatch = player.position ? 
        player.position.toLowerCase().includes(this.filterText) : false;
      
      // Check team name
      const teamName = player.team_id ? this.formatTeamName(player.team_id).toLowerCase() : '';
      const teamMatch = teamName.includes(this.filterText);
      
      // Check hometown (might be empty)
      const hometownMatch = player.hometown ? 
        player.hometown.toLowerCase().includes(this.filterText) : false;
      
      // Return true if any field matches
      return nameMatch || positionMatch || teamMatch || hometownMatch;
    });
  }
  
  handleSort(e) {
    const column = e.currentTarget.dataset.column;
    
    if (this.sortColumn === column) {
      // Toggle direction if same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.renderTable();
  }
  
  sortPlayers(players) {
    // Create a sorted copy
    return [...players].sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];
      
      // Handle special case for team_id (display formatted name)
      if (this.sortColumn === 'team_id') {
        valueA = this.formatTeamName(valueA || '');
        valueB = this.formatTeamName(valueB || '');
      }
      
      // Handle empty values
      if (valueA === undefined || valueA === null) valueA = '';
      if (valueB === undefined || valueB === null) valueB = '';
      
      // Handle numeric values
      if (this.sortColumn === 'jersey') {
        valueA = parseInt(valueA) || 0;
        valueB = parseInt(valueB) || 0;
      } else {
        valueA = String(valueA).toLowerCase();
        valueB = String(valueB).toLowerCase();
      }
      
      // Compare based on direction
      if (this.sortDirection === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
  }
  
  renderTable() {
    const tableBody = this.shadowRoot.querySelector('tbody');
    const filteredPlayers = this.getFilteredPlayers();
    const sortedPlayers = this.sortPlayers(filteredPlayers);
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredPlayers.length / this.playersPerPage);
    const startIndex = (this.currentPage - 1) * this.playersPerPage;
    const visiblePlayers = sortedPlayers.slice(startIndex, startIndex + this.playersPerPage);
    
    // Update table headers
    const headers = this.shadowRoot.querySelectorAll('th.sortable');
    headers.forEach(header => {
      const column = header.dataset.column;
      // Clear all sort indicators
      header.classList.remove('sort-asc', 'sort-desc');
      
      // Add current sort indicator
      if (column === this.sortColumn) {
        header.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
    
    // Update table body
    if (tableBody) {
      tableBody.innerHTML = '';
      
      if (visiblePlayers.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td colspan="6" class="no-results">No players match your search criteria</td>
        `;
        tableBody.appendChild(row);
      } else {
        visiblePlayers.forEach(player => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="name-col">
              <div class="player-name">
                ${player.profile_url ? 
                  `<a href="${player.profile_url}" target="_blank" class="player-link" title="View ${player.name}'s profile">
                    ${player.jersey} - ${player.name}
                  </a>` : 
                  player.name
                }
              </div>
            </td>
            <td class="position-col">${player.position || '-'}</td>
            <td class="height-col">${player.height || '-'}</td>
            <td class="year-col">${player.class_year || '-'}</td>
            <td class="hometown-col hide-mobile">${player.hometown || '-'}</td>
            <td class="team-col">${this.formatTeamName(player.team_short)}</td>
          `;
          tableBody.appendChild(row);
        });
      }
    }
    
    // Update pagination info
    const paginationInfo = this.shadowRoot.querySelector('.pagination-info');
    if (paginationInfo) {
      paginationInfo.textContent = `Showing ${filteredPlayers.length > 0 ? (startIndex + 1) : 0}-${Math.min(filteredPlayers.length, startIndex + this.playersPerPage)} of ${filteredPlayers.length} players`;
    }
    
    // Update pagination controls
    const prevButton = this.shadowRoot.querySelector('.prev-page');
    const nextButton = this.shadowRoot.querySelector('.next-page');
    const pageIndicator = this.shadowRoot.querySelector('.page-indicator');
    
    if (prevButton) {
      prevButton.disabled = this.currentPage <= 1;
    }
    
    if (nextButton) {
      nextButton.disabled = this.currentPage >= totalPages;
    }
    
    if (pageIndicator) {
      pageIndicator.textContent = `Page ${this.currentPage} of ${totalPages || 1}`;
    }
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
          <span>Loading player data...</span>
        </div>
      `;
      return;
    }
    
    this.shadowRoot.innerHTML = `
      <style>
          :host {
            display: block;
            width: 100%;
            box-sizing: border-box;
            padding: 0 10px;
          }
        
        .player-container {
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
        
          /* Filter and search */
          .filter-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 20px;
            gap: 12px; /* Add gap for better spacing */
          }
        
        .player-search {
          flex-grow: 1;
          max-width: 300px;
          position: relative;
        }
        
        .player-search input {
          width: 100%;
          padding: 10px 15px;
          padding-left: 36px; /* Left padding for icon from PlayersTab */
          border-radius: 5px;
          border: none;
          background-color: #2a2a2a; /* Background from TeamsTab */
          color: var(--text);
          font-size: 0.9rem;
        }

        
        .player-search input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(92, 165, 199, 0.5);
        }
                
        .player-search .search-icon {
          position: absolute;
          left: 10px; /* Left positioning from PlayersTab */
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.5);
          pointer-events: none; /* From TeamsTab */
        }
        
        .player-search .search-icon svg {
          width: 16px;
          height: 16px;
        }
        
        .search-box {
          flex-grow: 1;
          max-width: 300px;
          position: relative;
        }
        
        .search-box input {
          width: 100%;
          padding: 10px 15px;
          border-radius: 5px;
          border: none;
          background-color: #2a2a2a;
          color: var(--text);
          font-size: 0.9rem;
          padding-right: 40px; /* Space for the icon */
        }
            

        .table-container {
background-color: var(--card-bg, #1e1e1e);
color: var(--text, #e0e0e0);
          border-radius: 12px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
        }
        
        table {
          width: 100%;
          min-width: 700px;
          border-collapse: collapse;
          border-radius: 8px;
          overflow: hidden;
          table-layout: fixed;
          position: relative;
        }

        table::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, var(--accent, #7577cd), var(--accent-hover, #5ca5c7));
  transition: height 0.3s ease;
  z-index: 1; /* Ensure it appears above the table content */
}
        
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* Fixed column widths */
        .name-col {
          width: 50%;
        }
        
        .position-col {
          width: 5%;
        }
        
        .year-col {
          width: 5%;
        }
        
        .height-col {
          width: 5%;
        }
        
        .hometown-col {
          width: 15%;
        }
        
        .team-col {
          width: 15%;
        }
        
        th {
          background-color: rgba(0, 0, 0, 0.2);
          font-weight: 600;
          color: var(--text-secondary, #5ca5c7);
          position: relative;
        }
        
        th.sortable {
          cursor: pointer;
          user-select: none;
        }
        
        th.sortable:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
        
        th.sort-asc::after {
          content: '▲';
          display: inline-block;
          font-size: 0.7rem;
          vertical-align: middle;
        }
        
        th.sort-desc::after {
          content: '▼';
          display: inline-block;
          margin-left: 5px;
          font-size: 0.7rem;
          vertical-align: middle;
        }
        
        tbody tr:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        td.text-center {
          text-align: start;
        }
        
        .player-name {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        /* Player link styling */
        .player-link {
          color: var(--link-color);
          text-decoration: none;
          transition: color 0.2s, text-decoration 0.2s;
        }
        
        .player-link:hover {
          color: var(--accent-hover, #7577cd);
          text-decoration: underline;
        }
        
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
        }
        
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .pagination-info {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }
        
        .page-size {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }
        
        .page-size-selector {
            padding: 10px 35px 10px 15px; /* Increased right padding for dropdown arrow */
            border-radius: 5px;
            border: none;
            background-color: #2a2a2a;
            color: var(--text);
            min-width: 150px; /* Ensure dropdown has reasonable width */
            appearance: none; /* Remove default arrow */
            position: relative;
            background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23777777' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>");
            background-repeat: no-repeat;
            background-position: right 10px center;
          }
        
        button {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text, #e0e0e0);
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        button:disabled {
          background-color: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
        }
        
        .page-indicator {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .no-results {
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }
        
        @media (max-width: 768px) {
    .filter-container {
        flex-direction: column;
        align-items: stretch;
        gap: 15px; /* More spacing when stacked */
        width: 100%; /* Ensure full width */
    }
          .player-controls {
            flex-direction: column;
            align-items: strech;
          }
          
          .search-box {
              max-width: 100%; /* Make search box full width on mobile */
              width: 100%;
              margin-bottom: 0; /* Remove margin, use gap instead */
            }
            
            .page-size-selector {
              margin-left: 0;
              width: 100%; /* Full width on mobile */
            }

            /* Make input fields taller on mobile for easier tapping */
            .search-box input,
            .page-size-selector {
              padding: 12px 15px;
              font-size: 16px; /* Better size for mobile inputs */
            }

    .player-search {
        max-width: 100%; /* Make search box full width on mobile */
        width: 100%;
    }
            .player-search input {
        width: 100%;
        box-sizing: border-box; /* Add this to include padding in width calculation */
    }
          
          .pagination {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          
          .page-size {
            margin-bottom: 0.5rem;
          }
          
          th, td {
            padding: 10px;
          }
          
          /* Hide some columns on small screens */
          .hide-mobile {
            display: none;
          }
          
          /* Adjusted widths for mobile */
          .jersey-col {
            width: 40px;
          }
          
          .name-col {
            width: 40%;
          }
          
          .position-col {
            width: 60px;
          }
          
          .height-col {
            width: 60px;
          }
          
          .team-col {
            width: 30%;
          }
        }
      </style>
      
      <div class="player-container">
        <h1>${league} Players</h1>
        
        <div class="filter-container">

<div class="player-search">
    <div class="search-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    </div>
    <input type="text" placeholder="Search players, teams, position, hometown...">
</div>


        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="sortable name-col" data-column="name">Name</th>
                <th class="sortable position-col" data-column="position">Pos</th>
                <th class="sortable height-col" data-column="height">Hgt</th>
                <th class="sortable year-col" data-column="height">Yr</th>
                <th class="sortable hometown-col hide-mobile" data-column="hometown">Hometown</th>
                <th class="sortable team-col" data-column="team_id">Team</th>
              </tr>
            </thead>
            <tbody>
              <!-- Table body will be populated by renderTable() -->
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
          <div class="pagination-info">
          </div>
            <!-- Will be updated by renderTable() -->
          </div>
          
          <div class="pagination-controls">
            <button class="prev-page">Previous</button>
            <span class="page-indicator">Page 1 of 1</span>
            <button class="next-page">Next</button>
            <div class="page-size">
            <select class="page-size-selector">
              <option value="10" selected>10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
        </div>
          </div>
          
      </div>
    `;
    
    // Initialize table
    this.renderTable();
    
    // Set up event listeners after rendering
    this.setupEventListeners();
  }
}

customElements.define('players-tab', PlayersTab);