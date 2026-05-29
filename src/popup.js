'use strict';

// half of this popup code was vibecoded - sorry
const statusDot   = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const toggle      = document.getElementById('toggleSwitch');
const logBox      = document.getElementById('logBox');
const clearBtn    = document.getElementById('clearBtn');
const h1          = document.getElementById('h1');
const h2          = document.getElementById('h2');
const h3          = document.getElementById('h3');
const devSwitch   = document.getElementById('devSwitch');
const devSection  = document.getElementById('devSection');
const devLabel    = document.getElementById('devLabel');
const toggleLabel = document.getElementById('toggleLabel');

// Render helpers
function renderStatus(status, enabled) {
  statusDot.className = 'status-dot ' + (status || (enabled ? 'active' : 'disabled'));
  const labels = { active: 'Active', error: 'Error', disabled: 'Disabled' };
  statusLabel.textContent = labels[status] || '-';

  const on = (status === 'active');
  [h1, h2, h3].forEach(function (el) {
    el.className = 'hook-bullet' + (on ? '' : ' off');
  });
}

function renderDevMode(devMode) {
  devSwitch.checked = devMode;
  devLabel.className = 'dev-label' + (devMode ? ' on' : '');
  if (devMode) {
    devSection.classList.add('visible');
  } else {
    devSection.classList.remove('visible');
  }
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatTime(ts) {
  const d = new Date(ts);
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function renderLogs(logs) {
  if (!logs || logs.length === 0) {
    logBox.innerHTML = '<span class="log-empty">No entries yet.</span>';
    return;
  }

  const fragment = document.createDocumentFragment();
  // Newest first
  for (let i = logs.length - 1; i >= 0; i--) {
    const entry = logs[i];
    const isErr = /error/i.test(entry.msg);

    const div = document.createElement('div');
    div.className = 'log-entry ' + (isErr ? 'err' : 'ok');

    const time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = formatTime(entry.t);

    const msg = document.createElement('span');
    msg.className = 'log-msg';
    msg.textContent = entry.msg;

    div.appendChild(time);
    div.appendChild(msg);
    fragment.appendChild(div);
  }

  logBox.innerHTML = '';
  logBox.appendChild(fragment);
}

// load state
chrome.storage.local.get({ enabled: true, status: 'active', logs: [], devMode: false }, function (data) {
  toggle.checked = data.enabled;
  toggleLabel.textContent = data.enabled ? 'Bypass enabled' : 'Bypass disabled';
  toggleLabel.className = 'toggle-label';
  renderStatus(data.status, data.enabled);
  renderDevMode(data.devMode);
  renderLogs(data.logs);
});

// Bypass toggle
toggle.addEventListener('change', function () {
  const enabled = toggle.checked;
  toggleLabel.textContent = 'Refresh to apply';
  toggleLabel.className = 'toggle-label pending';
  chrome.storage.local.set({ enabled: enabled }, function () {
    chrome.storage.local.get({ status: 'active', logs: [], devMode: false }, function (data) {
      renderStatus(data.status, enabled);
      if (data.devMode) renderLogs(data.logs);
    });
  });
});

// Dev mode toggle
devSwitch.addEventListener('change', function () {
  const devMode = devSwitch.checked;
  chrome.storage.local.set({ devMode: devMode }, function () {
    renderDevMode(devMode);
    if (devMode) {
      // Load logs now that panel is visible
      chrome.storage.local.get({ logs: [] }, function (data) {
        renderLogs(data.logs);
      });
    }
  });
});

// Clear logs
clearBtn.addEventListener('click', function () {
  chrome.storage.local.set({ logs: [] }, function () {
    renderLogs([]);
  });
});

// Live updates while popup is open
chrome.storage.onChanged.addListener(function (changes) {
  chrome.storage.local.get({ enabled: true, status: 'active', logs: [], devMode: false }, function (data) {
    toggle.checked = data.enabled;
    renderStatus(data.status, data.enabled);
    renderDevMode(data.devMode);
    if (data.devMode) renderLogs(data.logs);
  });
});
