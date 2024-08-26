const clientId = 'Ov23li1RfbjiecwfNdkm';  // Replace with your GitHub OAuth App Client ID

document.getElementById('auth-github').addEventListener('click', () => {
  authenticateWithGitHub(clientId);
});

document.getElementById('save-github-settings').addEventListener('click', () => {
    const repo = document.getElementById('github-repo').value.trim();
    const branch = document.getElementById('github-branch').value.trim() || 'main';
    const token = document.getElementById('github-token').value.trim();
  
    if (repo && branch && token) {
      chrome.storage.sync.set({
        githubRepo: repo,
        githubBranch: branch,
        githubToken: token
      }, () => {
        alert('GitHub settings saved!');
      });
    } else {
      alert('Please fill in all fields.');
    }
  });
  

document.getElementById('clear-auth').addEventListener('click', () => {
  chrome.storage.sync.remove('githubToken', () => {
    document.getElementById('github-token').value = '';
    alert('Token cleared. Please reauthorize.');
    authenticateWithGitHub(clientId);
  });
});

// Load existing settings when the options page is opened
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['githubRepo', 'githubBranch', 'githubToken'], (data) => {
    if (data.githubRepo) document.getElementById('github-repo').value = data.githubRepo;
    if (data.githubBranch) document.getElementById('github-branch').value = data.githubBranch;
    if (data.githubToken) document.getElementById('github-token').value = data.githubToken;
  });
});

// Function to initiate GitHub OAuth authentication
function authenticateWithGitHub(clientId) {
    const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo&allow_signup=false`;
  
    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, function (redirectUrl) {
      if (chrome.runtime.lastError || redirectUrl.includes('error')) {
        console.error('Authentication failed:', chrome.runtime.lastError);
        return;
      }
  
      const code = new URL(redirectUrl).searchParams.get('code');
      exchangeCodeForToken(code);
    });
  }

// Function to exchange the authorization code for an access token
async function exchangeCodeForToken(code) {
  const clientId = 'Ov23li1RfbjiecwfNdkm';  // Hard-coded Client ID
  const clientSecret = 'e31784cd84d3f170f1aa0c0b1755486172a513d9';  // Replace with your GitHub OAuth App Client Secret
  const tokenUrl = `https://github.com/login/oauth/access_token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: `https://${chrome.runtime.id}.chromiumapp.org/`
    })
  });

  const data = await response.json();
  if (data.access_token) {
    chrome.storage.sync.set({ githubToken: data.access_token });
    document.getElementById('github-token').value = data.access_token;
    fetchUserRepositories(data.access_token);
    alert('GitHub authentication successful!');
  } else {
    console.error('Failed to obtain access token:', data);
  }
}

// Function to fetch repositories the user has access to
async function fetchUserRepositories(token) {
    const reposUrl = `https://api.github.com/user/repos?per_page=100`;
    
    const response = await fetch(reposUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
  
    if (response.ok) {
      const repos = await response.json();
      populateRepositoryDropdown(repos);
    } else {
      console.error('Failed to fetch repositories:', response);
    }
  }

  // Function to populate the dropdown with user's repositories
function populateRepositoryDropdown(repos) {
    const repoSelect = document.getElementById('github-repo');
    repoSelect.innerHTML = '';  // Clear existing options
  
    repos.forEach(repo => {
      const option = document.createElement('option');
      option.value = repo.full_name;  // Full name in the format "username/repo"
      option.textContent = repo.full_name;
      repoSelect.appendChild(option);
    });
  }