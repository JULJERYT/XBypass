// isolated world
(function () {
  'use strict';

  const MAX_LOGS = 50;

  // storage helpers
  function pushLog(msg) {
    chrome.storage.local.get({ devMode: false, logs: [] }, function (data) {
      if (!data.devMode) return;
      const logs = data.logs;
      logs.push({ t: Date.now(), msg: msg });
      if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
      chrome.storage.local.set({ logs: logs });
    });
  }

  function setStatus(state) {
    // status is always tracked, devmode only gates logs
    chrome.storage.local.set({ status: state });
  }

  // inject into main world

  function injectScript() {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('src/injected.js');
    s.type = 'text/javascript';
    (document.head || document.documentElement).appendChild(s);
    s.onload = function () { s.remove(); };
  }

  injectScript();

  // send command to injected

  function sendCmd(cmd) {
    window.postMessage({ __xbypass_cmd: true, cmd: cmd }, '*');
  }

  // listen for messages from injected

  window.addEventListener('message', function (e) {
    if (!e.data || !e.data.__xbypass) return;

    const type = e.data.type;
    const msg  = e.data.msg;

    if (type === 'ready') {
      chrome.storage.local.get({ enabled: true }, function (data) {
        if (data.enabled) {
          sendCmd('enable');
          setStatus('active');
          pushLog('Injected into page - bypass active');
        } else {
          sendCmd('disable');
          setStatus('disabled');
          pushLog('Injected into page - bypass disabled by user');
        }
      });
    } else if (type === 'log') {
      pushLog(msg);
    } else if (type === 'status') {
      setStatus(msg);
    }
  });

  // listen for toggle

  chrome.storage.onChanged.addListener(function (changes) {
    if (changes.enabled) {
      if (changes.enabled.newValue) {
        sendCmd('enable');
        pushLog('Bypass ENABLED by user');
      } else {
        sendCmd('disable');
        pushLog('Bypass DISABLED by user');
      }
    }
  });

})();
