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

module.exports = {
    loadCurrentPrices: function (db) {
      var promises = [];
      db.select().from("isin").whereNotNull("symbol")
        .then((rows) => {
            rows.map((entry) => {
              promises.push(createPromise(db, entry, promises.length * 12000)); // we are allowed to make every 12 s a call
            })
          }).catch((error) => {
            console.error(error);
            res.status(500).send("Could not read symbols for price updates");
          });

      Promise.all(promises);
      }
    };

    function createPromise(db, isin, timeout) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          alphavantage.getGlobalQuote(isin.symbol, result => {
            if ("Error Message" in result) {
              // error
              reject(isin.isin+": error");
            } else {
              // put to db
              var quote = result["Global Quote"];
              var priceentity = {isin: isin.isin, date: quote["07. latest trading day"], price: Number.parseFloat(quote["05. price"])};
              db.insert(priceentity).into('price').then((result) => {
                console.log("created price", result);
                report.updateReportForISIN(db, isin.isin, isin.currency, (errormsg) => {
                  console.error(errormsg);
                  resolve(isin.isin+": "+errormsg);
                },
                (msg, reportEntity) => {
                  console.log("report created for isin "+isin.isin);
                }
                );
              }).catch((err) => {
                console.error("Could not create price for isin "+isin.isin, err.message);
                reject(isin.isin+": "+err.message);
              });
            }
            
          });
        }, timeout);
      })
    }