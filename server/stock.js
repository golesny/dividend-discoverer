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

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
router.use(bodyParser.json());

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
    res.json(entity);
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