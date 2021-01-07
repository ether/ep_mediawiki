'use strict';

$(document).ready(() => {
  const path = new RegExp(/.*\/p\/[^/]+/).exec(document.location.pathname);
  $('#exportmediawikia').attr('href', `${path}/export/mediawiki`);
});
