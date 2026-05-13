'use strict';

const DEFAULT_UNSUPPORTED_TOOLBAR_SELECTORS = [
  '[data-key="alignLeft"]',
  '[data-key="alignCenter"]',
  '[data-key="alignRight"]',
  '[data-key="alignJustify"]',
  '.ep_align',
];

const normalizeSelectors = (selectors) => {
  if (selectors == null) return [];
  const values = Array.isArray(selectors) ? selectors : [selectors];
  return [...new Set(values.flatMap((selector) => {
    if (typeof selector !== 'string') return [];
    return selector.split(',').map((part) => part.trim()).filter(Boolean);
  }))];
};

const getUnsupportedToolbarSelectors = (config = {}) => normalizeSelectors([
  ...DEFAULT_UNSUPPORTED_TOOLBAR_SELECTORS,
  ...normalizeSelectors(config.additionalSelectors),
]);

const getToolbarTargets = (doc, selectors) => {
  if (!doc || typeof doc.querySelectorAll !== 'function') return [];

  const targets = new Set();
  for (const selector of selectors) {
    for (const element of doc.querySelectorAll(selector)) {
      const target = typeof element.closest === 'function'
        ? element.closest('li') || element
        : element;
      targets.add(target);
    }
  }
  return [...targets];
};

const setUnsupportedToolbarButtonsHidden = (doc, config, hidden) => {
  const selectors = getUnsupportedToolbarSelectors(config);
  for (const target of getToolbarTargets(doc, selectors)) target.hidden = !!hidden;
};

module.exports = {
  DEFAULT_UNSUPPORTED_TOOLBAR_SELECTORS,
  getToolbarTargets,
  getUnsupportedToolbarSelectors,
  normalizeSelectors,
  setUnsupportedToolbarButtonsHidden,
};
