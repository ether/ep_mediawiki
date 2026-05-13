'use strict';

const assert = require('assert').strict;

const {
  DEFAULT_UNSUPPORTED_TOOLBAR_SELECTORS,
  getUnsupportedToolbarSelectors,
  setUnsupportedToolbarButtonsHidden,
} = require('../../../js/unsupportedToolbarButtons');

describe('unsupportedToolbarButtons', function () {
  it('includes ep_align toolbar buttons by default', async function () {
    assert.deepEqual(DEFAULT_UNSUPPORTED_TOOLBAR_SELECTORS, [
      '[data-key="alignLeft"]',
      '[data-key="alignCenter"]',
      '[data-key="alignRight"]',
      '[data-key="alignJustify"]',
      '.ep_align',
    ]);
  });

  it('merges additional selectors without duplicates', async function () {
    assert.deepEqual(getUnsupportedToolbarSelectors({
      additionalSelectors: ['.ep_checklists', ' .ep_checklists ', '.ep_tasks,.ep_boxes '],
    }), [
      '[data-key="alignLeft"]',
      '[data-key="alignCenter"]',
      '[data-key="alignRight"]',
      '[data-key="alignJustify"]',
      '.ep_align',
      '.ep_checklists',
      '.ep_tasks',
      '.ep_boxes',
    ]);
  });

  it('hides the closest toolbar list item for matched controls', async function () {
    const alignItem = {hidden: false, closest: () => null};
    const listItem = {hidden: false};
    const otherItem = {hidden: false, closest: () => null};
    const doc = {
      querySelectorAll: (selector) => {
        if (selector === '[data-key="alignLeft"]') return [alignItem];
        if (selector === '.ep_checklists') {
          return [{
            hidden: false,
            closest: (target) => target === 'li' ? listItem : null,
          }];
        }
        if (selector === '.ep_boxes') {
          return [otherItem];
        }
        return [];
      },
    };

    setUnsupportedToolbarButtonsHidden(
        doc, {additionalSelectors: ['.ep_checklists', '.ep_boxes']}, true);
    assert.equal(alignItem.hidden, true);
    assert.equal(listItem.hidden, true);
    assert.equal(otherItem.hidden, true);

    setUnsupportedToolbarButtonsHidden(
        doc, {additionalSelectors: ['.ep_checklists', '.ep_boxes']}, false);
    assert.equal(alignItem.hidden, false);
    assert.equal(listItem.hidden, false);
    assert.equal(otherItem.hidden, false);
  });
});
