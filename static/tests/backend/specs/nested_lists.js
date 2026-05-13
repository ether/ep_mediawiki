'use strict';

const assert = require('assert').strict;
const common = require('ep_etherpad-lite/tests/backend/common');
const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

const apiVersion = 1;
let agent;

const createPad = async (padID) => {
  const res = await agent.get(`/api/${apiVersion}/createPad?padID=${padID}`)
      .set('Authorization', await common.generateJWTToken());
  if (res.body.code !== 0) throw new Error('Unable to create new Pad');
  return padID;
};

const setHTML = async (padID, html) => {
  const res = await agent.get(
      `/api/${apiVersion}/setHTML?padID=${padID}&html=${encodeURIComponent(html)}`)
      .set('Authorization', await common.generateJWTToken());
  if (res.body.code !== 0) throw new Error('Unable to set pad HTML');
  return padID;
};

const getMediaWikiEndPointFor = (padID) => `/p/${padID}/export/mediawiki`;

describe('nested list MediaWiki export', function () {
  before(async function () {
    agent = await common.init();
  });

  it('exports nested unordered lists with repeated markers (#18)', async function () {
    const padID = randomString(5);
    await createPad(padID);
    await setHTML(padID, '<ul><li>1<ul><li>2</li></ul></li></ul>');

    const res = await agent.get(getMediaWikiEndPointFor(padID))
        .expect('Content-Type', /text\/plain/)
        .expect(200);

    assert.match(res.text, /\* 1\n\*\* 2\n/);
  });
});
