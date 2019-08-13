// Copyright 2019, Daniel Nettesheim
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const isDevMode = (process.argv.length >= 3 && process.argv[2] == "dev");
const config = require("../config"+(isDevMode?"":".prod")+".json");

const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(config.googleOAuthId);

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
router.use(bodyParser.json());

/**
 * POST /api/* authentification
 */
router.post('*', (req, res, next) => {
    authenticate(req, res, next);
});

/**
 * GET /api* authentification
 */
router.get('*', (req, res, next) => {
    authenticate(req, res, next);
});

function authenticate(req, res, next) {
    // ignore static content
    if (isStaticContent(req)) {
        next();
        return true;
    }
    console.log("auth: incoming request", req.url, req.method);
    if (isDevMode) {
        console.log("auth: DEV_MODE - overriding oauth verification in dev mode. user="+config.DEV_MODE_USER_ID);
        if (req.app.locals.users != undefined) {
            if (authorize(config.DEV_MODE_USER_ID, 'testuser@gmail.com', res, req)) {
                next();
            } else {
                res.status(403).send('Authentification failed (DEV_MODE)');
            }
        } else {
            console.log("auth: no user loaded");
            res.status(403).send("Could not find admin users (DEV MODE)");
        }
    }
    else {
        var authorizationToken = req.headers["authorization"];
        if (authorizationToken != null) {
            console.log("auth: verifying bearer token: " + authorizationToken.substr(0, 20) + "...");
            // verify token
            verify(authorizationToken, res, req).catch((err) => {
                console.error("auth: Could not verify user");
                res.status(403).send('Authentification failed');
                next(err);
            }).then(() => {
                console.log("auth: ok, proceed with request");
                next();
            });
        }
        else {
            res.status(403).send('Please login');
        }
    }
}

// https://developers.google.com/identity/sign-in/web/backend-auth
async function verify(token, res, req) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.googleOAuthId
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    const email = payload['email'];
    return authorize(userid, email, res, req);
}

function authorize(userid, email, res, req) {
    if (userid in req.app.locals.users) {
        var userrights = req.app.locals.users[userid].userrights;
        // basic authorization
        //console.log("auth: url="+req.url);
        var accessmatrix = [
            { match: function(url){return url == "/api/stock"}, role: "read"},
            { match: function(url){return url.startsWith("/api/stock/price/list") }, role: "read"},
            { match: function(url){return url == "/api/stock/price" }, role: "write"},                
            { match: function(url){return url.startsWith("/api/stock/isin")}, role: "write"},
            { match: function(url){return url.startsWith("/api/stock/report")}, role: "write"},
            { match: function(url){return url.startsWith("/api/stock/dividend/list")}, role: "read"},
            { match: function(url){return url.startsWith("/api/stock/dividend/create")}, role: "write"},
            { match: function(url){return url == "/api/stock/dividend"}, role: "write"},
            { match: function(url){return url.startsWith("/api/stock/price")}, role: "write"},
            { match: function(url){return url == "/api/report"}, role: "read"},
            { match: function(url){return url == "/api/rates" }, role: "read"},
            { match: function(url){return url == "/api/monthlyadjusted" }, role: "alphavantage"},
            { match: function(url){return url.startsWith("/api/portfolio") }, role: "read"},
            { match: function(url){return url == "/api/updateallprices" }, role: "admin"},
            { match: function(url){return url == "/api/symbolsearch" }, role: "alphavantage"},
            { match: function(url){return url.startsWith("/api/user") }, role: ""},
            { match: function(url){return url.startsWith("/api/import") }, role: "admin"}
        ];
        var neededRole = undefined;
        for (let i = 0; i < accessmatrix.length; i++) {
            if (accessmatrix[i].match(req.url)) {
                neededRole = accessmatrix[i].role;
            }
        }
        //console.log("auth: found needed role "+neededRole);
        if (neededRole != undefined) {
            if (userrights.includes(neededRole) || "" === neededRole){
                // ok
                storeUserToLocals();
                return true;
            } else {
                // not ok
                console.log("auth: user "+userid+" may not access "+req.url+". needed right: "+accessmatrix[req.url]);
                return false;
            }
        } else {
            // not in list
            console.log("auth: auth: url "+req.url+" is not matching with any accessmatrix entry");
            return false;
        }
    } else {
        console.error("auth: user not found");
        if (req.url == "/api/user/requestaccess") {
            storeUserToLocals();
            return true;
        } else {
            return false;
        }
    }

    function storeUserToLocals() {
        res.locals.userid = userid;
        res.locals.userrights = userrights;
        res.locals.useremail = email;
        console.log("auth: user " + userid + " authorized to access " + req.url);
    }
}

function isStaticContent(req) {
    if (req.url == '/transactions' ||
      req.url == '/report' ||
      req.url.startsWith('/stock') ||
      req.url.startsWith('/price') ||
      req.url.startsWith('/dividend') ||
      req.url == '/portfolio' ||
      req.url == '/import' ) {
          return true;
  } else {
      return false;
  }
}

module.exports = router;