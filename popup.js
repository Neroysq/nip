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
  
    document.getElementById('edit-note').addEventListener('click', () => {
      document.getElementById('view-mode').style.display = 'none';
      document.getElementById('edit-mode').style.display = 'block';
    });
  
    document.getElementById('cancel-edit').addEventListener('click', () => {
      document.getElementById('edit-mode').style.display = 'none';
      document.getElementById('view-mode').style.display = 'block';
    });
   
    document.getElementById('save-note').addEventListener('click', () => {
        const selectedDomain = document.getElementById('domain-select').value;
        const note = document.getElementById('markdown-note').value;
    
        chrome.storage.local.set({ [selectedDomain]: note }, () => {
            renderMarkdown(note);
            document.getElementById('edit-mode').style.display = 'none';
            document.getElementById('view-mode').style.display = 'block';
        });
    });
  
    document.getElementById('sync-github').addEventListener('click', () => {
      chrome.storage.local.get(null, (data) => {
        const githubToken = ''; // Handle GitHub authentication and token management here
        
        fetch('https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/contents/notes.json', {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Sync notes',
            content: btoa(JSON.stringify(data)),
            sha: '...' // The SHA of the file if it already exists, otherwise omit.
          })
        }).then(response => {
          if (response.ok) {
            alert('Notes synced with GitHub!');
          } else {
            alert('Failed to sync with GitHub.');
          }
        });
      });
    });
  });
  
  function renderMarkdown(note) {
    // Convert Markdown to HTML (you can use a library like marked.js)
    const renderedHTML = marked.parse(note);
    document.getElementById('rendered-markdown').innerHTML = renderedHTML;
    document.getElementById('markdown-note').value = note;
  }
  
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
  
    return levels; // Reverse to make sure highest domain comes first
  }
  
  function loadNoteForSelectedDomain(domain) {
    chrome.storage.local.get([domain], (result) => {
      const note = result[domain] || '';
      renderMarkdown(note);
      document.getElementById('markdown-note').value = note;
    });
  }

  function sanitizeFilename(url) {
    return url.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md';
  }