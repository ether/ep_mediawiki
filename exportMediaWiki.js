'use strict';

const async = require('ep_etherpad-lite/node_modules/async');
const Changeset = require('ep_etherpad-lite/static/js/Changeset');
const padManager = require('ep_etherpad-lite/node/db/PadManager');
const ERR = require('ep_etherpad-lite/node_modules/async-stacktrace');
const Security = require('ep_etherpad-lite/static/js/security');

const getPadMediaWiki = async (pad, revNum, callback) => {
  let atext = pad.atext;
  let MediaWiki;
  async.waterfall([

    // fetch revision atext
    function (callback) {
      if (revNum != undefined) {
        pad.getInternalRevisionAText(revNum, (err, revisionAtext) => {
          if (ERR(err, callback)) return;
          atext = revisionAtext;
          callback();
        });
      } else {
        callback(null);
      }
    },

    // convert atext to MediaWiki
    function (callback) {
      MediaWiki = getMediaWikiFromAtext(pad, atext);
      callback(null);
    }
],

  // run final callback
  (err) => {
    if (ERR(err, callback)) return;
    callback(null, MediaWiki);
  });
}

exports.getPadMediaWiki = getPadMediaWiki;

const getMediaWikiFromAtext = (pad, atext) => {
  let apool = pad.apool();
  let textLines = atext.text.slice(0, -1).split('\n');
  let attribLines = Changeset.splitAttributionLines(atext.attribs, atext.text);

  let tags = ['==', '===', '\'\'\'', '\'\'', 'u>', 's>'];
  let props = ['heading1', 'heading2', 'bold', 'italic', 'underline', 'strikethrough'];
  let anumMap = {};

  props.forEach((propName, i) => {
    let propTrueNum = apool.putAttrib([propName, true], true);
    if (propTrueNum >= 0) {
      anumMap[propTrueNum] = i;
    }
  });

  function getLineMediaWiki(text, attribs) {
    let propVals = [false, false, false];
    let ENTER = 1;
    let STAY = 2;
    let LEAVE = 0;

    // Use order of tags (b/i/u) as order of nesting, for simplicity
    // and decent nesting.  For example,
    // <b>Just bold<b> <b><i>Bold and italics</i></b> <i>Just italics</i>
    // becomes
    // <b>Just bold <i>Bold and italics</i></b> <i>Just italics</i>
    let taker = Changeset.stringIterator(text);
    let assem = Changeset.stringAssembler();

    function emitOpenTag(i) {
      if (tags[i].indexOf('>') !== -1) {
        assem.append('<');
      }
      assem.append(tags[i]);
    }

    function emitCloseTag(i) {
      if (tags[i].indexOf('>') !== -1) {
        assem.append('</');
      }
      assem.append(tags[i]);
    }

    let urls = _findURLs(text);

    let idx = 0;

    function processNextChars(numChars) {
      if (numChars <= 0) {
        return;
      }

      let iter = Changeset.opIterator(Changeset.subattribution(attribs, idx, idx + numChars));
      idx += numChars;

      while (iter.hasNext()) {
        let o = iter.next();
        var propChanged = false;
        Changeset.eachAttribNumber(o.attribs, (a) => {
          if (a in anumMap) {
            let i = anumMap[a]; // i = 0 => bold, etc.
            if (!propVals[i]) {
              propVals[i] = ENTER;
              propChanged = true;
            } else {
              propVals[i] = STAY;
            }
          }
        });
        for (var i = 0; i < propVals.length; i++) {
          if (propVals[i] === true) {
            propVals[i] = LEAVE;
            propChanged = true;
          } else if (propVals[i] === STAY) {
            propVals[i] = true; // set it back
          }
        }
        // now each member of propVal is in {false,LEAVE,ENTER,true}
        // according to what happens at start of span
        if (propChanged) {
          // leaving bold (e.g.) also leaves italics, etc.
          let left = false;
          for (var i = 0; i < propVals.length; i++) {
            let v = propVals[i];
            if (!left) {
              if (v === LEAVE) {
                left = true;
              }
            } else {
              if (v === true) {
                propVals[i] = STAY; // tag will be closed and re-opened
              }
            }
          }

          for (var i = propVals.length - 1; i >= 0; i--) {
            if (propVals[i] === LEAVE) {
              emitCloseTag(i);
              propVals[i] = false;
            } else if (propVals[i] === STAY) {
              emitCloseTag(i);
            }
          }
          for (var i = 0; i < propVals.length; i++) {
            if (propVals[i] === ENTER || propVals[i] === STAY) {
              emitOpenTag(i);
              propVals[i] = true;
            }
          }
          // propVals is now all {true,false} again
        } // end if (propChanged)
        let chars = o.chars;
        if (o.lines) {
          chars--; // exclude newline at end of line, if present
        }
        let s = taker.take(chars);

        assem.append(s);
      } // end iteration over spans in line
      for (var i = propVals.length - 1; i >= 0; i--) {
        if (propVals[i]) {
          emitCloseTag(i);
          propVals[i] = false;
        }
      }
    } // end processNextChars
    if (urls) {
      urls.forEach((urlData) => {
        let startIndex = urlData[0];
        let url = urlData[1];
        let urlLength = url.length;
        processNextChars(startIndex - idx);
        assem.append('[');

        // Do not use processNextChars since a link does not contain syntax and
        // needs no escaping
        let iter = Changeset.opIterator(Changeset.subattribution(attribs, idx, idx + urlLength));
        idx += urlLength;
        assem.append(taker.take(iter.next().chars));

        assem.append(']');
      });
    }
    processNextChars(text.length - idx);

    return `${assem.toString()  }\n`;
  } // end getLineMediaWiki
  let pieces = [];

  for (let i = 0; i < textLines.length; i++) {
    let line = _analyzeLine(textLines[i], attribLines[i], apool);
    let lineContent = getLineMediaWiki(line.text, line.aline);

    if (line.listLevel && lineContent) {
      if (line.listTypeName == 'number') {
        pieces.push(`${new Array(line.listLevel + 1).join('')  }# `);
      } else {
        pieces.push(`${new Array(line.listLevel + 1).join('')  }* `);
      }
    }
    pieces.push(lineContent);
  }

  return pieces.join('');
}

const _analyzeLine = (text, aline, apool) => {
  let line = {};

  // identify list
  let lineMarker = 0;
  line.listLevel = 0;
  if (aline) {
    let opIter = Changeset.opIterator(aline);
    if (opIter.hasNext()) {
      let listType = Changeset.opAttributeValue(opIter.next(), 'list', apool);
      if (listType) {
        lineMarker = 1;
        listType = /([a-z]+)([12345678])/.exec(listType);
        if (listType) {
          line.listTypeName = listType[1];
          line.listLevel = Number(listType[2]);
        }
      }
    }
  }
  if (lineMarker) {
    line.text = text.substring(1);
    line.aline = Changeset.subattribution(aline, 1);
  } else {
    line.text = text;
    line.aline = aline;
  }

  return line;
}

exports.getPadMediaWikiDocument = async (padId, revNum, callback) => {
  let pad = await padManager.getPad(padId, null);
  getPadMediaWiki(pad, revNum, (err, MediaWiki) => {
    if (ERR(err, callback)) return;
    callback(null, MediaWiki);
  });
};

// copied from ACE
let _REGEX_WORDCHAR = /[\u0030-\u0039\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u1FFF\u3040-\u9FFF\uF900-\uFDFF\uFE70-\uFEFE\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFDC]/;
let _REGEX_SPACE = /\s/;
let _REGEX_URLCHAR = new RegExp(`(${  /[-:@a-zA-Z0-9_.,~%+\/\\?=&#;()$]/.source  }|${  _REGEX_WORDCHAR.source  })`);
let _REGEX_URL = new RegExp(`${/(?:(?:https?|s?ftp|ftps|file|smb|afp|nfs|(x-)?man|gopher|txmt):\/\/|mailto:)/.source + _REGEX_URLCHAR.source  }*(?![:.,;])${  _REGEX_URLCHAR.source}`, 'g');

// returns null if no URLs, or [[startIndex1, url1], [startIndex2, url2], ...]
const _findURLs = (text) => {
  _REGEX_URL.lastIndex = 0;
  let urls = null;
  let execResult;
  while ((execResult = _REGEX_URL.exec(text))) {
    urls = (urls || []);
    let startIndex = execResult.index;
    let url = execResult[0];
    urls.push([startIndex, url]);
  }

  return urls;
}
