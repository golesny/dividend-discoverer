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
 * GET /api/import/isin
 *
 * Returns reports
 */
router.post('/isin', (req, res, next) => {
    const db = req.app.locals.db;
    var symbols = req.body; // array of symbols
    db.select().from("isin").whereIn("symbol", symbols).then((rows) => {
        var isins = [];
        rows.map((entry) => {
            isins.push(entry);
        });
        res.json(isins);
    }).catch((error) => {
        console.error(error);
        res.status(500).send("Could not read for isin "+isin);
    });
});

router.post('/divaristos', (req, res, next) => {
    const db = req.app.locals.db;
    var entityList = req.body; // array of PricePairs
    // get all isins
    var isins = [];
    entityList.forEach(e => {
        if (isins.indexOf(e.isin) == -1) {
            isins.push(e.isin);
        }
    });
    if (isins.length > 0) {
        db.select().from('dividend').whereIn({isin: isins}).then((rows) => {
            rows.map((entry) => {
                // determine what to update and what to insert
            });
            res.json({errCode: 0});
        }).catch((error) => {
            console.error(error);
            res.status(500).send("Could not read for isin "+isin);
        });
    }
});

module.exports = router;