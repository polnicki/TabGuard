// Check if URL should be excluded from duplicate detection
function isUrlExcluded(url, excludedDomains) {
  if (!excludedDomains || excludedDomains.length === 0) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    for (const excluded of excludedDomains) {
      // Exact domain match
      if (domain === excluded) {
        return true;
      }
      // Wildcard match (e.g., *.example.com)
      if (excluded.startsWith('*.')) {
        const baseDomain = excluded.slice(2);
        if (domain === baseDomain || domain.endsWith('.' + baseDomain)) {
          return true;
        }
      }
    }
  } catch (e) {
    console.log('Invalid URL:', url);
  }

  return false;
}

// Main listener for tab updates
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // We're interested in the moment when the page is fully loaded and we have a URL
  if (changeInfo.status === "complete" && tab.url && !tab.incognito) {
    // Get current settings from storage
    chrome.storage.sync.get({enabled: true, excludedDomains: []}, function(settings) {
      // If plugin is disabled, do nothing
      if (!settings.enabled) {
        return;
      }

      // If URL is on the excluded list, skip it
      if (isUrlExcluded(tab.url, settings.excludedDomains)) {
        return;
      }

      // Query all tabs in the same window
      chrome.tabs.query({windowId: tab.windowId}, function(tabs) {
        for (const t of tabs) {
          // Skip the currently updated tab
          if (t.id !== tab.id && t.url && !isUrlExcluded(t.url, settings.excludedDomains)) {
            // Compare URLs without fragments
            if (t.url.split('#')[0] === tab.url.split('#')[0]) {
              // Close duplicate and switch to the older tab
              chrome.tabs.remove(tab.id, function() {
                chrome.tabs.update(t.id, {active: true});
              });
              break;
            }
          }
        }
      });
    });
  }
});

