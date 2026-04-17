'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');

const templatePath = path.resolve(
    __dirname, '..', '..', '..', '..', 'templates', 'exportcolumn.html');

describe(__filename, function () {
  let src;
  before(function () { src = fs.readFileSync(templatePath, 'utf8'); });

  it('export button uses an existing Etherpad buttonicon glyph (#16)', function () {
    // Etherpad's icon font was updated years ago and no longer ships the
    // wikipedia glyph at \\e805 that this template used to target. Switch
    // to one of the core `buttonicon-file-*` classes so the icon actually
    // renders.
    assert(/buttonicon-file(?:-[a-z-]+)?/.test(src),
        `expected a buttonicon-file* class on the export icon; template:\n${src}`);
  });

  it('does not reference the removed custom \\e805 glyph (#16)', function () {
    assert(!/\\e805/.test(src),
        'template must not hard-code the old \\e805 wikipedia codepoint, which Etherpad\'s ' +
        'icon font does not ship anymore');
    assert(!/fontawesome-etherpad/.test(src),
        'template should not override the icon font via inline CSS; the buttonicon-* class ' +
        'already picks the right family');
  });
});
