document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
  
      chrome.storage.local.get([domain], (result) => {
        const note = result[domain] || '';
        renderMarkdown(note);
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
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        const note = document.getElementById('markdown-note').value;
  
        chrome.storage.local.set({ [domain]: note }, () => {
            console.log('Note saved successfully');
            alert('Note saved!');
          renderMarkdown(note);
          document.getElementById('edit-mode').style.display = 'none';
          document.getElementById('view-mode').style.display = 'block';
        });
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
  