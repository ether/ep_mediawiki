'use strict';

// Sub-path import keeps the client bundle clean. Importing the top-level
// `ep_plugin_helpers` index pulls in every helper's getters; `settings` and
// `toggle` reach server-only modules (eejs, Settings) which esbuild can't
// resolve for the browser.
const {padToggle} = require('ep_plugin_helpers/pad-toggle');
const {setUnsupportedToolbarButtonsHidden} = require('./unsupportedToolbarButtons');

// Same config as the server-side instance — must agree on pluginName,
// settingId, l10nId, and defaultLabel for the checkbox ids and clientVars
// lookup to line up.
const mediawikiToggle = padToggle({
  pluginName: 'ep_mediawiki',
  settingId: 'mediawiki',
  l10nId: 'ep_mediawiki.mediawiki',
  defaultLabel: 'Show MediaWiki',
  defaultEnabled: false,
});

// Re-export so the helper sees pad-wide broadcasts and refreshes our state
// when another user toggles the pad-wide checkbox.
exports.handleClientMessage_CLIENT_MESSAGE = mediawikiToggle.handleClientMessage_CLIENT_MESSAGE;

exports.postAceInit = (hook, context) => {
  let hideUnsupportedToolbarButtons = false;
  let unsupportedToolbarSelectors = [];
  let mediawikiEnabled = false;
  let refreshQueued = false;
  let toolbarObserver = null;

  const loadToolbarConfig = () => {
    let topClientVars;
    try {
      topClientVars = window.top && window.top.clientVars;
    } catch (_err) {
      // Cross-origin frames can block window.top access.
    }
    const config = (topClientVars || window.clientVars || {}).ep_mediawiki || {};
    hideUnsupportedToolbarButtons = config.hideUnsupportedToolbarButtons === true;
    unsupportedToolbarSelectors = Array.isArray(config.unsupportedToolbarSelectors)
      ? config.unsupportedToolbarSelectors : [];
  };
  const refreshUnsupportedToolbarButtons = () => {
    if (!hideUnsupportedToolbarButtons) return;
    setUnsupportedToolbarButtonsHidden(document, {
      additionalSelectors: unsupportedToolbarSelectors,
    }, mediawikiEnabled);
  };
  const queueUnsupportedToolbarRefresh = () => {
    if (refreshQueued) return;
    refreshQueued = true;
    const defer = window.requestAnimationFrame || ((fn) => window.setTimeout(fn, 0));
    defer(() => {
      refreshQueued = false;
      refreshUnsupportedToolbarButtons();
    });
  };
  const observeUnsupportedToolbarButtons = () => {
    if (
      !hideUnsupportedToolbarButtons ||
      toolbarObserver ||
      typeof MutationObserver !== 'function'
    ) {
      return;
    }
    const target = document.getElementById('editbar');
    if (!target) return;
    toolbarObserver = new MutationObserver(() => queueUnsupportedToolbarRefresh());
    toolbarObserver.observe(target, {childList: true, subtree: true});
  };

  loadToolbarConfig();

  const mediawiki = {
    enable: () => {
      mediawikiEnabled = true;
      $('iframe[name="ace_outer"]').contents().find('iframe')
          .contents().find('#innerdocbody').addClass('mediawiki');
      refreshUnsupportedToolbarButtons();
    },
    disable: () => {
      mediawikiEnabled = false;
      $('iframe[name="ace_outer"]').contents().find('iframe')
          .contents().find('#innerdocbody').removeClass('mediawiki');
      refreshUnsupportedToolbarButtons();
    },
  };

  observeUnsupportedToolbarButtons();

  mediawikiToggle.init({
    onChange: (enabled) => { enabled ? mediawiki.enable() : mediawiki.disable(); },
  });

  // ?mediawiki=true / ?mediawiki=false URL parameter still overrides the
  // resolved setting, matching the pre-migration behavior.
  const param = getParam('mediawiki');
  if (param === 'true') {
    $('#options-mediawiki').prop('checked', true);
    mediawiki.enable();
  } else if (param === 'false') {
    $('#options-mediawiki').prop('checked', false);
    mediawiki.disable();
  }
};

// inner pad CSS
exports.aceEditorCSS = (hookName, cb) => ['/ep_mediawiki/static/css/mediawiki.css'];

const getParam = (sname) => {
  let params = location.search.substr(location.search.indexOf('?') + 1);
  let sval = '';
  params = params.split('&');
  for (let i = 0; i < params.length; i++) {
    const temp = params[i].split('=');
    if (temp[0] === sname) { sval = temp[1]; }
  }
  return sval;
};
