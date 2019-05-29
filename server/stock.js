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
const util = require('util')

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// db
const Knex = require("knex");

require("./utils");
require("./report");

function connect() {
  console.log("connecting to db "+config.SQL_DATABASE);
  const dbconf = {
    user: config.SQL_USER,
    password: config.SQL_PASSWORD,
    database: config.SQL_DATABASE
  }
  if (config.SQL_USE_UNIXSOCKET) {
    dbconf.socketPath = `/cloudsql/${config.INSTANCE_CONNECTION_NAME}`;
  } else {
    dbconf.host = config.INSTANCE_CONNECTION_NAME
    //dbconf.port = 3307
  }
  const knex = Knex({
    client: 'mysql',
    connection: dbconf
  });
  return knex;
}

const db = connect();
    
/**
 * GET /api/stock/
 *
 * Retrieve reports
 */
router.get('/', (req, res, next) => {
    // prepare report
    console.log("preparing reports");
    var reports = {};
    db.select().from('report').then((repRow) => {      
      repRow.forEach((rep) => {
        if (rep.isin != undefined) {
          console.log("add report with isin "+rep.isin);
          reports[rep.isin] = rep;
        }
      });
      console.log("Reports: "+util.inspect(reports, false, null, isDevMode /* enable colors */));
      // 
    db.select().from('isin').orderBy('name').then((result) => {
      // join
      var resLst = [];
      result.forEach((row) => {
        console.log("isin row: "+util.inspect(row, false, null, isDevMode /* enable colors */))
          // merge report + isin
          var rep = reports[row.isin];
          if (rep != undefined) {
            rep["name"] = row.name;
            rep["currency"] = row.currency;
            resLst.push(rep);
            console.log("Merged: "+util.inspect(rep, false, null, isDevMode /* enable colors */))
          }
      });
      console.log("sending report list, count="+resLst.length);
      res.json(resLst);
    }).catch((error) => {
      console.error(error);
      res.status(500).send("Could not read isin");
    });


    }).catch((err) => {
      console.error(err);
      res.status(500).send("Could not read reports");
    });
    
    
});



/*
 * get ISINs 
 */
router.get('/isin/list', (req, res, next) => {
  // select isin.isin, isin.name, isin.currency, year(max(dividend.date)) as latest_entry from `isin`
  // left join `dividend` on isin.`isin` = dividend.`isin`
  //group by isin
  db.raw("select isin.isin, isin.name, isin.currency, "+
         "(select year(max(dividend.date))  from `dividend` where isin.`isin` = dividend.`isin`) as latest_div, "+
         "(select year(max(price.date))  from `price` where isin.`isin` = price.`isin`) as latest_price "+
         "from `isin` "+
         "group by isin")
        .then((result) => {
    var isinList = [];
    result[0].forEach((entry) => {
      isinList.push(entry);
      console.log("Entry: "+util.inspect(entry, false, null, isDevMode /* enable colors */))
    });
    console.log("sending isin list, count="+isinList.length);
    res.json(isinList);
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Could not read isin");
  });
});

/*
 * get Dividends 
 */
router.get('/dividend/list/:isin', (req, res, next) => {
  handleGetList("dividend", req, res);
});
/*
 * get Prices 
 */
router.get('/price/list/:isin', (req, res, next) => {
  handleGetList("price", req, res);
});

/**
 * 
 * @param {price|dividend} type 
 * @param {*} req 
 * @param {*} res 
 */
function handleGetList(type, req, res) {
  var isin = req.params.isin;
  db.select().from(type).where({"isin": isin}).orderBy('date', 'desc').then((rows) => {
    var resLst = [];
    rows.map((entry) => {
      entry.inDB = true;       
      resLst.push(entry);
    });
    console.log("sending "+type+" list, count="+resLst.length);
    res.json(resLst);
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Could not read "+type+" for isin "+isin);
  });
}

/**
 * create new ISIN
 */
  router.post('/isin/create', (req, res, next) => {
    var entity = req.body;
    console.log("creating ", util.inspect(entity, false, null, isDevMode /* enable colors */));
    db.insert(entity).into("isin").then((result) => {      
      console.log("created isin", entity.isin);
      entity.updated_ts = new Date();
      res.json(entity);
    }
    ).catch((err) => {
      console.error("Could not create isin", err.message);
       res.status(500).send("Could not insert isin");
    });
  });

  router.post('/price/create', (req, res, next) => {
    var entity = req.body; // array of PriceDatePairs
    console.log("creating ", util.inspect(entity, false, null, isDevMode /* enable colors */));
    db.insert(entity).into("price").then((result) => {      
      console.log("created price", result);
      res.json(entity);
      updateReportForISIN(entity.isin);
    }
    ).catch((err) => {
      console.error("Could not create price", err.message);
       res.status(500).send("Could not insert price");
    });
  });

  router.post('/dividend/create', (req, res, next) => {
    var entity = req.body; // array of PriceDatePairs
    console.log("creating ", util.inspect(entity, false, null, isDevMode /* enable colors */));
    db.insert(entity).into("dividend").then((result) => {      
      console.log("created dividend", result);
      res.json(entity);
      updateReportForISIN(entity[0].isin);
    }
    ).catch((err) => {
      console.error("Could not create dividend", err.message);
       res.status(500).send("Could not insert dividend");
    });
  });

  /**
 * Errors on "/api/books/*" routes.
 */
router.use((err, req, res, next) => {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = {
      message: err.message,
      internalCode: err.code,
    };
    next(err);
  });
  
  module.exports = router;