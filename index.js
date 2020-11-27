const path = require('path');
const eejs = require('ep_etherpad-lite/node/eejs');
const settings = require('ep_etherpad-lite/node/utils/Settings');

exports.eejsBlock_exportColumn = function (hook_name, args, cb) {
  args.content += eejs.require('ep_mediawiki/templates/exportcolumn.html', {}, module);
  return cb();
};

exports.eejsBlock_scripts = function (hook_name, args, cb) {
  args.content += eejs.require('ep_mediawiki/templates/scripts.html', {}, module);
  return cb();
};

exports.eejsBlock_styles = function (hook_name, args, cb) {
  args.content += eejs.require('ep_mediawiki/templates/styles.html', {}, module);
  return cb();
};

exports.eejsBlock_mySettings = function (hook_name, args, cb) {
  if (!settings.ep_mediawiki_default) {
    checked_state = 'unchecked';
  } else if (settings.ep_mediawiki_default == true) {
    checked_state = 'checked';
  }
  args.content += eejs.require('ep_mediawiki/templates/mediawiki_entry.ejs', {checked: checked_state});
  return cb();
};
