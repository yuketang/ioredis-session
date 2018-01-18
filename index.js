const session = require('lib/ioredis-session');
const sessionCheck = require('lib/ioredis-session').sessionCheck;
const sessionDesdroy = require('lib/ioredis-session').sessionDesdroy;

exports = module.exports = session;
exports.sessionCheck = sessionCheck;
exports.sessionDesdroy = sessionDesdroy;
