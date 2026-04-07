'use strict';

const common = require('ep_etherpad-lite/tests/backend/common');
const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

const apiVersion = 1;
let agent;

const setText = async (padID, text) => {
  const res = await agent.get(`/api/${apiVersion}/setText?padID=${padID}&text=${encodeURIComponent(text)}`)
      .set('Authorization', await common.generateJWTToken());
  if (res.body.code !== 0) throw new Error('Unable to set pad text');
  return padID;
};

const createPad = async (padID) => {
  const res = await agent.get(`/api/${apiVersion}/createPad?padID=${padID}`)
      .set('Authorization', await common.generateJWTToken());
  if (res.body.code !== 0) throw new Error('Unable to create new Pad');
  return padID;
};

const getHTMLEndPointFor = (padID) => `/api/${apiVersion}/getHTML?padID=${padID}`;

describe('export to HTML with ep_mediawiki loaded', function () {
  let padID;

  before(async function () {
    agent = await common.init();
  });

  beforeEach(async function () {
    padID = randomString(5);
    await createPad(padID);
    await setText(padID, 'hello world\n');
  });

  it('export does not crash when ep_mediawiki is loaded', async function () {
    // Smoke test: the getLineHTMLForExport hook from ep_mediawiki/export.js
    // must not crash on plain content.  Previously this hook accessed
    // Changeset.opIterator without the ESM/CJS interop fallback.
    await agent.get(getHTMLEndPointFor(padID))
        .set('Authorization', await common.generateJWTToken())
        .expect('Content-Type', /json/)
        .expect(200)
        .expect((res) => {
          if (res.body.code !== 0) {
            throw new Error(`Export failed: ${JSON.stringify(res.body)}`);
          }
          if (typeof res.body.data.html !== 'string') {
            throw new Error('Expected html string in response');
          }
          if (res.body.data.html.indexOf('hello world') === -1) {
            throw new Error('Expected exported HTML to contain pad text');
          }
        });
  });
});
