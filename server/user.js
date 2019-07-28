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

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

/**
 * GET /api/user/userrights
 *
 * Returns reports
 */
router.get('/userinfo', (req, res, next) =>  {
             console.log("user: requesting userinfo");
             res.json({rights: req.app.locals.users[res.locals.userid].userrights });
          });

/**
 * GET /api/user/userrights
 *
 * Returns reports
 */
router.get('/requestaccess', (req, res, next) =>  {
  console.log("user: requesting access");
  // create user in database
  const db = req.app.locals.db;

  const userid = res.locals.userid
  const useremail = res.locals.useremail;
  const entity = {id: userid, email: useremail, userrights: 'requestedAccess', targetyear: 2046 /* not used, yet */};
  db.insert(entity).into("user").then((result) => {      
    console.log("created user ", entity);
    entity.userrights = entity.userrights.split(",");
    req.app.locals.users[userid] = entity;
    res.json({rights: entity.userrights});
  }
  ).catch((err) => {
    console.error("Could not create user", err.message);
    res.status(500).send("Could not create user. Try reloading.");
  });
});


module.exports = router;