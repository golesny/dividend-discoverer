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
 * POST authentification
 */
router.post('/', (req, res, next) => {
    authenticate(req, res, next);
});

/**
 * GET /api*
 *
 * Retrieve a book.
 */
router.get('/', (req, res, next) => {
    authenticate(req, res, next);
});

function authenticate(req, res, next) {
    console.log("auth: incoming request", req.url, req.method);
    if (isDevMode) {
        console.log("auth: overriding oauth verification in dev mode");
        if (req.app.locals.users != undefined) {
            var userID = Object.keys(req.app.locals.users)[0]; // first user must be an admin user in DEV mode
            if (req.app.locals.users[userID].userrights.includes("admin")) {
                res.locals.userid = userID;
                res.locals.userrights = req.app.locals.users[userID].userrights;
                next();
            } else {
                res.status(403).send("Only admin users allowed (DEV MODE)");
            }
        } else {
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
    
    if (userid in req.app.locals.users) {
        var userrights = req.app.locals.users[userid].userrights;
        if (userrights.includes(("admin"))) {
            // currently only admins are allowed
            res.locals.userid = userid;
            res.locals.userrights = userrights;
            console.log("auth: user logged in: "+userid);
            return true;
        } else {
            console.error("currently only admin users allowed/implemented. But found only "+JSON.stringify(userrights)+" for user "+userid);
            return false;
        }
    }
}

module.exports = router;