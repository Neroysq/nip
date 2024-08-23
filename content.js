chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleNote") {
      const url = new URL(window.location.href);
      const domain = url.hostname;
      
      chrome.storage.local.get([domain], (result) => {
        let note = result[domain] || '';
        alert(`Note for ${domain}: ${note}`);
      });
    }
  });
  