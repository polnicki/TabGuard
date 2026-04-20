// Load settings when page opens
document.addEventListener('DOMContentLoaded', function() {
  loadLocalizationStrings();
  loadSettings();
  setupEventListeners();
});

// Load localization strings from messages.json
function loadLocalizationStrings() {
  document.getElementById('pageTitle').textContent = chrome.i18n.getMessage('appName');
  document.getElementById('settingsHeader').textContent = chrome.i18n.getMessage('settingsHeader');
  document.getElementById('infoText').textContent = chrome.i18n.getMessage('infoText');
  document.getElementById('enablePluginLabel').textContent = chrome.i18n.getMessage('enablePlugin');
  document.getElementById('excludedDomainsLabel').textContent = chrome.i18n.getMessage('excludedDomains');
  document.getElementById('excludedDomainsDesc').textContent = chrome.i18n.getMessage('excludedDomainsDescription');
  document.getElementById('domainInput').placeholder = chrome.i18n.getMessage('addDomainPlaceholder');
  document.getElementById('addBtn').textContent = chrome.i18n.getMessage('addButton');
  document.getElementById('noDomainsMsg').textContent = chrome.i18n.getMessage('noDomains');
}

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get({enabled: true, excludedDomains: []}, function(settings) {
    document.getElementById('enabledToggle').checked = settings.enabled;
    updateExcludedList(settings.excludedDomains);
  });
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('enabledToggle').addEventListener('change', function() {
    const enabled = this.checked;
    chrome.storage.sync.set({enabled: enabled}, function() {
      showStatus(chrome.i18n.getMessage('settingsSaved'), 'success');
    });
  });

  document.getElementById('domainInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addDomain();
    }
  });
}

// Add domain to the list
function addDomain() {
  const input = document.getElementById('domainInput');
  const domain = input.value.trim().toLowerCase();

  if (!domain) {
    showStatus(chrome.i18n.getMessage('emptyDomain'), 'error');
    return;
  }

  // Validate domain format
  if (!isValidDomain(domain)) {
    showStatus(chrome.i18n.getMessage('invalidDomain'), 'error');
    return;
  }

  // Get existing list from storage
  chrome.storage.sync.get({excludedDomains: []}, function(settings) {
    let domains = settings.excludedDomains;

    // Check if domain already exists
    if (domains.includes(domain)) {
      showStatus(chrome.i18n.getMessage('domainExists'), 'error');
      return;
    }

    // Add new domain
    domains.push(domain);

    // Save to storage
    chrome.storage.sync.set({excludedDomains: domains}, function() {
      input.value = '';
      updateExcludedList(domains);
      showStatus(chrome.i18n.getMessage('domainAdded'), 'success');
    });
  });
}

// Remove domain from the list
function removeDomain(domain) {
  chrome.storage.sync.get({excludedDomains: []}, function(settings) {
    let domains = settings.excludedDomains;
    domains = domains.filter(d => d !== domain);

    chrome.storage.sync.set({excludedDomains: domains}, function() {
      updateExcludedList(domains);
      showStatus(chrome.i18n.getMessage('domainRemoved'), 'success');
    });
  });
}

// Update the displayed list of excluded domains
function updateExcludedList(domains) {
  const list = document.getElementById('excludedList');

  if (!domains || domains.length === 0) {
    list.innerHTML = `<li class="empty-message" id="noDomainsMsg">${chrome.i18n.getMessage('noDomains')}</li>`;
    return;
  }

  list.innerHTML = '';
  domains.forEach(domain => {
    const li = document.createElement('li');
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = chrome.i18n.getMessage('removeButton');
    removeBtn.onclick = function() { removeDomain(domain); };

    const span = document.createElement('span');
    span.textContent = domain;

    li.appendChild(span);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

// Validate domain format
function isValidDomain(domain) {
  // Allow: example.com, *.example.com, sub.example.com
  const regex = /^(\*\.)?[a-z0-9]([a-z0-9-]*\.)*[a-z0-9-]*\.[a-z]{2,}$/i;
  return regex.test(domain);
}

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.className = `status-message show ${type}`;

  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 3000);
}



