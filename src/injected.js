// injected into main world
(function () {
  'use strict';

  function send(type, msg) {
    window.postMessage({ __xbypass: true, type: type, msg: msg }, '*');
  }

  // patch logic
  const visited = new WeakSet();

  const FLAGS = {
    rweb_age_assurance_flow_enabled: false,
    age_verification_gate_enabled: false,
    sensitive_tweet_warnings_enabled: false,
    sensitive_media_settings_enabled: true,
    grok_settings_age_restriction_enabled: false,
    rweb_mvr_blurred_media_interstitial_enabled: false
  };

  function isSafeObject(val) {
    if (!val || typeof val !== 'object') return false;
    if (visited.has(val)) return false;
    if (val instanceof Node) return false;
    if (val === window || val === document) return false;
    return true;
  }

  function patch(obj) {
    if (!isSafeObject(obj)) return;
    visited.add(obj);

    try {
      for (const key in FLAGS) {
        try {
          if (key in obj && obj[key] !== undefined) {
            const val = obj[key];
            if (val && typeof val === 'object' && 'value' in val) {
              val.value = FLAGS[key];
            } else {
              obj[key] = FLAGS[key];
            }
          }
        } catch (_) {}
      }

      try {
        if (obj.birthdate && typeof obj.birthdate === 'object') {
          obj.birthdate.year = 1990;
          obj.birthdate.day = 1;
          obj.birthdate.month = 1;
        }
      } catch (_) {}

      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k === 'window' || k === 'document' || k === 'parent' || k === 'top') continue;
        try {
          const child = obj[k];
          if (isSafeObject(child)) patch(child);
        } catch (_) {}
      }
    } catch (_) {}
  }

  // hooks
  let hooksInstalled = false;
  let originalAssign = null;
  let originalParse  = null;

  function installHooks() {
    if (hooksInstalled) return;
    hooksInstalled = true;

    // hook 1
    // __INITIAL_STATE__
    try {
      let stateVal;
      Object.defineProperty(window, '__INITIAL_STATE__', {
        configurable: true,
        enumerable: true,
        get: function () { return stateVal; },
        set: function (newValue) {
          try {
            patch(newValue);
            send('log', 'Patched __INITIAL_STATE__');
            send('status', 'active');
          } catch (e) {
            send('status', 'error');
            send('log', 'ERROR patching __INITIAL_STATE__: ' + e.message);
          }
          stateVal = newValue;
        }
      });
    } catch (e) {
      send('status', 'error');
      send('log', 'ERROR installing __INITIAL_STATE__ hook: ' + e.message);
    }

    // hook 2
    // Object.assign
    originalAssign = Object.assign;
    Object.assign = function (target) {
      const result = originalAssign.apply(this, arguments);
      if (target && typeof target === 'object') {
        if (target.featureSwitch || target.entities || target.users) {
          patch(target);
        }
      }
      return result;
    };
    // preserve static methods
    Object.assign(Object.assign, originalAssign);

    // hook 3
    // JSON.parse
    originalParse = JSON.parse;
    JSON.parse = function (text) {
      const result = originalParse.apply(this, arguments);
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        if (result.data || result.errors || result.featureSwitch) {
          patch(result);
        }
      }
      return result;
    };

    send('log', 'Hooks installed (__INITIAL_STATE__, Object.assign, JSON.parse)');
    send('status', 'active');
  }

  function removeHooks() {
    if (!hooksInstalled) return;
    if (originalAssign) { Object.assign = originalAssign; originalAssign = null; }
    if (originalParse)  { JSON.parse    = originalParse;  originalParse  = null; }
    hooksInstalled = false;
    send('log', 'Hooks removed');
    send('status', 'disabled');
  }

  // listen for commands from content

  window.addEventListener('message', function (e) {
    if (!e.data || !e.data.__xbypass_cmd) return;
    if (e.data.cmd === 'enable')  installHooks();
    if (e.data.cmd === 'disable') removeHooks();
  });

  // wait for initial command
  send('ready', '');

})();
