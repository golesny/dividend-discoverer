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
const fixer_io = require("./fixer_io");

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
    db.raw("SELECT isin.isin, isin.name, isin.currency,"+        
           "(select sum(p2.amount) from portfolio p2 where type in ('BUY', 'SELL') and p2.isin = isin.isin) as amount, "+
           "(select sum(p3.pricetotal) from portfolio p3 where type in ('BUY', 'SELL') and p3.isin = isin.isin) as entryprice, "+
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
               "(select sum(pricetotal) FROM `portfolio` WHERE user_id = '"+user_id+"') as currentcash " +
               "FROM `portfolio` WHERE user_id = '"+user_id+"' and type = 'CASH' group by year(date) order by year asc")
               /*
                * year   cashinyear    currentcash
                * 2016   53000         3722.6696281433105
                */
        .then((rows2) => {
          handleRowsForAnnualOverview(rows2, result);
          var isins = "";
          result.overview.forEach(e => {isins += (isins.length>0?",":"")+"'"+e.isin+"'"});
          var monthlyQuery = "Select isin, EXTRACT( YEAR_MONTH FROM `date` ) as datemonth, price "+
          "from `price` where CONCAT(isin, date) in ( "+
          "  Select concat(isin, MAX(date)) "+
          "  from `price` "+
          "  where isin in ("+isins+") "+
          "  group by isin, EXTRACT( YEAR_MONTH FROM `date` ) )";
          console.log("monthly query=\n"+monthlyQuery);
          db.raw(monthlyQuery)
          .then((rows3) => {
            handleRowsForMonthlyPrices(rows3, result);
            //console.log("sending "+JSON.stringify(result));
            res.json(result);
          })
          .catch((error) => {console.error(error);res.status(500).send("Could not read monthly prices");});
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
  if (entity.isin == undefined) {
    entity.isin = "";
  } else {
    entity.isin = entity.isin.trim();
  }
  entity["user_id"] = user_id;
  if (entity.type == "BUY" && entity.pricetotal > 0) {
    entity.pricetotal *= -1;
  }
  if (entity.id == undefined) {
    db.insert(entity).into("portfolio").then((result) => {      
      console.log("created transaction: " + entity.isin + " result: "+JSON.stringify(result));
      entity.id = result;
      res.json({msg:'created transaction', transaction: entity});
    }
    ).catch((err) => {
      console.error("Could not create transaction", err.message);
      res.status(500).send("Could not insert transaction");
    });
  } else {
    var pk = {id: entity.id, user_id: user_id}; // for security reasons user_id is part of PK
    var fields = {	isin: entity.isin, amount: entity.amount, date: entity.date, 
                    pricetotal: entity.pricetotal, type: entity.type, comment: entity.comment	};
    db.update(fields).into("portfolio").where(pk).then((result) => {
      console.log("updated transaction: " + entity.isin);
      res.json({msg:'Updated transaction', transaction: entity});
    }).catch((err) => {
      console.error("Could not update transaction", err.message);
      res.status(500).send("Could not update transaction");
    });
  }
});

/**
 * get /api/portfolio/:transactionid
 */
router.get('/delete/:transactionid', (req, res, next) => {
  var transactionid = req.params.transactionid;
  const db = req.app.locals.db;
  var user_id = res.locals.userid;
  db.del().from("portfolio").where({id:transactionid, user_id: user_id}).then((result) => {
    console.log("deleted transaction: " + transactionid);
    res.json({msg:'Deleted transaction', deleted_transaction_id: transactionid});
  }).catch((err) => {
    console.error("Could not delete transaction", err.message);
    res.status(500).send("Could not delete transaction");
  });
});

module.exports = router;


function handleRowsforOverview(rows) {
  console.log("handleRowsforOverview: start");
  var rates = fixer_io.getExchangeRates();
  var obj = {currency:'EUR', stock_sum: 0, overview: []};
  rows[0].forEach((entry) => {
    entry.timeseries = {};
    
    // sum up each line to a total 
    var rate = rates[entry.currency];
    var priceInEUR = entry.lastprice / rate;
    obj.stock_sum += (entry.amount * priceInEUR);
    // convert entryprice in isin currency (from EUR)
    entry.entryprice = entry.entryprice * rate;
    //
    obj.overview.push(entry);
  });
  return obj;
}

function handleRowsForMonthlyPrices(rows, resObj) {
  console.log("handleRowsForMonthlyPrices: start");
  resObj.overview_cols = [];
  // prepare col header
  const monthCfg = config.PORTFOLIO_PROGRESS_COLS;
  for (let i = 0; i < monthCfg.length; i++) {
    var d = new Date();
    d.setDate(1); // to avoid strange behavior at end of month
    d.setMonth(d.getMonth() - monthCfg[i]);
    var yymmString = d.toISOString().substr(0,7).replace("-","");
    
    var timestr = monthCfg[i]+"m";
    if (monthCfg[i] > 11) {
      timestr = Math.ceil(monthCfg[i] / 12) + "y";
      if (monthCfg[i]%12 != 0) {
        timestr += " "+ monthCfg[i]%12 + "m"
      }
    }
    resObj.overview_cols.unshift({yyyymm:yymmString, timestr:timestr});
    //console.log("handleRowsForMonthlyPrices: yymmString="+yymmString);
    resObj.overview.forEach(o => {
      o.timeseries[yymmString] = {price:0,growth:0};
      //console.log("handleRowsForMonthlyPrices:     isin="+o.isin);
    });
  }
  console.log("handleRowsForMonthlyPrices: values.");
  // values
  rows[0].forEach((entry) => {
    var isinRow = resObj.overview.filter(p => p.isin == entry.isin);
    isinRow.forEach(e => {
      if (entry.datemonth in e.timeseries) {
        e.timeseries[entry.datemonth].price = entry.price;
        //console.log("handleRowsForMonthlyPrices: ["+e.isin+" | "+entry.datemonth+" "+entry.price);
      }
    });
  });
  console.log("handleRowsForMonthlyPrices: calc growth");
  // calculate the growth
  for (let i = 0; i < resObj.overview_cols.length; i++) {
    const currYYMM = resObj.overview_cols[i].yyyymm;
    resObj.overview.forEach(entry => {
      const currPrice = entry.timeseries[currYYMM].price;
      if (currPrice > 0) {
        entry.timeseries[currYYMM].growth = entry.lastprice / currPrice  - 1;
        if (entry.isin == "DE0008430026") {
          console.log(currYYMM + ": lastprice="+entry.lastprice+" currPrice="+currPrice+" => "+entry.timeseries[currYYMM].growth);
        }
      }
    });
  }
  console.log("handleRowsForMonthlyPrices: end");
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
    if (resultObj.depotExpectedValue != 0) {
      console.log(Date.now() + " portfolio: " + (resultObj.depotExpectedValue != 0));
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
      console.log(Date.now() + " portfolio: calc annual percentage: cP="+cP+" p="+p);
    } else {
      p = 1; // abort
    }
  } while (p < 0.9995 || p > 1.0005);
}

function internalDepotExpectedValue(annualentries, percentage) {
  var yearNow = new Date().getUTCFullYear();
  var expectedSum = 0;
  annualentries.forEach((entry) => {
    // =B3*POW(1+$C$1;Year(now())-A3+1)
    //console.log("internalDepotExpectedValue: yearNow="+yearNow+" entry.year="+entry.year+" percentage="+percentage);
    var expected = entry.cashinyear * Math.pow(1+percentage, yearNow - entry.year + 1);
    entry["expected_value"] = expected;
    expectedSum += expected;
  });
  return expectedSum;
}