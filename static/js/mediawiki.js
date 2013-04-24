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
  /* Param initiator */
  var urlContainsMediawikiTrue = (getParam("mediawiki") == "true"); // if the url param is set
   if(urlContainsMediawikiTrue){
    $('#options-mediawiki').attr('checked','checked');
    mediawiki.enable();
  }else if (getParam("mediawiki") == "false"){
    $('#options-mediawiki').attr('checked',false);
    mediawiki.disable();
  }
}

exports.aceEditorCSS = function(hook_name, cb){return ["/ep_mediawiki/static/css/mediawiki.css"];} // inner pad CSS

function getParam(sname){
  var params = location.search.substr(location.search.indexOf("?")+1);
  var sval = "";
  params = params.split("&");
  // split param and value into individual pieces
  for (var i=0; i<params.length; i++)
  {
    temp = params[i].split("=");
    if ( [temp[0]] == sname ) { sval = temp[1]; }
  }
  return sval;
}

