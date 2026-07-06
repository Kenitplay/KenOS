// // ============================================================
// // GITHUB API - FETCH PUBLIC REPOS ONLY (NO COMMITS)
// // ============================================================
// (async function() {
//   // Hardcode your GitHub username here - no config.js needed!
//   const GITHUB_USERNAME = 'Kenitplay';
  
//   const repoCountEl = document.getElementById('repoCount');
//   const commitValueEl = document.getElementById('commitCount');
//   const commitLabelEl = document.getElementById('commitLabel');
  
//   if (!repoCountEl) {
//     console.warn('Stat elements not found');
//     return;
//   }

//   try {
//     // ============================================================
//     // FETCH PUBLIC REPOSITORIES ONLY
//     // ============================================================
//     // This endpoint only returns public repos - no token needed!
//     const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
    
//     if (!response.ok) {
//       throw new Error(`GitHub API error: ${response.status}`);
//     }
    
//     const repos = await response.json();
    
//     // Filter to only OWNED repos (not forks or collaborations)
//     const myRepos = repos.filter(repo => 
//       repo.owner.login === GITHUB_USERNAME && 
//       !repo.fork &&
//       !repo.private // Explicitly exclude private
//     );
    
//     const totalRepos = myRepos.length;
    
//     // Update repository count
//     repoCountEl.textContent = totalRepos;
//     repoCountEl.style.color = '#00d4ff';
    
//     // Hide or remove the commit stat since we're not using it anymore
//     if (commitValueEl) {
//       commitValueEl.style.display = 'none';
//     }
//     if (commitLabelEl) {
//       commitLabelEl.style.display = 'none';
//     }
    
//     console.log(`📁 Total public repos: ${totalRepos}`);

//   } catch (error) {
//     console.warn('Failed to fetch GitHub stats:', error);
//     // Fallback values
//     repoCountEl.textContent = '20';
//     repoCountEl.style.color = '#00d4ff';
//     if (commitValueEl) {
//       commitValueEl.style.display = 'none';
//     }
//     if (commitLabelEl) {
//       commitLabelEl.style.display = 'none';
//     }
//   }
// })();

// console.log('📱 Mobile/Tablet: Single click enabled for icons');
// console.log('📱 Desktop: Double click enabled for icons');