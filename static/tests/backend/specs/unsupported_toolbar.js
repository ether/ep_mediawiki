'use strict';

const assert = require('assert').strict;

const {
  DEFAULT_UNSUPPORTED_TOOLBAR_SELECTORS,
  getUnsupportedToolbarSelectors,
  setUnsupportedToolbarButtonsHidden,
} = require('../../../js/unsupportedToolbarButtons');

describe(__filename, function () {
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
    const listItem = {hidden: false};
    const otherItem = {hidden: false};
    const doc = {
      querySelectorAll: (selector) => {
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
    assert.equal(listItem.hidden, true);
    assert.equal(otherItem.hidden, true);

    setUnsupportedToolbarButtonsHidden(
        doc, {additionalSelectors: ['.ep_checklists', '.ep_boxes']}, false);
    assert.equal(listItem.hidden, false);
    assert.equal(otherItem.hidden, false);
  });
});
