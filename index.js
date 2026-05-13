'use strict';

const {template} = require('ep_plugin_helpers');

const {padToggle} = require('ep_plugin_helpers/pad-toggle-server');

// Parallel User Settings + Pad Wide Settings checkboxes for the MediaWiki
// editor styling. Helper owns the storage, broadcast, enforce, and i18n wiring.
const mediawikiToggle = padToggle({
  pluginName: 'ep_mediawiki',
  settingId: 'mediawiki',
  l10nId: 'ep_mediawiki.mediawiki',
  defaultLabel: 'Show MediaWiki',
  defaultEnabled: false,
});

let hideUnsupportedToolbarButtons = false;
let unsupportedToolbarSelectors = [];

exports.loadSettings = async (hookName, args) => {
  await mediawikiToggle.loadSettings(hookName, args);
  const settings = (args && args.settings) || {};
  const mediawikiSettings = settings.ep_mediawiki || {};
  hideUnsupportedToolbarButtons = mediawikiSettings.hideUnsupportedToolbarButtons === true;
  unsupportedToolbarSelectors = Array.isArray(mediawikiSettings.unsupportedToolbarSelectors)
    ? mediawikiSettings.unsupportedToolbarSelectors : [];
};
exports.clientVars = async (hookName, context) => {
  const clientVars = await mediawikiToggle.clientVars(hookName, context);
  return {
    ...clientVars,
    ep_mediawiki: {
      hideUnsupportedToolbarButtons,
      unsupportedToolbarSelectors,
    },
  };
};
exports.eejsBlock_mySettings = mediawikiToggle.eejsBlock_mySettings;
exports.eejsBlock_padSettings = mediawikiToggle.eejsBlock_padSettings;

exports.eejsBlock_exportColumn =
    template('ep_mediawiki/templates/exportcolumn.html');

exports.eejsBlock_scripts =
    template('ep_mediawiki/templates/scripts.html');
