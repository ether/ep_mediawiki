'use strict';

exports.postAceInit = (hook, context) => {
  const mediawiki = {
    enable: () => {
      // add css class mediawiki
      $('iframe[name="ace_outer"]').contents().find('iframe')
          .contents().find('#innerdocbody').addClass('mediawiki');
    },
    disable: () => {
      $('iframe[name="ace_outer"]').contents().find('iframe')
          .contents().find('#innerdocbody').removeClass('mediawiki');
    },
  };

  /* init */
  if ($('#options-mediawiki').is(':checked')) {
    mediawiki.enable();
  } else {
    mediawiki.disable();
  }
  /* on click */
  $('#options-mediawiki').on('click', () => {
    if ($('#options-mediawiki').is(':checked')) {
      mediawiki.enable();
    } else {
      mediawiki.disable();
    }
  });
  /* Param initiator */
  // if the url param is set
  const urlContainsMediawikiTrue = (getParam('mediawiki') === 'true');
  if (urlContainsMediawikiTrue) {
    $('#options-mediawiki').attr('checked', 'checked');
    mediawiki.enable();
  } else if (getParam('mediawiki') === 'false') {
    $('#options-mediawiki').attr('checked', false);
    mediawiki.disable();
  }
};

// inner pad CSS
exports.aceEditorCSS = (hookName, cb) => ['/ep_mediawiki/static/css/mediawiki.css'];

const getParam = (sname) => {
  let params = location.search.substr(location.search.indexOf('?') + 1);
  let sval = '';
  params = params.split('&');
  // split param and value into individual pieces
  for (let i = 0; i < params.length; i++) {
    const temp = params[i].split('=');
    if ([temp[0]] === sname) { sval = temp[1]; }
  }
  return sval;
};
