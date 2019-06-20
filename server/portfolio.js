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

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

/**
 * GET /api/portfolio/
 *
 * Returns reports
 */
router.get('/', (req, res, next) => {
    const db = req.app.locals.db;
    var user_id = res.locals.userid;
    db.raw("SELECT isin.isin, isin.name, isin.currency FROM portfolio, isin "+
           "where isin.isin = portfolio.isin and user_id = '"+user_id+"' "+
           "group by isin.isin")
      .then((rows) => {
        var resLst = [];
        rows[0].forEach((entry) => {
            entry["dates"] = ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05'];
            entry["values"] = [[103,100], [150, 0.11], [130, -0.23], [130, -0.23], [130, -0.23]];
            resLst.push(entry);
        });
        res.json(resLst);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Could not read portfolio");
      });
    /*res.json([
        {isin: "DE1", name: "123", currency: 'EUR', dates: ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05'], values: [[103,100], [150, 0.11], [130, -0.23], [130, -0.23], [130, -0.23]]},
        {isin: "DE2", name: "hsgdhfg", currency: 'SOK', dates: ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05'], values: [[103,100], [150, 0.11], [130, -0.23], [130, -0.23], [130, -0.23]]},
        {isin: "DE3", name: "hsgdhfg", currency: 'EUR', dates: ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05'], values: [[103,100], [150, 0.11], [130, -0.23], [130, -0.23], [130, -0.23]]},
        {isin: "DE4", name: "hsgdhfg", currency: 'EUR', dates: ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05'], values: [[103,100], [150, 0.11], [130, -0.23], [130, -0.23], [130, -0.23]]}
      ]);*/
});

/**
 * GET /api/portfolio/transactions
 *
 * Returns 20 latest transactions
 */
router.get('/transactions', (req, res, next) => {
  const db = req.app.locals.db;
  var user_id = res.locals.userid;
  db.select().from("portfolio").where({user_id:user_id}).limit(20).orderBy("date", "desc")
     .leftJoin("isin", "isin.isin", "portfolio.isin")
  .then((rows) => {
    var resLst = [];
    rows.map((entry) => {
        delete entry.user_id;
        console.log("transactions: "+JSON.stringify(entry));
        resLst.push(entry);
    });
    res.json(resLst);
  });
});

/**
 * GET /api/portfolio/create
 *
 * Returns reports
 */
router.post('/create', (req, res, next) => {
  var entity = req.body;
  const db = req.app.locals.db;
  var user_id = res.locals.userid;
  // trim isin
  entity.isin = entity.isin.trim();
  entity["user_id"] = user_id;
  if (entity.type == "BUY" && entity.pricetotal > 0) {
    entity.pricetotal *= -1;
  }
  db.insert(entity).into("portfolio").then((result) => {      
    console.log("created transaction", entity.isin);
    res.json({msg:'created transaction', transaction: entity});
  }
  ).catch((err) => {
    console.error("Could not create transaction", err.message);
     res.status(500).send("Could not insert transaction");
  });
});

module.exports = router;