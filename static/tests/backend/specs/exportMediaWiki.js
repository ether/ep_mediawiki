'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');

const exporterPath = path.resolve(
    __dirname, '..', '..', '..', '..', 'exportMediaWiki.js');

describe(__filename, function () {
  let src;

  before(async function () { src = fs.readFileSync(exporterPath, 'utf8'); });

  it('heading attributes are handled as line-level, not character-level (#issue)',
      async function () {
        // heading1/heading2 as character attributes were wrong; headings are detected
        // from the "heading" line attribute (set by ep_headings2) inside _analyzeLine.
        const tagsMatch = src.match(/const\s+tags\s*=\s*\[([^\]]+)\]/);
        const propsMatch = src.match(/const\s+props\s*=\s*\[([\s\S]*?)\]/);
        assert(tagsMatch && propsMatch, 'expected tags/props arrays in exportMediaWiki.js');
        assert(!tagsMatch[1].includes("'=='"),
            'tags array must not contain == (headings are line-level, not character-level)');
        assert(!tagsMatch[1].includes("'==='"),
            'tags array must not contain === (headings are line-level, not character-level)');
        assert(!propsMatch[1].includes("'heading1'"),
            "props must not contain 'heading1' (use line-level 'heading' attribute instead)");
        assert(!propsMatch[1].includes("'heading2'"),
            "props must not contain 'heading2' (use line-level 'heading' attribute instead)");
      });

  it('_analyzeLine reads the heading line attribute from ep_headings2 (#issue)',
      async function () {
        // The _analyzeLine function must call opAttributeValue(op, 'heading', apool)
        // so that headings from ep_headings2 are correctly detected.
        assert(src.includes("'heading'"),
            "exportMediaWiki.js must look up the 'heading' attribute from the line marker");
        assert(/opAttributeValue\s*\(\s*op\s*,\s*'heading'\s*,\s*apool\s*\)/.test(src),
            "opAttributeValue(op, 'heading', apool) must be called inside _analyzeLine");
      });

  it('headings are emitted as MediaWiki = markers = (#issue)', async function () {
    // Check that the export loop generates '='.repeat(level) markers around heading text.
    assert(src.includes("'='.repeat(level)"),
        "heading lines must be wrapped with '='.repeat(level) markers");
    assert(src.includes('headingType'),
        'line object must carry headingType to the output loop');
  });

  it('code blocks are emitted as <code>...</code> (#issue)', async function () {
    assert(src.includes("'code'"),
        "export must handle heading type 'code'");
    assert(src.includes('<code>${contentText}</code>'),
        'code lines must be wrapped in <code>...</code>');
  });

  it('list nesting uses character repeat, not join("") (#issue)', async function () {
    // The old code used new Array(n+1).join('') which always produced '' and
    // thus emitted a single * or # regardless of nesting depth.
    assert(!src.includes("Array(line.listLevel + 1).join('')"),
        "must not use new Array(n+1).join('') for list prefix — it always produces empty string");
    assert(src.includes("'#'.repeat(line.listLevel)"),
        "numbered list prefix must use '#'.repeat(listLevel)");
    assert(src.includes("'*'.repeat(line.listLevel)"),
        "bullet list prefix must use '*'.repeat(listLevel)");
  });

  it('regular indent list type is emitted as : colons, not bullets (#issue)',
      async function () {
        // Etherpad stores indent-only lines as listTypeName='indent'.
        // MediaWiki uses : for indentation, not *.
        assert(src.includes("listTypeName === 'indent'"),
            "exportMediaWiki.js must special-case the 'indent' list type");
        assert(src.includes("':'.repeat(line.listLevel)"),
            "indent lines must be prefixed with ':'.repeat(listLevel) colons");
      });

  it('color attribute is emitted as <span style="color:..."> (#issue)', async function () {
    // Text colors set in Etherpad must be exported as inline HTML spans.
    assert(src.includes("'color'"),
        "exportMediaWiki.js must handle the 'color' attribute");
    assert(/<span style="color:\$\{/.test(src),
        'color attribute must produce a <span style="color:..."> element');
    assert(src.includes('</span>'),
        'color span must be closed');
  });

  it('propVals is initialised to tags.length elements, not a hard-coded 3 (#issue)',
      async function () {
        // With propVals=[false,false,false] only 3 props were tracked;
        // attributes beyond index 2 (including superscript/subscript) were silently dropped.
        assert(!src.includes('[false, false, false]'),
            'propVals must not be hard-coded to 3 elements');
        assert(src.includes('new Array(tags.length).fill(false)'),
            'propVals must be initialised with new Array(tags.length).fill(false)');
      });
});
