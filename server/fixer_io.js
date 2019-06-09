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
const util = require('util');
const http = require('http');
const https = require('https');

/*
 * get exchange rates 
 */
module.exports.loadCurrencies = () => {
    const path = "/api/latest?access_key=" + config.FIXER_IO_ACCESS_TOKEN + "&symbols=USD,AUD,CAD,SKR,CHF,DKK,GBP&format=1";
    const options = {
        host: 'data.fixer.io',
        port: 80,
        path: path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      this.getJSON(options, (statusCode, result) => {
        console.log(`loaded currencies: (${statusCode})\n\n${JSON.stringify(result)}`);
        global.rates = result.rates;
      });

  };

/**
 * 
 */
  module.exports.getJSON = (options, onResult) => {
    console.log('rest::getJSON');
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
    });
  
    req.end();
  };
