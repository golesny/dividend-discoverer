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
const alphavantage = require('./alphavantage.js');
const report = require("./report");
const fixer_io = require("./fixer_io");

module.exports = {
    loadCurrentPrices: function (db) {
      var promises = [];
      db.raw("select isin.*, max(price.date) as lastdate from isin "+
             "left join price on isin.isin = price.isin "+
             "where symbol != '' "+
             "group by isin.isin "+
             "order by lastdate ASC "+
             "limit 300")
        .then((rows) => {
            rows[0].forEach((entry) => {
              promises.push(createPromise(db, entry, promises.length * 13000)); // we are allowed to make every 13 s a call (5/minute is maximum)
            })
          }).catch((error) => {
            console.error(error);
            res.status(500).send("Could not read symbols for price updates");
          });

      Promise.all(promises)
             .then(function(arrayOfValuesOrErrors) {

             })
             .catch(function(err) {console.error("batch: "+err.message)});
      }
    };

    function createPromise(db, isin, timeout) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          alphavantage.getGlobalQuote(isin.symbol, result => {
            if ("Error Message" in result) {
              // error
              handleServiceErrorResult(isin, result, db);
              //reject(isin.isin + ": error");
            } else if ("Global Quote" in result && "07. latest trading day" in result["Global Quote"]) {
              // put to db
              var quote = result["Global Quote"];
              var p = Number.parseFloat(quote["05. price"]);
              // convert currency
              // Example: symbolcurrency USD --> EUR --> target currency DKK 
              // price 100 USD / 1.12 = 89,2 EUR
              // 89,2 EUR * 7.46 = 665,42 DKK
              if (isin.symbolcurrency && isin.currency != isin.symbolcurrency && isin.symbolcurrency.length == 3) {
                var rates = fixer_io.getExchangeRates();
                var symbolcurr = rates[isin.symbolcurrency];
                var stockcurr = rates[isin.currency];
                var priceInEUR = p / symbolcurr;
                var pInTargetCurr = priceInEUR * stockcurr;
                console.log("converted "+p+" "+isin.symbolcurrency+" -> "+priceInEUR+" EUR "+" -> "+pInTargetCurr+" "+isin.currency);
                p = pInTargetCurr;
              }
              var priceentity = {isin: isin.isin, date: quote["07. latest trading day"], price: p};
              db.insert(priceentity).into('price').then((result) => {
                console.log("created price", result);
                report.updateReportForISIN(db, isin.isin, isin.currency, (errormsg) => {
                  console.error(errormsg);
                  resolve(isin.isin+": "+errormsg);
                },
                (msg, reportEntity) => {
                  console.log("report created for isin "+isin.isin);
                  resolve(isin.isin);
                }
                );
              }).catch((err) => {
                console.error("Could not create price for isin "+isin.isin, err.message);
                //reject(isin.isin+": "+err.message);
              });
            } else {
              handleServiceBadData(isin, result, db, reject);
              //reject(isin.isin + ": error");
            }
          });
        }, timeout);
      })
    }

function handleServiceBadData(isin, result, db) {
  console.log("skipping due to bad data");
  var log = { severity: 2, isin: isin.isin, message: result };
  db.insert(log).into("log").then((result) => {
    console.error(isin.isin + ": error");
  }).catch((err) => {
    console.error("Could not insert log line. Origin: " + isin.isin + ": error");
  });
}

function handleServiceErrorResult(isin, result, db) {
  var log = { severity: 2, isin: isin.isin, message: JSON.stringify(result) };
  db.insert(log).into("log").then((result) => {
    // do nothing
  }).catch((err) => {
    console.error("batch: "+err);
  });
}
