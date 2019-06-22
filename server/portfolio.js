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
    db.raw("SELECT isin.isin, isin.name, isin.currency,sum(portfolio.amount) as amount, "+
           "(select price from price where price.isin = isin.isin order by date desc limit 1) as lastprice "+
           "FROM portfolio, isin "+
           "where isin.isin = portfolio.isin and user_id = '"+user_id+"' "+
           "group by isin.isin "+
           "having amount > 0")
           /*
        isin  name  currency  amount  lastprice
        DE0.. Mun.. EUR       100     220.00
         */
      .then((rows) => {        
        var result = handleRowsforOverview(rows);
        db.raw("SELECT year(date) as year, sum(pricetotal) as cashinyear," +
               "(select sum(pricetotal) FROM `portfolio` WHERE user_id  = '"+user_id+"') as currentcash " +
               "FROM `portfolio` WHERE user_id  = '"+user_id+"' and type = 'CASH' group by year(date) order by year asc")
               /*
                * year   cashinyear    currentcash
                * 2016   53000         3722.6696281433105
                */
        .then((rows2) => {
          handleRowsForAnnualOverview(rows2, result);
          res.json(result);
        })
        .catch((error) => {console.error(error);res.status(500).send("Could not create cash annual overview");});
      })
      .catch((error) => {console.error(error);res.status(500).send("Could not create overview");});
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


function handleRowsforOverview(rows) {
  var obj = {currency:'EUR', stock_sum: 0, overview: []};
  rows[0].forEach((entry) => {
    entry["dates"] = ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05'];
    entry["values"] = [[103, 100], [150, 0.11], [130, -0.23], [130, -0.23], [130, -0.23]];
    obj.overview.push(entry);
    // sum up each line to a total 
    obj.stock_sum += (entry.amount * entry.lastprice);
  });
  return obj;
}

/**
 *
 * @param {*} rows
 * 
 */
function handleRowsForAnnualOverview(rows, resultObj) {
  resultObj["annualoverview"] = [];
  resultObj["totaldeposit"] = 0;
  resultObj["currentcash"] = 0;

  rows[0].forEach((entry) => {
    resultObj.annualoverview.push(entry);
    resultObj.totaldeposit += entry.cashinyear;
    resultObj.currentcash = entry.currentcash; // each line the same
  });
  //
  resultObj.depot_total_value = resultObj.stock_sum + resultObj.currentcash;
  resultObj.totalprofit_perc = resultObj.depot_total_value / resultObj.totaldeposit - 1;
  // calculate the annual percentage increase rate
  resultObj.depotAnnualPercentage = 0.05;
  
  // reset the percentage
  var p = 0;
  do  {
    resultObj.depotExpectedValue = internalDepotExpectedValue(resultObj.annualoverview, resultObj.depotAnnualPercentage);
    var cP = resultObj.depotAnnualPercentage;
    if ( resultObj.depot_total_value < resultObj.depotExpectedValue ) {
      cP -= 0.0001;
      // speed up
      if (p < 0.9) {
        cP -= 0.005;
      } else if (p < 0.995) {
        cP -= 0.0015; //0.001 = 0.1%
      }
    } else if ( resultObj.depot_total_value > resultObj.depotExpectedValue ) {
      cP += 0.0001;
      // speed up
      if (p > 1.01) {
        cP += 0.005;
      } else if (p > 1.005) {
        cP += 0.0015; //0.001 = 0.1%
      }
    }
    resultObj.depotAnnualPercentage = cP;
    p = resultObj.depot_total_value / resultObj.depotExpectedValue;
    console.log("calc annual percentage: cP="+cP+" p="+p);
  } while(p < 0.9995 || p > 1.0005);
}

function internalDepotExpectedValue(annualentries, percentage) {
  var yearNow = new Date().getUTCFullYear();
  var expectedSum = 0;
  annualentries.forEach((entry) => {
    entry.cashinyear 
    // =B3*POW(1+$C$1;Year(now())-A3+1)
    //console.log("internalDepotExpectedValue: yearNow="+yearNow+" entry.year="+entry.year+" percentage="+percentage);
    var expected = entry.cashinyear * Math.pow(1+percentage, yearNow - entry.year + 1);
    entry["expected_value"] = expected;
    expectedSum += expected;
  });
  return expectedSum;
}