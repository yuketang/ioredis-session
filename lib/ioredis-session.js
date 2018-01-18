const debug = require('debug')('ioredis-session');
const Redis = require('ioredis');
const cookie = require('cookie');
const signature = require('cookie-signature');

// session store can be a session store class
function session({type = 'other', name = 'sid', secrets = [], redis_conf = {}, path = '/', domain}) {
    let store = new Redis.Cluster(redis_conf);

    return function session(req, res, next) {
        let cookieId = req.sessionID = getcookie(req, name, secrets);
        req.sessionConf = {store, type, name, secrets, redis_conf}
        debug('cookieId', cookieId)
        // self-awareness
        if (req.session) {
            next();
            return
        }else{
            if(!cookieId){
                debug('cookie 签名错误，或者没有cookie')
                sessionCheck(req, res, next)
                return;
            }
            store.get(cookieId,function (err, session_data) {
                if (err) {
                    debug('error %j', err);
                    // no session
                } else if (!session_data) {
                    debug('no session found');
                } else {
                    debug('session found %j', session_data);
                    req.session =  JSON.parse(new Buffer(session_data, 'base64').toString().replace(/^\w{40}:/, ''))
                    debug('session data', req.session)
                }
                next(err);
            })
        }
    };
}


function getcookie(req, name, secrets) {
    let header = req.headers.cookie, raw, val;

    // read from cookie header
    if (header) {
        var cookies = cookie.parse(header);

        raw = cookies[name];

        if (raw) {
            if (raw.substr(0, 2) === 's:') {
                val = unsigncookie(raw.slice(2), secrets);

                if (val === false) {
                    debug('cookie signature invalid');
                    val = undefined;
                }
            } else {
                debug('cookie unsigned')
            }
        }
    }
    // back-compat read from cookieParser() signedCookies data
    if (!val && req.signedCookies) {
        val = req.signedCookies[name];

        if (val) {
            deprecate('cookie should be available in req.headers.cookie');
        }
    }

    // back-compat read from cookieParser() cookies data
    if (!val && req.cookies) {
        raw = req.cookies[name];

        if (raw) {
            if (raw.substr(0, 2) === 's:') {
                val = unsigncookie(raw.slice(2), secrets);

                if (val) {
                    deprecate('cookie should be available in req.headers.cookie');
                }

                if (val === false) {
                    debug('cookie signature invalid');
                    val = undefined;
                }
            } else {
                debug('cookie unsigned')
            }
        }
    }

    return val;
}

/**
 * Determine if request is secure.
 *
 * @param {Object} req
 * @param {Boolean} [trustProxy]
 * @return {Boolean}
 * @private
 */

function issecure(req, trustProxy) {
    // socket is https server
    if (req.connection && req.connection.encrypted) {
        return true;
    }

    // do not trust proxy
    if (trustProxy === false) {
        return false;
    }

    // no explicit trust; try req.secure from express
    if (trustProxy !== true) {
        var secure = req.secure;
        return typeof secure === 'boolean'
            ? secure
            : false;
    }

    // read the proto from x-forwarded-proto header
    var header = req.headers['x-forwarded-proto'] || '';
    var index = header.indexOf(',');
    var proto = index !== -1
        ? header.substr(0, index).toLowerCase().trim()
        : header.toLowerCase().trim()

    return proto === 'https';
}



/**
 * Verify and decode the given `val` with `secrets`.
 *
 * @param {String} val
 * @param {Array} secrets
 * @returns {String|Boolean}
 * @private
 */
function unsigncookie(val, secrets) {
    for (var i = 0; i < secrets.length; i++) {
        var result = signature.unsign(val, secrets[i]);

        if (result !== false) {
            return result;
        }
    }

    return false;
}

const sessionCheck = function (req, res, next) {
    if(req.session && req.session.user && req.session.user._auth_user_id) {
        next();
    }else{
        let {type} = req.sessionConf
        if(type === 'wechat'){
            let url = `http://python_server/login?next=${req.url}`
            debug(`[${type}] sessionCheck fail redirect to `, url)
            res.redirect(url)
            return
        }else if(type === 'scan'){
            let url = '/login';
            debug(`[${type}] sessionCheck fail redirect to `, url)
            res.redirect(url)
            return
        }else{
            debug(`[${type}] sessionCheck fail return 401 `)
            res.statusCode = 401;
            next(401)
        }
    }
};

const sessionDesdroy = function (directEnd = true) {
    return function (req, res, next) {
        let {name, store,secrets, path, domain} = req.sessionConf;
        var cookieId = getcookie(req, name, secrets);
        if(cookieId) {
            store.del(cookieId)
            res.clearCookie(name, { path, domain });
        }
        if(!redirectReturn) return next();
        return res.end();
    }
};

exports = module.exports = session;
exports.sessionCheck = sessionCheck;
exports.sessionDesdroy = sessionDesdroy;
