var async = require("ep_etherpad-lite/node_modules/async");
var Changeset = require("ep_etherpad-lite/static/js/Changeset");
var padManager = require("ep_etherpad-lite/node/db/PadManager");
var ERR = require("ep_etherpad-lite/node_modules/async-stacktrace");
var Security = require('ep_etherpad-lite/static/js/security');

function getPadMediaWiki(pad, revNum, callback)
{
  var atext = pad.atext;
  var MediaWiki;
  async.waterfall([

  // fetch revision atext
  function (callback)
  {
    if (revNum != undefined)
    {
      pad.getInternalRevisionAText(revNum, function (err, revisionAtext)
      {
        if(ERR(err, callback)) return;
        atext = revisionAtext;
        callback();
      });
    }
    else
    {
      callback(null);
    }
  },

  // convert atext to MediaWiki
  function (callback)
  {
    MediaWiki = getMediaWikiFromAtext(pad, atext);
    callback(null);
  }],

  // run final callback
  function (err)
  {
    if(ERR(err, callback)) return;
    callback(null, MediaWiki);
  });
}

exports.getPadMediaWiki = getPadMediaWiki;

function getMediaWikiFromAtext(pad, atext)
{
  var apool = pad.apool();
  var textLines = atext.text.slice(0, -1).split('\n');
  var attribLines = Changeset.splitAttributionLines(atext.attribs, atext.text);

  var tags = ['==', '===', '\'\'\'', '\'\'', 'u>', 's>'];
  var props = ['heading1', 'heading2', 'bold', 'italic', 'underline', 'strikethrough'];
  var anumMap = {};

  props.forEach(function (propName, i)
  {
    var propTrueNum = apool.putAttrib([propName, true], true);
    if (propTrueNum >= 0)
    {
      anumMap[propTrueNum] = i;
    }
  });

  function getLineMediaWiki(text, attribs)
  {
    var propVals = [false, false, false];
    var ENTER = 1;
    var STAY = 2;
    var LEAVE = 0;

    // Use order of tags (b/i/u) as order of nesting, for simplicity
    // and decent nesting.  For example,
    // <b>Just bold<b> <b><i>Bold and italics</i></b> <i>Just italics</i>
    // becomes
    // <b>Just bold <i>Bold and italics</i></b> <i>Just italics</i>
    var taker = Changeset.stringIterator(text);
    var assem = Changeset.stringAssembler();

    function emitOpenTag(i)
    {
      if (tags[i].indexOf('>') !== -1) {
        assem.append('<');
      }
      assem.append(tags[i]);
    }

    function emitCloseTag(i)
    {
      if (tags[i].indexOf('>') !== -1) {
        assem.append('</');
      }
      assem.append(tags[i]);
    }

    var urls = _findURLs(text);

    var idx = 0;

    function processNextChars(numChars)
    {
      if (numChars <= 0)
      {
        return;
      }

      var iter = Changeset.opIterator(Changeset.subattribution(attribs, idx, idx + numChars));
      idx += numChars;

      while (iter.hasNext())
      {
        var o = iter.next();
        var propChanged = false;
        Changeset.eachAttribNumber(o.attribs, function (a)
        {
          if (a in anumMap)
          {
            var i = anumMap[a]; // i = 0 => bold, etc.
            if (!propVals[i])
            {
              propVals[i] = ENTER;
              propChanged = true;
            }
            else
            {
              propVals[i] = STAY;
            }
          }
        });
        for (var i = 0; i < propVals.length; i++)
        {
          if (propVals[i] === true)
          {
            propVals[i] = LEAVE;
            propChanged = true;
          }
          else if (propVals[i] === STAY)
          {
            propVals[i] = true; // set it back
          }
        }
        // now each member of propVal is in {false,LEAVE,ENTER,true}
        // according to what happens at start of span
        if (propChanged)
        {
          // leaving bold (e.g.) also leaves italics, etc.
          var left = false;
          for (var i = 0; i < propVals.length; i++)
          {
            var v = propVals[i];
            if (!left)
            {
              if (v === LEAVE)
              {
                left = true;
              }
            }
            else
            {
              if (v === true)
              {
                propVals[i] = STAY; // tag will be closed and re-opened
              }
            }
          }

          for (var i = propVals.length - 1; i >= 0; i--)
          {
            if (propVals[i] === LEAVE)
            {
              emitCloseTag(i);
              propVals[i] = false;
            }
            else if (propVals[i] === STAY)
            {
              emitCloseTag(i);
            }
          }
          for (var i = 0; i < propVals.length; i++)
          {
            if (propVals[i] === ENTER || propVals[i] === STAY)
            {
              emitOpenTag(i);
              propVals[i] = true;
            }
          }
          // propVals is now all {true,false} again
        } // end if (propChanged)
        var chars = o.chars;
        if (o.lines)
        {
          chars--; // exclude newline at end of line, if present
        }
        var s = taker.take(chars);

        assem.append(s);
      } // end iteration over spans in line
      for (var i = propVals.length - 1; i >= 0; i--)
      {
        if (propVals[i])
        {
          emitCloseTag(i);
          propVals[i] = false;
        }
      }
    } // end processNextChars
    if (urls)
    {
      urls.forEach(function (urlData)
      {
        var startIndex = urlData[0];
        var url = urlData[1];
        var urlLength = url.length;
        processNextChars(startIndex - idx);
        assem.append('[');

        // Do not use processNextChars since a link does not contain syntax and
        // needs no escaping
        var iter = Changeset.opIterator(Changeset.subattribution(attribs, idx, idx + urlLength));
        idx += urlLength;
        assem.append(taker.take(iter.next().chars));

        assem.append(']');
      });
    }
    processNextChars(text.length - idx);

    return assem.toString() + "\n";
  } // end getLineMediaWiki
  var pieces = [];

  for (var i = 0; i < textLines.length; i++)
  {
    var line = _analyzeLine(textLines[i], attribLines[i], apool);
    var lineContent = getLineMediaWiki(line.text, line.aline);

    if (line.listLevel && lineContent)
    {
      if (line.listTypeName == "number")
      {
        pieces.push(new Array(line.listLevel + 1).join('') + '# ');
      } else {
        pieces.push(new Array(line.listLevel + 1).join('') + '* ');
      }
    }
    pieces.push(lineContent);
  }

  return pieces.join('');
}

function _analyzeLine(text, aline, apool)
{
  var line = {};

  // identify list
  var lineMarker = 0;
  line.listLevel = 0;
  if (aline)
  {
    var opIter = Changeset.opIterator(aline);
    if (opIter.hasNext())
    {
      var listType = Changeset.opAttributeValue(opIter.next(), 'list', apool);
      if (listType)
      {
        lineMarker = 1;
        listType = /([a-z]+)([12345678])/.exec(listType);
        if (listType)
        {
          line.listTypeName = listType[1];
          line.listLevel = Number(listType[2]);
        }
      }
    }
  }
  if (lineMarker)
  {
    line.text = text.substring(1);
    line.aline = Changeset.subattribution(aline, 1);
  }
  else
  {
    line.text = text;
    line.aline = aline;
  }

  return line;
}

exports.getPadMediaWikiDocument = function (padId, revNum, callback)
{
  padManager.getPad(padId, null, function (err, pad)
  {
    if(ERR(err, callback)) return;

    getPadMediaWiki(pad, revNum, function (err, MediaWiki)
    {
      if(ERR(err, callback)) return;
      callback(null, MediaWiki);
    });
  });
}

// copied from ACE
var _REGEX_WORDCHAR = /[\u0030-\u0039\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u1FFF\u3040-\u9FFF\uF900-\uFDFF\uFE70-\uFEFE\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFDC]/;
var _REGEX_SPACE = /\s/;
var _REGEX_URLCHAR = new RegExp('(' + /[-:@a-zA-Z0-9_.,~%+\/\\?=&#;()$]/.source + '|' + _REGEX_WORDCHAR.source + ')');
var _REGEX_URL = new RegExp(/(?:(?:https?|s?ftp|ftps|file|smb|afp|nfs|(x-)?man|gopher|txmt):\/\/|mailto:)/.source + _REGEX_URLCHAR.source + '*(?![:.,;])' + _REGEX_URLCHAR.source, 'g');

// returns null if no URLs, or [[startIndex1, url1], [startIndex2, url2], ...]
function _findURLs(text)
{
  _REGEX_URL.lastIndex = 0;
  var urls = null;
  var execResult;
  while ((execResult = _REGEX_URL.exec(text)))
  {
    urls = (urls || []);
    var startIndex = execResult.index;
    var url = execResult[0];
    urls.push([startIndex, url]);
  }

  return urls;
}
