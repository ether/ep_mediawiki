'use strict';

const eejs = require('ep_etherpad-lite/node/eejs');
const settings = require('ep_etherpad-lite/node/utils/Settings');

exports.eejsBlock_exportColumn = (hookName, args, cb) => {
  args.content += eejs.require('ep_mediawiki/templates/exportcolumn.html', {}, module);
  cb();
};

exports.eejsBlock_scripts = (hookName, args, cb) => {
  args.content += eejs.require('ep_mediawiki/templates/scripts.html', {}, module);
  cb();
};

exports.eejsBlock_styles = (hookName, args, cb) => {
  args.content += eejs.require('ep_mediawiki/templates/styles.html', {}, module);
  cb();
};

exports.eejsBlock_mySettings = (hookName, args, cb) => {
  let checkedState;
  if (!settings.ep_mediawiki_default) {
    checkedState = 'unchecked';
  } else if (settings.ep_mediawiki_default === true) {
    checkedState = 'checked';
  }
  args.content += eejs.require('ep_mediawiki/templates/mediawiki_entry.ejs', {
    checked: checkedState,
  });
  cb();
};
