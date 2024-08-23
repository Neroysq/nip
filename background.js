chrome.runtime.onInstalled.addListener(() => {
    console.log('nip (NoteInPlace) installed');
  });
  
  chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "toggleNote" });
  });
  