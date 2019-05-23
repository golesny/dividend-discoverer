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
 * GET /api/books/:id
 *
 * Retrieve a book.
 */
router.get('/', (req, res, next) => {
    var entity = [{"isin" : {'isin': "DE1", 'name': "NDE1", 'currency': '€'},
    'last10yPercentage': 5.6,
    'last20yPercentage': 3.5,
    'divIn30y': 4000,
    'divCum30y': 30000 },
    {"isin" : {'isin': "DE2", 'name': "NDE2", 'currency': '€'},
    'last10yPercentage': 5.6,
    'last20yPercentage': 3.5,
    'divIn30y': 4000,
    'divCum30y': 30000 }];
    console.log("sending stocks");
    res.json(entity);
});

/*
 * get ISINs 
 */
router.get('/isin/list', (req, res, next) => {
  db.select().from('isin').orderBy('name').then((result) => {
    var isinList = [];
    result.map((entry) => {
      isinList.push(entry);
      console.log(util.inspect(entry, false, null, isDevMode /* enable colors */))
    });
    console.log("sending isin list, count="+isinList.length);
    res.json(isinList);
  }).catch((error) => {
    console.error(error);
    res.status(500).send("Could not read isin");
  });
});

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