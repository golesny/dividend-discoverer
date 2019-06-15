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
const utils = require("./utils");
const fixer_io = require("./fixer_io");

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// db
const Knex = require("knex");

const report = require("./report");

function connect() {
  console.log("connecting to db "+config.SQL_DATABASE);
  const dbconf = {
    user: config.SQL_USER,
    password: config.SQL_PASSWORD,
    database: config.SQL_DATABASE,
    timezone: 'UTC',
    typeCast: function (field, next) {
      if (field.type == 'DATE') {
        return field.string().substr(0,10);
      }
      return next();
    }
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
 * Returns reports
 */
router.get('/', (req, res, next) => {
    // prepare report
    console.log("preparing reports");
    var rates = fixer_io.getExchangeRates();
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
            // calc exchange rate
            var rate = rates[row.currency];
            rep["divCum30yEUR"] = utils.roundDec10_2(rep.divCum30y / rate);
            rep["divIn30yEUR"] = utils.roundDec10_2(rep.divIn30y / rate);
            resLst.push(rep);
            console.log("Merged: "+util.inspect(rep, false, null, isDevMode /* enable colors */))
          }
      });
      // sort by cum 30y
      resLst.sort((a, b) => (a.divCum30yEUR > b.divCum30yEUR) ? -1 : 1);
      //
      console.log("sending report list, count="+resLst.length);
      res.json(resLst);
    }).catch((error) => {
      console.trace(error);
      res.status(500).send("Could not read isin");
    });


    }).catch((err) => {
      console.trace(err);
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
  db.raw("select isin.isin, isin.name, isin.sector, isin.currency, "+
         "(select year(max(dividend.date))  from `dividend` where isin.`isin` = dividend.`isin`) as latest_div, "+
         "(select year(max(price.date))  from `price` where isin.`isin` = price.`isin`) as latest_price, "+
         "(select count(*) from `report` where isin.`isin` = report.`isin`) as report_count "+
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
    console.trace(error);
    res.status(500).send("Could not read isin");
  });
});

/*
 * get Dividends 
 */
router.get('/dividend/list/:isin', (req, res, next) => {
  var isin = req.params.isin;
  db.raw("SELECT div1.*, div2.estimated as estimated2 FROM `dividend` div1 "+
         "left join `dividend` div2 on div2.isin ='"+isin+"' and div1.date  = div2.date and div2.estimated = 0 " +
         "WHERE div1.isin ='"+isin+"' " +
         "group by div1.isin, div1.date, div1.estimated " +
         "having div1.estimated = 0 OR estimated2 IS NULL " +
         "order by div1.date desc")
         .then((result) => {
          var resLst = [];
          result[0].forEach((entry) => {
            entry.inDB = true;
            if (resLst.length > 0) {
              resLst[resLst.length-1].deltaPercentage = Math.round((resLst[resLst.length-1].price / entry.price - 1) * 10000) / 100;
            }
            resLst.push(entry);
          });
          console.log("sending dividend list, count="+resLst.length);
          res.json(resLst); 
        }).catch((error) => {
          console.trace(error);
          res.status(500).send("Could not read dividend for isin "+isin);
        });

});
/*
 * get Prices 
 */
router.get('/price/list/:isin', (req, res, next) => {
  handleGetList("price", req, res);
});

/**
 * 
 * @param {price} type 
 * @param {*} req 
 * @param {*} res 
 */
function handleGetList(type, req, res) {
  var isin = req.params.isin;
  db.select().from(type).where({"isin": isin}).orderBy('date', 'desc').then((rows) => {
    var resLst = [];
    rows.map((entry) => {
      entry.inDB = true;
      if (resLst.length > 0) {
        resLst[resLst.length-1].deltaPercentage = Math.round((resLst[resLst.length-1].price / entry.price - 1) * 10000) / 100;
      }
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
 * create new ISIN.
 * currency is not used, it's just for same api to other create urls 
 */
  router.post('/isin/create/:currency', (req, res, next) => {
    var entity = req.body;
    // trim isin
    entity.isin = entity.isin.trim();
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

  router.post('/price/create/:currency', (req, res, next) => {
    var priceentity = req.body; // array of PriceDatePairs
    var currency = req.params.currency;
    console.log("creating ", util.inspect(priceentity, false, null, isDevMode /* enable colors */));
    for (let i = 0; i < priceentity.length; i++) {
      delete priceentity[i]["estimated"];
    }
    db.insert(priceentity).into("price").then((result) => {      
      console.log("created price", result);
      report.updateReportForISIN(db, priceentity[0].isin, currency, (errormsg) => {
        console.error(errormsg);
        res.status(500).send(errormsg);
      },
      (msg, reportEntity) => {
        console.log("report created");
        res.json({msg: msg, report: reportEntity, pricepairs: priceentity});
      }
      );
    }
    ).catch((err) => {
      console.error("Could not create price", err.message);
       res.status(500).send("Could not insert price");
    });
  });

  router.post('/dividend/create/:currency', (req, res, next) => {
    var diventities = req.body; // array of PriceDatePairs
    var currency = req.params.currency;
    console.log("creating ", util.inspect(diventities, false, null, isDevMode /* enable colors */));
    db.insert(diventities).into("dividend").then((result) => {      
      console.log("created dividend", result);
      report.updateReportForISIN(db, diventities[0].isin, currency, (errormsg) => {
        console.error(errormsg);
        res.status(500).send(errormsg);
      },
      (msg, reportEntity) => {
        console.log("report created");
        res.json({msg: msg, report:reportEntity, pricepairs: diventities});
      });
    }
    ).catch((err) => {
      console.error("Could not create dividend", err.message);
       res.status(500).send("Could not insert dividend");
    });
  });

  /**
 * create new Report
 */
router.post('/report/recreate/:isin/:currency', (req, res, next) => {
  var isin = req.params.isin;
  var currency = req.params.currency;
  console.log("creating "+ isin);
  report.updateReportForISIN(db, isin, currency, (errormsg) => {
        console.error(errormsg);
        res.status(500).send(errormsg);
      },
      (msg, reportEntity) => {
        console.log("report created");
        res.json({msg: msg, report: reportEntity});
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