if(typeof exports == 'undefined'){
  var exports = this['mymodule'] = {};
}

exports.postAceInit = function(hook, context){
  var mediawiki = {
    enable: function() {
      $('iframe[name="ace_outer"]').contents().find('iframe').contents().find("#innerdocbody").addClass("mediawiki"); // add css class mediawiki
    },
    disable: function() {
      $('iframe[name="ace_outer"]').contents().find('iframe').contents().find("#innerdocbody").removeClass("mediawiki"); // add css class mediawiki
    }
  }

  /* init */
  if($('#options-mediawiki').is(':checked')) {
    mediawiki.enable();
  } else {
    mediawiki.disable();
  }
  /* on click */
  $('#options-mediawiki').on('click', function() {
    if($('#options-mediawiki').is(':checked')) {
      mediawiki.enable();
    } else {
      mediawiki.disable();
    }
  });
}

exports.aceEditorCSS = function(hook_name, cb){return ["/ep_mediawiki/static/css/mediawiki.css"];} // inner pad CSS
