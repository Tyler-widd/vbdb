// League icons information
const leagueIcons = {
  'NCAA Women': 'https://www.ncaa.com/modules/custom/casablanca_core/img/sportbanners/volleyball-women.png',
  'NCAA Men': 'https://www.ncaa.com/modules/custom/casablanca_core/img/sportbanners/volleyball-men.svg',
  'LOVB': null,  // Special handling for SVG
  'PVF Pro': 'https://provolleyball.com/dist/assets/logo.afbb3762.png'
};

// LOVB SVG as a string
const lovbSvg = `
<svg fill="currentColor" height="100px" viewBox="0 0 127 40" width="100px" xmlns="http://www.w3.org/2000/svg">
  <path d="M37.0675 34.7316C30.1366 34.7316 25.2069 29.122 25.2069 21.9511C25.2069 14.8292 30.1366 9.17067 37.0675 9.17067C43.9985 9.17067 48.9771 14.8292 48.9771 21.9511C48.9771 29.122 43.7057 34.7316 37.0675 34.7316ZM37.0675 3.90255C26.5736 3.90255 19.5449 11.9024 19.5449 21.9511C19.5449 32.0001 26.5736 40 37.0675 40C47.5616 40 54.639 32.0001 54.639 21.9511C54.639 12.0487 47.5616 3.90255 37.0675 3.90255Z"></path>
  <path d="M70.8645 32.4878H70.7669L60.9561 4.39027H54.6597L68.0823 39.5122H73.5002L86.9228 4.39027H80.8704L70.8645 32.4878Z"></path>
  <path d="M5.46671 4.33233H0V39.5122H15.4427L20.6498 34.3413H5.46671V4.33233Z"></path>
  <path d="M109.812 29.9972L105.396 34.3901H96.1088V23.7072H101.01L105.396 19.3171H109.585C113.246 19.3171 115.296 21.4634 115.296 24.6341C115.296 27.7866 113.331 29.9101 109.812 29.9972ZM96.1088 9.51204H101.004L105.396 5.12188H109.293C112.319 5.12188 114.271 6.92683 114.271 9.65856C114.271 12.2874 112.657 14.044 109.799 14.2278L105.396 18.634H96.1088V9.51204ZM115.345 16.8293V16.7317C115.98 16.4878 119.933 13.9999 119.933 9.12195C119.933 3.65857 115.735 -7.62939e-06 110.122 -7.62939e-06H109.78L105.396 4.39029H90.6421V39.5121H101.001L105.396 35.1219H110.318C116.419 35.1219 120.958 31.0731 120.958 25.1219C120.958 20.0487 117.297 17.5121 115.345 16.8293Z"></path>
  <path d="M124.102 5.66608V5.02446H124.526C124.76 5.02446 124.888 5.13839 124.888 5.34531C124.888 5.55511 124.763 5.66608 124.526 5.66608H124.102ZM125.268 5.34531C125.268 4.92908 124.978 4.67054 124.511 4.67054H123.727V6.96912H124.102V6.02007H124.346L124.924 6.96912H125.359L124.739 5.99935C125.076 5.92518 125.268 5.68933 125.268 5.34531Z"></path>
  <path d="M124.485 7.38385C123.622 7.38385 122.92 6.68225 122.92 5.81988C122.92 4.95758 123.622 4.25598 124.485 4.25598C125.348 4.25598 126.05 4.95758 126.05 5.81988C126.05 6.68225 125.348 7.38385 124.485 7.38385ZM124.485 3.87621C123.412 3.87621 122.54 4.74814 122.54 5.81988C122.54 6.89163 123.412 7.76355 124.485 7.76355C125.557 7.76355 126.43 6.89163 126.43 5.81988C126.43 4.74814 125.557 3.87621 124.485 3.87621Z"></path>
</svg>
`;

// List of teams that need special handling for images
const specialTeams = [
  "Allegheny College",
  "Auburn University at Montgomery",
  "West Virginia University",
  "Baylor University",
  "Berry College",
  "West Liberty University",
  "University of California, Berkeley",
  "University of California, Davis",
  "University of Cincinnati",
  "University of Dallas",
  "University of Dubuque",
  "Duquesne University",
  "George Fox University",
  "Gordon College",
  "Hope College",
  "Howard University",
  "Howard Payne University",
  "University of Iowa",
  "Ithaca College",
  "Kansas State University",
  "Lake Forest College",
  "Le Moyne College",
  "Louisiana State University",
  "Michigan State University",
  "University of Nevada, Reno",
  "University of Notre Dame",
  "Oral Roberts Unviersity",
  "University of Portland",
  "Rice University",
  "College of Saint Benedict"
  // Add more team names as needed
];

// Initialize empty teams data
const teamsData = {
  'NCAA Women': [],
  'NCAA Men': [],
  'LOVB': [],
  'PVF Pro': []
};

// Function to process team data from any API
function processTeamData(data, leagueKey) {
  const processedTeams = [];
  
  // Process each team
  data.forEach((team, index) => {
    // Skip teams with invalid data
    if (!team || !team.name) return;
    
    // Create a unique ID if not present
    const id = team.team_id || `${leagueKey.toLowerCase().replace(/\s+/g, '-')}-${index}`;
    
    // Replace /bgl/ with /bgd/ in the img URL if it exists and team is in special list
    let imgUrl = team.img || '';
    if (imgUrl && typeof imgUrl === 'string') {
      // Check if team name is in specialTeams list
      if (specialTeams.includes(team.name)) {
        console.log(`Applying special image handling for: ${team.name}`);
        imgUrl = imgUrl.replace(/\/bgl\//g, '/bgd/');
      }
    }
    
    // Create team object with only the data from the JSON, ensuring no invalid values
    const teamObj = {
      team_id: team.team_id || id,
      id: team.team_id || id, // Add id for compatibility
      name: team.name || '',
      url: team.url || '',
      img: imgUrl, // Use the modified image URL
      division: (team.division && team.division !== 'NaN' && team.division !== 'null') ? team.division : '',
      conference: (team.conference && team.conference !== 'NaN' && team.conference !== 'null') ? team.conference : '',
      level: (team.level && team.level !== 'NaN' && team.level !== 'null') ? team.level : ''
    };
    
    processedTeams.push(teamObj);
  });
  
  return processedTeams;
}

// Helper function to fetch and process data from an endpoint
async function fetchAndProcessTeams(url, leagueKey) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok for ${leagueKey}: ${response.status}`);
    }
    
    // Get text first so we can fix the JSON
    const text = await response.text();
    
    // Fix NaN values in the JSON string before parsing
    const fixedText = text
      .replace(/: *NaN/g, ': null')
      .replace(/: *undefined/g, ': null');
    
    try {
      const data = JSON.parse(fixedText);
      return processTeamData(data, leagueKey);
    } catch (error) {
      console.error(`Error parsing JSON for ${leagueKey}:`, error);
      throw new Error(`Invalid JSON format after fixing NaN values for ${leagueKey}`);
    }
  } catch (error) {
    console.error(`Error fetching teams data for ${leagueKey}:`, error);
    // Return empty array on error so other fetches can still proceed
    return [];
  }
}

// Main function to fetch all team data
async function fetchAllTeams() {
  try {
    // Create promises for all endpoints
    const ncaaWomenPromise = fetchAndProcessTeams('https://api.volleyballdatabased.com/api/ncaaw_teams', 'NCAA Women');
    const ncaaMenPromise = fetchAndProcessTeams('https://api.volleyballdatabased.com/api/ncaam_teams', 'NCAA Men');
    const pvfPromise = fetchAndProcessTeams('https://api.volleyballdatabased.com/api/pvf_teams', 'PVF Pro');
    const lovbPromise = fetchAndProcessTeams('https://api.volleyballdatabased.com/api/lovb_teams', 'LOVB');
    
    // Wait for all promises to resolve
    const [ncaaWomen, ncaaMen, pvf, lovb] = await Promise.all([
      ncaaWomenPromise, 
      ncaaMenPromise, 
      pvfPromise, 
      lovbPromise
    ]);
    
    // Update the teamsData object
    teamsData['NCAA Women'] = ncaaWomen;
    teamsData['NCAA Men'] = ncaaMen;
    teamsData['PVF Pro'] = pvf;
    teamsData['LOVB'] = lovb;
    
    // Log success message
    const totalTeams = ncaaWomen.length + ncaaMen.length + pvf.length + lovb.length;
    console.log(`Loaded ${totalTeams} teams across all leagues`);
    console.log(`- NCAA Women: ${ncaaWomen.length} teams`);
    console.log(`- NCAA Men: ${ncaaMen.length} teams`);
    console.log(`- PVF Pro: ${pvf.length} teams`);
    console.log(`- LOVB: ${lovb.length} teams`);
    console.log(`Applied special handling to ${specialTeams.length} teams`);
    
    // Dispatch an event to notify components that data is ready
    const event = new CustomEvent('teams-data-loaded', {
      detail: { teamsData }
    });
    document.dispatchEvent(event);
    
    return teamsData;
    
  } catch (error) {
    console.error('Error fetching teams data:', error);
    // Dispatch event even in case of error, so UI can show error state
    const event = new CustomEvent('teams-data-error', {
      detail: { error }
    });
    document.dispatchEvent(event);
    
    return null;
  }
}

// Make the data available globally for non-module scripts
window.vbdbData = {
  teamsData,
  leagueIcons,
  lovbSvg,
  // Also expose the special teams list so it can be updated from other scripts if needed
  specialTeams
};

// Start the data loading process
fetchAllTeams();