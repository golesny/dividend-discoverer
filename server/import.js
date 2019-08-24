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
    // collect all isins
    var isins = [];
    entityList.forEach(e => {
        if (isins.indexOf(e.isin) == -1) {
            isins.push(e.isin);
        }
    });
    if (isins.length > 0) {
        // get all dividends of that isins
        var updateList = [];
        console.log("import: isins="+JSON.stringify(isins));
        db.select().from('dividend').whereIn('isin', isins).andWhere('estimated', 0).then((rows) => {
            rows.map((entry) => {
                // determine what to update and what to insert
                var entityFiltered = entityList.filter(e => (e.isin == entry.isin && e.date == entry.date));
                if (entityFiltered.length == 1) {
                    // already in db --> update if price is different
                    if (entityFiltered[0].price != entry.price) {  
                        updateList.push({key: {isin: entityFiltered[0].isin,
                                            date: entityFiltered[0].date,
                                            estimated: 0},
                                        price: entityFiltered[0].price});
                    }
                    // remove from list
                    var idx = entityList.indexOf(entityFiltered[0]);
                    entityList.splice(idx, 1);
                }
            });
            // prepare inserts
            var insertList = [];
            entityList.forEach(e => {
                insertList.push({isin: e.isin, date: e.date, price: e.price, estimated: 0});
            });
            console.log("import: insertList="+JSON.stringify(insertList));
            console.log("import: updateList="+JSON.stringify(updateList));
            // insert all new dividends
            if (insertList.length > 0) {
                db.insert(insertList).into("dividend").then((result) => {
                    console.log("import: created "+insertList.length+" dividend entries");
                    // update the rest
                    updateEntry(db, updateList, res);
                })
                .catch((err) => {
                    console.error("Could not insert dividends", err.message);
                    res.status(500).send("Could not insert dividends");
                });
            } else {
                updateEntry(db, updateList, res);
            }
        }).catch((error) => {
            console.error(error);
            res.status(500).send("Could not read for isin "+isin);
        });
    }
});

function updateEntry(db, updateList, res) {
    if (updateList.length > 0) {
        let upd = updateList.splice(0,1)[0];
        console.log("import: update "+JSON.stringify(upd.key)+" value="+upd.price);
        db("dividend").update({price: upd.price}).where(upd.key).then(
            updateEntry(db, updateList, res)
        ).catch((err) => {
            console.log("import: update failed ("+err.message+") for key="+JSON.stringify(upd.key)+" value="+upd.price);
            res.status(500).send("Could not update isin "+isin);
        });
    } else {
        sendOK(res);
    }
}

function sendOK(res) {
    console.log("import: all data imported");
    res.json({errCode: 0, msg: "Data imported"})
}

module.exports = router;