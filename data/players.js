// data/players.js
export async function fetchPlayers(league = 'LOVB') {
  // Map league names to API endpoints
  const apiEndpoints = {
    'LOVB': 'https://api.volleyballdatabased.com/api/lovb_players',
    'NCAA Men': 'https://api.volleyballdatabased.com/api/ncaam_players',
    'NCAA Women': 'https://api.volleyballdatabased.com/api/ncaaw_players',
    'PVF Pro': 'https://api.volleyballdatabased.com/api/pvf_players'
  };
  
  // Check if we have an endpoint for the requested league
  const endpoint = apiEndpoints[league];
  
  if (!endpoint) {
    console.warn(`No player data available for ${league} league`);
    return [];
  }
  
  try {
    console.log(`Fetching player data for ${league} from ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${league} player data:`, error);
    return [];
  }
}

// Organize players by team for easier access
export function organizePlayersByTeam(players) {
  const teamMap = {};
  
  players.forEach(player => {
    if (!teamMap[player.team_id]) {
      teamMap[player.team_id] = [];
    }
    teamMap[player.team_id].push(player);
  });
  
  return teamMap;
}