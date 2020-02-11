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
const http = require('http');
const https = require('https');

/*
 * get exchange rates 
 */
module.exports = {
  getExchangeRates: function (locals) {
    if (this.updateNeeded()) {
      const path = "/api/latest?access_key=" + config.FIXER_IO_ACCESS_TOKEN + "&symbols=" + config.EXCHANGE_LIST + "&format=1";
      console.log("loading exchange rates");
      const options = {
          host: 'data.fixer.io',
          port: 80,
          path: path,
          method: 'GET',
          headers: {'Content-Type': 'application/json'}
        };

        this.getJSON(options, (statusCode, result) => {
          console.log(`loaded exchange rates: (${statusCode});\n${JSON.stringify(result)}`);
          // for London stock exchange we have to add GPpence
          if ("GBP" in result.rates) {
            result.rates["GB_"] = result.rates["GBP"] * 100;
            console.log("add GP_(pence) as currency for London stock exchange.");
          }
          global.ratesObj = result;
          this.storeExchange(locals);
        });
        return undefined;
      }
      if (global.ratesObj != undefined) {
        return global.ratesObj.rates;
      }
    },
  getJSON: function (options, onResult) {
    const port = options.port == 443 ? https : http;
    let output = '';
    const req = port.request(options, (res) => {
      console.log(`${options.host} : ${res.statusCode}`);
      res.setEncoding('utf8');
  
      res.on('data', (chunk) => {
        output += chunk;
      });
  
      res.on('end', () => {
        let obj = JSON.parse(output);
  
        onResult(res.statusCode, obj);
      });
    });
  
    req.on('error', (err) => {
      // res.send('error: ' + err.message);
      console.error("Could not load: "+err.message);
    });
  
    req.end();
  },
  updateNeeded: function() {
    // update exchange rates
    var timeInDay = Math.ceil(Date.now() / (1000 * 60 * 60 * 24));
    var lastLoaded = 0;
    if (global.ratesObj != undefined) {
      lastLoaded = Math.ceil(global.ratesObj.timestamp / (60 * 60 * 24));
    }
    if (global.ratesObj == undefined || timeInDay != lastLoaded) {
      console.log("exchange rates: update needed. now="+timeInDay+ " lastLoaded="+lastLoaded);
      // load the first time or after a day make a refresh
      return true;
    }
    console.debug("exchange rates: using cached. now="+timeInDay+ " lastLoaded="+lastLoaded);
    return false;
  },
  storeExchange: function(appLocal) {
    var entities = [];
    // create entities
    var keysArr = Array.from(Object.keys(global.ratesObj.rates));
    keysArr.forEach(currency => {
        entities.push({currency: currency, date: global.ratesObj.date, exhange_rate: global.ratesObj.rates[currency]});
    });
    //console.log("store exchange rates: "+JSON.stringify(entities));
    // store in db
    appLocal.db.insert(entities).from("exchange").then((rows) => {
        global.ratesObjDate = global.ratesObj.date;
        console.log("stored exchange rates with date "+global.ratesObj.date);
    })
    .catch((err) => {
        console.error("Could not insert exchange rates:", err.message);
    });
}
}