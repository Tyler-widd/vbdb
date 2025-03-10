class TeamsTab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadedData = null;
    this.currentPage = 1;
    this.teamsPerPage = this.isMobile() ? 10 : 12;
    this.filteredTeams = [];
    this.searchDebounceTimer = null;
    this.isSearching = false;

    // Add resize listener
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  // Check if on mobile device
  isMobile() {
    return window.innerWidth <= 768;
  }

  // Handle window resize
  handleResize() {
    const newTeamsPerPage = this.isMobile() ? 10 : 12;
    if (this.teamsPerPage !== newTeamsPerPage) {
      this.teamsPerPage = newTeamsPerPage;
      this.renderTeamsList();
    }
  }

  static get observedAttributes() {
    return ['league'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'league' && oldValue !== newValue) {
      this.currentPage = 1;
      this.render();
    }
  }

  connectedCallback() {
    document.addEventListener('teams-data-loaded', this.handleDataLoaded.bind(this));
    document.addEventListener('teams-data-error', this.handleDataError.bind(this));
    this.render();
  }

  disconnectedCallback() {
    document.removeEventListener('teams-data-loaded', this.handleDataLoaded.bind(this));
    document.removeEventListener('teams-data-error', this.handleDataError.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));

    // Clear any pending debounce timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  handleDataLoaded(event) {
    this.loadedData = event.detail.teamsData;
    this.render();
  }

  handleDataError(event) {
    console.error('Error loading team data:', event.detail.error);
    this.renderError('Failed to load team data. Please try again later.');
  }

  renderError(message) {
    this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
          }
          
          .error {
            background-color: #2a2a2a;
            color: #e74c3c;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin: 2rem auto;
            max-width: 500px;
          }
        </style>
        
        <div class="error">
          <p>${message}</p>
        </div>
      `;
  }

  setupEventListeners() {
    // Search functionality with debounce
    const searchInput = this.shadowRoot.querySelector('.team-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounceSearch.bind(this));
    }

    // Division filter
    const divisionFilter = this.shadowRoot.querySelector('.division-filter');
    if (divisionFilter) {
      divisionFilter.addEventListener('change', this.handleDivisionFilter.bind(this));
    }

    // Pagination buttons
    const prevButton = this.shadowRoot.querySelector('.page-prev');
    const nextButton = this.shadowRoot.querySelector('.page-next');
    const pageLinks = this.shadowRoot.querySelectorAll('.page-link');

    if (prevButton) {
      prevButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.currentPage > 1) {
          this.changePage(this.currentPage - 1);
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', (e) => {
        e.preventDefault();
        const totalPages = Math.ceil(this.filteredTeams.length / this.teamsPerPage);
        if (this.currentPage < totalPages) {
          this.changePage(this.currentPage + 1);
        }
      });
    }

    if (pageLinks) {
      pageLinks.forEach(link => {
        if (!link.parentElement.classList.contains('disabled') &&
          !link.parentElement.classList.contains('active') &&
          link.getAttribute('data-page')) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.getAttribute('data-page'));
            this.changePage(page);
          });
        }
      });
    }

    // Team card click for opening team info page
    const teamCards = this.shadowRoot.querySelectorAll('.team-card');
    teamCards.forEach(card => {
      card.addEventListener('click', () => {
        // Get team information
        const teamName = card.querySelector('.team-name').textContent;
        const league = this.getAttribute('league');

        // Dispatch custom event for team selection
        const event = new CustomEvent('team-selected', {
          bubbles: true,
          composed: true,
          detail: {
            teamName,
            league
          }
        });
        this.dispatchEvent(event);
      });
    });

    // Visit team button separate click handler
    const teamButtons = this.shadowRoot.querySelectorAll('.team-btn');
    teamButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        const url = btn.closest('.team-card').getAttribute('data-url');
        if (url) {
          let fullUrl = url;
          if (!fullUrl.startsWith('http')) {
            fullUrl = 'https://' + fullUrl;
          }
          window.open(fullUrl, '_blank');
        }
      });
    });
  }

  // Debounce search to improve performance
  debounceSearch(e) {
    // Capture the search value immediately, before setting timeout
    const searchValue = e.target?.value || '';

    // Show loading indicator
    this.setSearchingState(true);

    // Clear any existing timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // Set a new timer
    this.searchDebounceTimer = setTimeout(() => {
      // Use the captured value instead of accessing event in the callback
      const searchTerm = searchValue.toLowerCase();
      this.currentPage = 1; // Reset to first page when searching

      // Safely get division filter value
      const divisionFilter = this.shadowRoot.querySelector('.division-filter')?.value || 'all';

      this.applyFilters(searchTerm, divisionFilter);
      this.setSearchingState(false);
    }, 300); // 300ms delay for better performance
  }

  // Show/hide search loading indicator
  setSearchingState(isSearching) {
    this.isSearching = isSearching;

    const searchIcon = this.shadowRoot.querySelector('.search-icon');
    const loadingIcon = this.shadowRoot.querySelector('.loading-icon');

    if (searchIcon && loadingIcon) {
      searchIcon.style.display = isSearching ? 'none' : 'block';
      loadingIcon.style.display = isSearching ? 'block' : 'none';
    }
  }

  handleDivisionFilter(e) {
    // Show loading indicator
    this.setSearchingState(true);

    const divisionValue = e.target.value;
    this.currentPage = 1; // Reset to first page when filtering

    // Add small delay to show the loading state
    setTimeout(() => {
      this.applyFilters(this.shadowRoot.querySelector('.team-search')?.value.toLowerCase(), divisionValue);
      this.setSearchingState(false);
    }, 50);
  }

  applyFilters(searchTerm = '', divisionFilter = 'all') {
    const league = this.getAttribute('league');
    const data = this.loadedData || window.vbdbData?.teamsData;

    if (!data || !data[league]) {
      this.filteredTeams = [];
      this.renderTeamsList();
      return;
    }

    const allTeams = data[league] || [];

    // Make sure searchTerm is a string even if undefined
    searchTerm = searchTerm || '';

    // Apply filters - optimized to avoid unnecessary work
    if (searchTerm === '' && divisionFilter === 'all') {
      // No filters applied, use all teams
      this.filteredTeams = allTeams;
    } else {
      // Apply filters
      this.filteredTeams = allTeams.filter(team => {
        // Check team name - make sure it exists
        let matchesNameSearch = false;
        if (team.name) {
          matchesNameSearch = team.name.toLowerCase().includes(searchTerm);
        }

        // Check conference - safely with proper existence check
        let matchesConfSearch = false;
        if (team.conference) {
          matchesConfSearch = team.conference.toLowerCase().includes(searchTerm);
        }

        // Combine search results
        const matchesSearch = searchTerm === '' || matchesNameSearch || matchesConfSearch;

        // Check division
        const matchesDivision = divisionFilter === 'all' || team.division === divisionFilter;

        return matchesSearch && matchesDivision;
      });
    }

    // Re-render with filtered data
    this.renderTeamsList();
  }

  changePage(page) {
    const totalPages = Math.ceil(this.filteredTeams.length / this.teamsPerPage);

    // Make sure page is within valid range
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    if (page !== this.currentPage) {
      this.currentPage = page;
      this.renderTeamsList();

      // Scroll to top of component
      this.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getFirstLetterPlaceholder(name) {
    return name.charAt(0).toUpperCase();
  }

  getDivisionFilterOptions(teams) {
    const divisions = [...new Set(teams.filter(team => team.division).map(team => team.division))];
    return divisions.map(div => `<option value="${div}">${div}</option>`).join('');
  }

  renderTeamsList() {
    const league = this.getAttribute('league');
    const data = this.loadedData || window.vbdbData?.teamsData;

    if (!data || !data[league]) return;

    const allTeams = data[league] || [];
    const teams = this.filteredTeams.length > 0 ? this.filteredTeams : allTeams;

    // Preload team images in the background
    this.preloadTeamImages(teams);

    // Calculate pagination
    const totalPages = Math.ceil(teams.length / this.teamsPerPage);
    const startIndex = (this.currentPage - 1) * this.teamsPerPage;
    const endIndex = Math.min(startIndex + this.teamsPerPage, teams.length);
    const currentTeams = teams.slice(startIndex, endIndex);

    // Get container and update team grid
    const teamContainer = this.shadowRoot.querySelector('.team-container');
    const teamGrid = this.shadowRoot.querySelector('.team-grid');
    const paginationContainer = this.shadowRoot.querySelector('.pagination-container');
    const pageInfo = this.shadowRoot.querySelector('.page-info');

    if (teamGrid) {
      // Clear existing content first
      teamGrid.innerHTML = '';

      // Batch DOM updates
      const fragment = document.createDocumentFragment();

      currentTeams.forEach(team => {
        // Create team card element
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.setAttribute('data-url', team.url || '');
        teamCard.setAttribute('data-team-id', team.id || '');

        // Determine logo content
        let logoContent;
        if (team.img && team.img.includes('<svg')) {
          // If it's SVG content
          logoContent = team.img;
        } else if (team.img) {
          // If it's an image URL
          logoContent = `<img src="${team.img}" alt="${team.name}" onerror="this.src='https://raw.githubusercontent.com/widbuntu/vbdb-info/refs/heads/main/assets/favicon.svg'; this.onerror=null;">`;
        } else {
          // If no image is available
          logoContent = `<div class="placeholder-logo">${this.getFirstLetterPlaceholder(team.name)}</div>`;
        }

        teamCard.innerHTML = `
            <div class="team-logo">
              ${logoContent}
            </div>
            <h3 class="team-name">${team.name}</h3>
            <div class="team-info">
              ${team.conference ? `<p>Conf: ${team.conference}</p>` : ''}
              ${team.division ? `<p>Div: ${team.division}</p>` : ''}
            </div>
            <button class="team-btn">Visit Team</button>
          `;

        fragment.appendChild(teamCard);
      });

      // Add all cards at once to minimize reflows
      teamGrid.appendChild(fragment);

      // Update pagination if needed
      if (paginationContainer) {
        // Create pagination links
        const pagination = this.createPagination(totalPages);
        const paginationElement = paginationContainer.querySelector('.pagination');
        if (paginationElement) {
          paginationElement.innerHTML = pagination;
        }

        paginationContainer.style.display = totalPages > 1 ? 'block' : 'none';
      }

      // Update page info
      if (pageInfo) {
        const start = startIndex + 1;
        const end = endIndex;
        const resultText = this.isSearching
          ? 'Searching...'
          : `Showing ${start} to ${end} of ${teams.length} teams (Page ${this.currentPage} of ${totalPages || 1})`;

        pageInfo.textContent = resultText;
      }

      // Setup event listeners
      this.setupEventListeners();
    } else {
      // Full render needed
      this.render();
    }
  }

  // Image preloading and caching system
  initImageCache() {
    // Create an image cache object if it doesn't exist
    if (!window.teamImageCache) {
      window.teamImageCache = {
        images: {},
        pending: {},
        failed: new Set()
      };
    }
  }

  preloadTeamImages(teams) {
    this.initImageCache();
    const cache = window.teamImageCache;

    teams.forEach(team => {
      if (!team.img) return;

      // Skip if we've already tried this image and it failed
      if (cache.failed.has(team.img)) return;

      // Skip if it's already cached or pending
      if (cache.images[team.img] || cache.pending[team.img]) return;

      // Skip if it's an SVG string
      if (team.img.includes('<svg')) {
        cache.images[team.img] = team.img;
        return;
      }

      // Set as pending
      cache.pending[team.img] = true;

      // Create new image object to preload
      const img = new Image();

      img.onload = () => {
        // Store in cache
        cache.images[team.img] = team.img;
        delete cache.pending[team.img];
      };

      img.onerror = () => {
        // Mark as failed
        cache.failed.add(team.img);
        delete cache.pending[team.img];
      };

      img.src = team.img;
    });
  }

  getTeamLogoContent(team) {
    this.initImageCache();
    const cache = window.teamImageCache;

    // Determine logo content
    let logoContent;

    if (team.img && team.img.includes('<svg')) {
      // If it's SVG content
      logoContent = team.img;
    } else if (team.img) {
      // Check if image is known to fail
      if (cache.failed.has(team.img)) {
        logoContent = `<div class="placeholder-logo">${this.getFirstLetterPlaceholder(team.name)}</div>`;
      } else {
        // If it's an image URL
        logoContent = `<img src="${team.img}" alt="${team.name}" 
        loading="lazy"
        onerror="
          this.onerror=null; 
          window.teamImageCache.failed.add('${team.img.replace(/'/g, "\\'")}');
          this.parentNode.innerHTML = '<div class=\\'placeholder-logo\\'>${this.getFirstLetterPlaceholder(team.name)}</div>';
        ">`;
      }
    } else {
      // If no image is available
      logoContent = `<div class="placeholder-logo">${this.getFirstLetterPlaceholder(team.name)}</div>`;
    }

    return logoContent;
  }

  createPagination(totalPages) {
    if (totalPages <= 1) return '';

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link page-prev" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
      `;

    // Page number links
    const startPage = Math.max(1, this.currentPage - 1);
    const endPage = Math.min(totalPages, startPage + 2);

    if (startPage > 1) {
      // First page
      paginationHTML += `
          <li class="page-item">
            <a class="page-link" href="#" data-page="1">1</a>
          </li>
        `;

      if (startPage > 2) {
        // Ellipsis
        paginationHTML += `
            <li class="page-item disabled">
              <span class="page-link">...</span>
            </li>
          `;
      }
    }

    // Page links
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
          <li class="page-item ${i === this.currentPage ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
          </li>
        `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        // Ellipsis
        paginationHTML += `
            <li class="page-item disabled">
              <span class="page-link">...</span>
            </li>
          `;
      }

      // Last page
      paginationHTML += `
          <li class="page-item">
            <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
          </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link page-next" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      `;

    return paginationHTML;
  }

  render() {
    const league = this.getAttribute('league');
    const data = this.loadedData || window.vbdbData?.teamsData;

    // If still loading or no data yet
    if (!data || !data[league] || data[league].length === 0) {
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

    // Initialize filtered teams if not already set
    if (this.filteredTeams.length === 0) {
      this.filteredTeams = data[league] || [];
    }

    // Calculate pagination
    const teams = this.filteredTeams;
    const totalPages = Math.ceil(teams.length / this.teamsPerPage);
    const startIndex = (this.currentPage - 1) * this.teamsPerPage;
    const endIndex = Math.min(startIndex + this.teamsPerPage, teams.length);
    const currentTeams = teams.slice(startIndex, endIndex);

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
          
          .team-card {
            background-color: var(--card-bg, #1e1e1e);
            border-radius: 10px;
            padding: 1.2rem 1rem;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 250px; /* Set a fixed height */
          }
          
          .team-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(to right, var(--accent, #5ca5c7), var(--accent-hover, #7577cd));
            transition: height 0.3s ease;
          }
          
          .team-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          }
          
          .team-card:hover::before {
            height: 5px;
          }
          
          .team-logo {
            height: 90px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 0.8rem;
            flex-shrink: 0; /* Prevent logo from shrinking */
          }
          
          .team-logo img {
            padding-top: 12px;
            max-height: 125px;
            max-width: 100px;
            object-fit: contain;
          }
          
          .team-logo svg {
            height: 60px;
            width: 60px;
            color: var(--accent, #5ca5c7);
          }
          
          .placeholder-logo {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--accent, #5ca5c7);
            font-size: 1.5rem;
            font-weight: bold;
          }
          
          .team-name {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: white;
            line-height: 1.2;
            min-height: 2.4rem; /* Provide space for 2 lines of text */
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .team-info {
            font-size: 0.8rem;
            color: #a0a0a0;
            margin-bottom: 0.8rem;
            flex-grow: 1;
            overflow: hidden; /* Hide overflow text */
          }
          
          .team-info p {
            margin-bottom: 0.3rem;
          }
          
          .team-btn {
            background: linear-gradient(to right, var(--accent, #5ca5c7), var(--accent-hover, #7577cd));
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            width: 100%;
            transition: transform 0.2s ease;
            margin-top: auto;
            font-size: 0.85rem;
          }
          
          .team-btn:hover {
            transform: translateY(-2px);
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
          
          .search-icon {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #777;
            pointer-events: none;
            width: 16px;
            height: 16px;
          }
          
          /* Custom search icon */
          .search-icon::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 10px;
            height: 10px;
            border: 2px solid #777;
            border-radius: 50%;
          }
          
          .search-icon::after {
            content: '';
            position: absolute;
            top: 8px;
            left: 8px;
            width: 2px;
            height: 6px;
            background: #777;
            transform: rotate(45deg);
          }
          
          .loading-icon {
            display: none;
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 20px;
            border: 2px solid rgba(92, 165, 199, 0.2);
            border-radius: 50%;
            border-top-color: var(--accent, #5ca5c7);
            animation: spin 0.8s linear infinite;
          }
          
          @keyframes spin {
            to { transform: translateY(-50%) rotate(360deg); }
          }
          
          .division-filter {
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
          
          /* No results message */
          .no-results {
            grid-column: 1 / -1;
            background-color: #2a2a2a;
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            color: var(--text-secondary, #aaaaaa);
          }
          
          /* Pagination */
          .pagination-container {
            background-color: #252525;
            padding: 1.2rem;
            border-radius: 10px;
            margin-top: 2rem;
            overflow-x: auto; /* Allow horizontal scrolling on small screens */
          }
          
          .page-info {
            color: #a0a0a0;
            text-align: center;
            margin-bottom: 0.8rem;
            font-size: 0.9rem;
            white-space: normal; /* Allow text to wrap */
          }
          
          .pagination {
            justify-content: center;
            list-style: none;
            display: flex;
            padding: 0;
            margin: 0;
            flex-wrap: wrap; /* Allow pagination to wrap on small screens */
            gap: 5px; /* Add gap between wrapped items */
          }
          
          .page-item {
            margin: 0 3px;
          }
          
          .page-link {
            background-color: var(--card-bg, #1e1e1e);
            color: var(--text, #e0e0e0);
            border: 1px solid #333;
            font-size: 0.9rem;
            padding: 0.4rem 0.7rem;
            display: block;
            text-decoration: none;
            border-radius: 4px;
            min-width: 40px;
            text-align: center;
          }
          
          .page-link:hover {
            background-color: #2a2a2a;
          }
          
          .page-item.active .page-link {
            background: linear-gradient(to right, var(--accent, #5ca5c7), var(--accent-hover, #7577cd));
            color: white;
            border-color: var(--accent, #5ca5c7);
          }
          
          .page-item.disabled .page-link {
            background-color: #1a1a1a;
            color: #777;
            border-color: #333;
            pointer-events: none;
          }
          
          /* Mobile responsiveness */
          @media (max-width: 768px) {
            .filter-container {
              flex-direction: column;
              align-items: stretch;
              gap: 15px; /* More spacing when stacked */
            }
            
            .search-box {
              max-width: 100%; /* Make search box full width on mobile */
              width: 100%;
              margin-bottom: 0; /* Remove margin, use gap instead */
            }
            
            .division-filter {
              margin-left: 0;
              width: 100%; /* Full width on mobile */
            }
            
            /* Make input fields taller on mobile for easier tapping */
            .search-box input,
            .division-filter {
              padding: 12px 15px;
              font-size: 16px; /* Better size for mobile inputs */
            }
            
            .team-grid {
              grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
              gap: 15px; /* Slightly reduced gap for mobile */
            }
            
            .team-card {
              height: 220px; /* Slightly smaller on mobile */
            }
            
            .team-logo {
              height: 70px; /* Reduced height for mobile */
            }
            
            .team-logo img {
              max-height: 60px; /* Smaller images on mobile */
              max-width: 60px;
            }
            
            /* Improved pagination on mobile */
            .pagination-container {
              padding: 0.8rem; /* Less padding on mobile */
            }
            
            .page-link {
              padding: 0.4rem 0.5rem; /* Smaller pagination buttons */
              min-width: 32px;
              font-size: 0.8rem;
            }
            
            .page-info {
              font-size: 0.75rem;
              padding: 0 0.5rem;
              line-height: 1.4;
            }
            
            /* Show fewer page numbers on mobile */
            .pagination {
              justify-content: center;
              flex-wrap: wrap;
              row-gap: 8px;
            }
            
            .page-item {
              margin: 0 2px; /* Less spacing between buttons */
            }
          }
          
          /* Extra small screens */
          @media (max-width: 400px) {
            .team-grid {
              grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
              gap: 10px;
            }
            
            .team-card {
              height: 200px;
              padding: 0.8rem 0.6rem;
            }
            
            .team-name {
              font-size: 0.9rem;
              min-height: 2.2rem;
            }
            
            .page-link {
              padding: 0.25rem 0.4rem;
              min-width: 28px;
              font-size: 0.75rem;
            }
          }
        </style>
        
        <div class="team-container">
          <h1>${league} Teams</h1>
          
          <div class="filter-container">
            <div class="search-box">
              <input type="text" class="team-search" placeholder="Search teams...">
              <div class="search-icon"></div>
              <div class="loading-icon"></div>
            </div>
            <select class="division-filter">
              <option value="all">All Divisions</option>
              ${this.getDivisionFilterOptions(data[league])}
            </select>
          </div>
          
          <div class="team-grid">
            ${currentTeams.length > 0 ? currentTeams.map(team => {
      // Determine logo content
      let logoContent;
      if (team.img && team.img.includes('<svg')) {
        // If it's SVG content
        logoContent = team.img;
      } else if (team.img) {
        // If it's an image URL
        logoContent = `<img src="${team.img}" alt="${team.name}" onerror="this.src='https://raw.githubusercontent.com/widbuntu/vbdb-info/refs/heads/main/assets/favicon.svg'; this.onerror=null;">`;
      } else {
        // If no image is available
        logoContent = `<div class="placeholder-logo">${this.getFirstLetterPlaceholder(team.name)}</div>`;
      }

      return `
                <div class="team-card" data-url="${team.url || ''}" data-team-id="${team.id || ''}">
                  <div class="team-logo">
                    ${logoContent}
                  </div>
                  <h3 class="team-name">${team.name}</h3>
                  <div class="team-info">
                    ${team.conference ? `<p>Conf: ${team.conference}</p>` : ''}
                    ${team.division ? `<p>Div: ${team.division}</p>` : ''}
                  </div>
                  <button class="team-btn">Visit Team</button>
                </div>
              `;
    }).join('') :
        `<div class="no-results">No teams match your search criteria. Try adjusting your filters.</div>`}
          </div>
          
          <div class="pagination-container" style="${totalPages <= 1 ? 'display: none;' : ''}">
            <div class="page-info">
              Showing ${startIndex + 1} to ${endIndex} of ${teams.length} teams (Page ${this.currentPage} of ${totalPages})
            </div>
            <nav>
              <ul class="pagination">
                ${this.createPagination(totalPages)}
              </ul>
            </nav>
          </div>
        </div>
      `;

    // Setup event listeners
    this.setupEventListeners();
  }
}

customElements.define('teams-tab', TeamsTab);