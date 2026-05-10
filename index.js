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

exports.loadSettings = mediawikiToggle.loadSettings;
exports.clientVars = mediawikiToggle.clientVars;
exports.eejsBlock_mySettings = mediawikiToggle.eejsBlock_mySettings;
exports.eejsBlock_padSettings = mediawikiToggle.eejsBlock_padSettings;

exports.eejsBlock_exportColumn =
    template('ep_mediawiki/templates/exportcolumn.html');

exports.eejsBlock_scripts =
    template('ep_mediawiki/templates/scripts.html');
