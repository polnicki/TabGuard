// Map of pending tab closures: tabId → { targetTabId, timeoutId }
const pendingClosures = new Map();

// Check if URL should be excluded from duplicate detection
// Simple substring matching: excludedDomains are matched against the full URL
// Wildcards (*) are stripped and treated as substring patterns
function isUrlExcluded(url, excludedDomains) {
  if (!excludedDomains || excludedDomains.length === 0) return false;
  try {
    const urlLower = url.toLowerCase();
    for (const excluded of excludedDomains) {
      // Remove wildcards from pattern and check if it's contained in the URL
      let pattern = excluded.toLowerCase().replace(/^\*\.?|\*$/g, '');
      if (pattern && urlLower.includes(pattern)) {
        return true;
      }
    }
  } catch (e) {
    console.log('TabGuard: Error checking excluded URL:', url);
  }
  return false;
}

// Injected into the duplicate tab — shows a floating toast with countdown and Cancel button
function injectTabGuardToast(timeoutSeconds) {
  // Remove any existing toast
  const existing = document.getElementById('__tabguard_toast__');
  if (existing) {
    clearInterval(existing.__tabguard_interval__);
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = '__tabguard_toast__';
  toast.style.cssText = [
    'position:fixed', 'top:20px', 'right:20px', 'z-index:2147483647',
    'background:#1e1e2e', 'color:#fff', 'padding:14px 18px',
    'border-radius:10px', 'font-family:Segoe UI,Arial,sans-serif',
    'font-size:14px', 'line-height:1.4',
    'box-shadow:0 6px 24px rgba(0,0,0,0.45)',
    'display:flex', 'align-items:center', 'gap:14px',
    'min-width:320px', 'max-width:420px',
    'border-left:4px solid #667eea',
    'animation:tabguard-slide-in 0.25s ease'
  ].join(';');

  // Add keyframe animation via a style tag
  if (!document.getElementById('__tabguard_style__')) {
    const style = document.createElement('style');
    style.id = '__tabguard_style__';
    style.textContent = `
      @keyframes tabguard-slide-in {
        from { transform: translateX(110%); opacity: 0; }
        to   { transform: translateX(0);   opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  const icon = document.createElement('span');
  icon.textContent = '🔁';
  icon.style.fontSize = '20px';

  const textWrap = document.createElement('div');
  textWrap.style.flex = '1';

  const title = document.createElement('div');
  title.style.cssText = 'font-weight:600; font-size:13px; color:#a0a8ff; margin-bottom:3px';
  title.textContent = 'TabGuard';

  const msg = document.createElement('div');
  msg.id = '__tabguard_msg__';
  msg.textContent = 'Closing duplicate tab in ' + timeoutSeconds + 's...';

  textWrap.appendChild(title);
  textWrap.appendChild(msg);

  const btn = document.createElement('button');
  btn.textContent = '✋ Cancel';
  btn.style.cssText = [
    'background:#667eea', 'color:#fff', 'border:none',
    'padding:7px 14px', 'border-radius:6px', 'cursor:pointer',
    'font-size:13px', 'font-weight:600', 'white-space:nowrap',
    'transition:background 0.15s'
  ].join(';');
  btn.onmouseenter = () => { btn.style.background = '#5568d3'; };
  btn.onmouseleave = () => { btn.style.background = '#667eea'; };

  btn.addEventListener('click', function () {
    clearInterval(toast.__tabguard_interval__);
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s';
    setTimeout(() => toast.remove(), 200);
    chrome.runtime.sendMessage({ type: 'TABGUARD_CANCEL' });
  });

  toast.appendChild(icon);
  toast.appendChild(textWrap);
  toast.appendChild(btn);
  document.body.appendChild(toast);

  let remaining = timeoutSeconds;
  toast.__tabguard_interval__ = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(toast.__tabguard_interval__);
      msg.textContent = 'Closing duplicate tab...';
    } else {
      msg.textContent = 'Closing duplicate tab in ' + remaining + 's...';
    }
  }, 1000);
}

// Remove the toast from a tab (called after close or cancel)
function removeToast(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const el = document.getElementById('__tabguard_toast__');
      if (el) { clearInterval(el.__tabguard_interval__); el.remove(); }
    }
  }).catch(() => {});
}

// Briefly highlight both duplicate tabs in the tab strip.
function highlightDuplicateTabs(windowId, sourceIndex, duplicateIndex, sourceTabId) {
  if (typeof sourceIndex !== 'number' || typeof duplicateIndex !== 'number') {
    return;
  }

  chrome.tabs.highlight(
    { windowId, tabs: [sourceIndex, duplicateIndex] },
    function () {
      if (chrome.runtime.lastError) {
        return;
      }

      // Return to the source tab so the user sees the warning toast there.
      setTimeout(() => {
        chrome.tabs.update(sourceTabId, { active: true }, () => {});
      }, 1200);
    }
  );
}

// Show toast in tab and schedule close after N seconds
function scheduleDuplicateClose(tabId, targetTabId, timeoutSeconds) {
  // First, switch focus to the source tab so user can see the toast
  chrome.tabs.update(targetTabId, { active: true }, function() {
    // Inject the toast UI into the SOURCE tab (targetTabId, not the duplicate)
    chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      func: injectTabGuardToast,
      args: [timeoutSeconds]
    }).catch(err => console.log('TabGuard: Could not inject toast:', err));
  });

  // Schedule the actual close
  const timeoutId = setTimeout(() => {
    if (pendingClosures.has(tabId)) {
      pendingClosures.delete(tabId);
      chrome.tabs.remove(tabId);
    }
  }, timeoutSeconds * 1000);

  pendingClosures.set(tabId, { targetTabId, timeoutId });
}

// Listen for Cancel message from the injected toast
chrome.runtime.onMessage.addListener(function (message, sender) {
  if (message.type === 'TABGUARD_CANCEL' && sender.tab) {
    const tabId = sender.tab.id;
    if (pendingClosures.has(tabId)) {
      const { timeoutId } = pendingClosures.get(tabId);
      clearTimeout(timeoutId);
      pendingClosures.delete(tabId);
      console.log('TabGuard: Closure cancelled for tab', tabId);
    }
  }
});

// Main listener for tab updates
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && !tab.incognito) {
    chrome.storage.sync.get(
      { enabled: true, excludedDomains: [], cancelTimeout: 3 },
      function (settings) {
        if (!settings.enabled) return;
        if (isUrlExcluded(tab.url, settings.excludedDomains)) return;

        chrome.tabs.query({ windowId: tab.windowId }, function (tabs) {
          for (const t of tabs) {
            if (
              t.id !== tab.id &&
              t.url &&
              !isUrlExcluded(t.url, settings.excludedDomains) &&
              t.url.split('#')[0] === tab.url.split('#')[0]
            ) {
              highlightDuplicateTabs(tab.windowId, t.index, tab.index, t.id);
              scheduleDuplicateClose(tab.id, t.id, settings.cancelTimeout);
              break;
            }
          }
        });
      }
    );
  }
});
