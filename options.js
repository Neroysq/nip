document.getElementById('save-options').addEventListener('click', () => {
    const repo = document.getElementById('github-repo').value;
    chrome.storage.sync.set({ githubRepo: repo }, () => {
      alert('Options saved!');
    });
  });
  