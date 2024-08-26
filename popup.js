document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = new URL(tabs[0].url);
      const domainLevels = getDomainLevels(url);
  
      const domainSelect = document.getElementById('domain-select');
      domainLevels.forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = level;
        domainSelect.appendChild(option);
      });
  
      // Set the default selection to the highest domain level (first in the list)
      domainSelect.value = domainLevels[0];
      loadNoteForSelectedDomain(domainLevels[0]);
  
      // Change note based on the selected domain level
      domainSelect.addEventListener('change', () => {
        loadNoteForSelectedDomain(domainSelect.value);
      });
    });
  
    document.getElementById('save-note').addEventListener('click', () => {
      const selectedDomain = document.getElementById('domain-select').value;
      const note = document.getElementById('markdown-note').value;
  
      chrome.storage.local.set({ [selectedDomain]: note }, () => {
        syncNoteToGitHub(note, selectedDomain, () => {
          renderMarkdown(note);
          document.getElementById('edit-mode').style.display = 'none';
          document.getElementById('view-mode').style.display = 'block';
        });
      });
    });
  
    document.getElementById('edit-note').addEventListener('click', () => {
      document.getElementById('view-mode').style.display = 'none';
      document.getElementById('edit-mode').style.display = 'block';
    });
  
    document.getElementById('cancel-edit').addEventListener('click', () => {
      document.getElementById('edit-mode').style.display = 'none';
      document.getElementById('view-mode').style.display = 'block';
    });
  
    document.getElementById('sync-github').addEventListener('click', () => {
      const selectedDomain = document.getElementById('domain-select').value;
      chrome.storage.local.get([selectedDomain], (result) => {
        const note = result[selectedDomain] || '';
        syncNoteToGitHub(note, selectedDomain);
      });
    });
  });
  
  function getDomainLevels(url) {
    const domainParts = url.hostname.split('.');
    const topLevelDomain = domainParts.slice(-2).join('.'); // e.g., "b.com"
    const levels = [topLevelDomain];
  
    // Create levels for each part of the path
    let currentLevel = topLevelDomain;
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
  
    pathParts.forEach(part => {
      currentLevel += `/${part}`;
      levels.push(currentLevel);
    });
  
    return levels; // Make sure highest domain comes first
  }
  
  function loadNoteForSelectedDomain(domain) {
    chrome.storage.local.get([domain], (result) => {
      const note = result[domain] || '';
      renderMarkdown(note);
      document.getElementById('markdown-note').value = note;
    });
  }
  
  function renderMarkdown(note) {
    const renderedHTML = marked.parse(note);
    document.getElementById('rendered-markdown').innerHTML = renderedHTML;
    document.getElementById('markdown-note').value = note;
  }
  
  // Function to safely encode a string to Base64 considering Unicode characters
  function utf8_to_b64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  
  function syncNoteToGitHub(note, domain, callback) {
    chrome.storage.sync.get(['githubRepo', 'githubBranch', 'githubToken'], async (data) => {
      const repo = data.githubRepo;
      const branch = data.githubBranch || 'main';
      const token = data.githubToken;
      const filename = sanitizeFilename(domain);
  
      if (!repo || !branch || !token) {
        alert('GitHub settings are not configured properly.');
        return;
      }
  
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${filename}`;
      
      // Fetch the SHA if the file already exists
      let sha = '';
      try {
        const response = await fetch(`${apiUrl}?ref=${branch}`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          sha = data.sha;
        }
      } catch (error) {
        console.error('Error fetching SHA:', error);
      }
  
      const content = utf8_to_b64(note);
  
      const body = {
        message: `Update note for ${domain}`,
        content: content,
        branch: branch
      };
  
      if (sha) {
        body.sha = sha;
      }
  
      fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      .then(response => response.json())
      .then(result => {
        if (result.commit) {
          alert('Note synced with GitHub!');
          if (callback) callback();
        } else {
          console.error('Failed to sync:', result);
        }
      })
      .catch(error => console.error('Sync error:', error));
    });
  }
  
  
  function sanitizeFilename(url) {
    return url.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md';
  }
  