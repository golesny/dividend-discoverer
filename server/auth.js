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
 * GET /api/books/:id
 *
 * Retrieve a book.
 */
router.get('/', (req, res, next) => {
    console.log("incoming request", req.url, req.method);
    if (isDevMode) {
        console.log("overriding oauth verification in dev mode");
        next();
    } else {
        var authorizationToken = req.headers["authorization"];
        if (authorizationToken != null) {
            console.log("verifying bearer token: " + authorizationToken.substr(0, 20) + "...");
            // verify token
            verify(authorizationToken).catch((err) => {
                console.error("Could not verify user");
                res.status(403).json({ 'error': 'Authentification failed', 'errorcode': 1 });
                next(err);
            }).then(() => {
                console.log("ok, proceed with request");
                next();
            });
        } else {
            res.status(403).json({ 'error': 'Please login', 'errorcode': 2 });
        }
    }
  });


// https://developers.google.com/identity/sign-in/web/backend-auth
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.googleOAuthId
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    
    // check in database, that user is valid
    console.log("user logged in: "+userid);

    return checkUserRights(userid);
}

function checkUserRights(userId) {
    if (config != null) {
        if (config.adminGoogleId == userId) {
            console.log("user is authorized with admin Rights");
            return true;
        }
    }
    return false;    
}

module.exports = router;