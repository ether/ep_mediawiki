'use strict';
const common = require('ep_etherpad-lite/tests/backend/common');
const randomString = require('ep_etherpad-lite/static/js/pad_utils').randomString;

const apiVersion = 1;

const createPad = async function (agent) {
  const pad = randomString(5);
  await agent.get(`/api/${apiVersion}/createPad?padID=${pad}`)
      .set('Authorization', await common.generateJWTToken());
  return pad;
};

const readOnlyId = async function (agent, padID) {
  const res = await agent.get(`/api/${apiVersion}/getReadOnlyID?padID=${padID}`)
      .set('Authorization', await common.generateJWTToken());
  if (res.body.code !== 0) throw new Error('Unable to get read only id');
  return res.body.data.readOnlyID;
};

exports.apiVersion = apiVersion;
exports.common = common;
exports.createPad = createPad;
exports.readOnlyId = readOnlyId;
