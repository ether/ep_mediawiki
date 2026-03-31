'use strict';

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
  const res = await agent.get(`/api/${apiVersion}/setHTML?padID=${padID}&html=${encodeURIComponent(html)}`)
      .set('Authorization', await common.generateJWTToken());
  if (res.body.code !== 0) throw new Error('Unable to set pad HTML');
  return padID;
};

const getHTMLEndPointFor = (padID) => `/api/${apiVersion}/getHTML?padID=${padID}`;

const buildHTML = (body) => `<html><body>${body}</body></html>`;

describe('export alignment to HTML', function () {
  let padID;
  let html;

  before(async function () {
    agent = await common.init();
  });

  beforeEach(async function () {
    padID = randomString(5);
    await createPad(padID);
    await setHTML(padID, html());
  });

  context('when pad has link', function () {
    before(async function () {
      html = () => buildHTML('<a href="http://hello.com">foo</a>');
    });

    it('returns ok', async function () {
      await agent.get(getHTMLEndPointFor(padID))
          .set('Authorization', await common.generateJWTToken())
          .expect('Content-Type', /json/)
          .expect(200);
    });

    it('returns HTML with URL', async function () {
      await agent.get(getHTMLEndPointFor(padID))
          .set('Authorization', await common.generateJWTToken())
          .expect((res) => {
            const html = res.body.data.html;
            const expectedHTML = '[http://hello.com]';
            if (html.indexOf(expectedHTML) === -1) throw new Error('No markdown detected');
          });
    });
  });
});
