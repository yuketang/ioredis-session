const session = require('lib/ioredis-session');
const sessionCheck = require('lib/ioredis-session').sessionCheck;
const sessionDestroy = require('lib/ioredis-session').sessionDestroy;

exports = module.exports = session;
exports.sessionCheck = sessionCheck;
exports.sessionDestroy = sessionDestroy;
