'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');

const exporterPath = path.resolve(
    __dirname, '..', '..', '..', '..', 'exportMediaWiki.js');

describe(__filename, function () {
  let src;

  before(function () { src = fs.readFileSync(exporterPath, 'utf8'); });

  it('MediaWiki exporter maps superscript/subscript attributes to <sup>/<sub> (#14)',
      function () {
        // Ensure the props array includes superscript/subscript and the
        // tags array has the corresponding `sup>` / `sub>` markers. The
        // `>`-suffixed tags are emitted wrapped in `<`/`</` by the
        // existing emitOpenTag/emitCloseTag helpers.
        const tagsMatch = src.match(/const\s+tags\s*=\s*\[([^\]]+)\]/);
        const propsMatch = src.match(/const\s+props\s*=\s*\[([\s\S]*?)\]/);
        assert(tagsMatch && propsMatch, 'expected tags/props arrays in exportMediaWiki.js');
        const tags = tagsMatch[1];
        const props = propsMatch[1];
        for (const [tag, prop] of [["'sup>'", "'superscript'"], ["'sub>'", "'subscript'"]]) {
          assert(tags.includes(tag),
              `tags array should include ${tag} so <sup>/<sub> markers are emitted`);
          assert(props.includes(prop),
              `props array should include ${prop} so the attribute maps to the ${tag} tag`);
        }
      });
});
