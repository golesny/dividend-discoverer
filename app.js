// Copyright 2019, Daniel Nettesheim.
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
console.log("startup: isDevMode="+isDevMode);

const path = require('path');
const express = require('express');
const fixerIO = require('./server/fixer_io.js');
global.ratesObj;
fixerIO.getExchangeRates(); // first pre-load
const alphavantage = require('./server/alphavantage.js');
const batch = require('./server/batch.js');

const app = express();

const database = require("./server/db");
app.locals.db = database.connect();
database.initUsers(app.locals);

app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', true);

// static content (accessable without login)
var oneDay = 86400000;
app.use(express.static("webapp/dist/webapp",{
  maxAge: oneDay
}));

// authentification of api requests
app.use("/", require('./server/auth.js'));
// business logic modules
app.use('/api/stock', require('./server/stock.js'));
// Returns the exchange rates
app.get('/api/rates', (req, res, next) => {
  var rates = fixerIO.getExchangeRates();
  res.json(rates);
});
// Returns the monthly data
app.get('/api/monthlyadjusted/:symbol', (req, res, next) => {
  var symbol = req.params.symbol;
  alphavantage.getMonthlyAdjusted(symbol, res);
});
// alpha symbol search
app.get('/api/symbolsearch/:keyword', (req, res, next) => {
  var keyword = req.params.keyword;
  alphavantage.getSymbolProposals(keyword, res);
});
// Portfolio
app.use('/api/portfolio', require('./server/portfolio.js'));
// Batch calls
app.get('/api/updateallprices', (req, res, next) => {
  batch.loadCurrentPrices(req.app.locals.db);
  res.json({msg: "Batch Queued"});
});
// user
app.use('/api/user', require('./server/user.js'));

// import
app.use('/api/import', require('./server/import.js'));

// Redirect the rest to /index.html (that the sub-pathes are supported)
app.use((req, res) => {
  res.sendFile(path.resolve("./webapp/dist/webapp/index.html"));
});

if (module === require.main) {
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`startup: App listening on port ${port}`);
  });
}

module.exports = app;
