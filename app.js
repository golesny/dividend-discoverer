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
console.log("isDevMode="+isDevMode);

const path = require('path');
const express = require('express');

const app = express();

const staticExtensions = ['.js', '.ico', '.css'];

app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', true);

// static content (accessable without login)
app.use(express.static("webapp/dist/webapp"));

// authentification of all other requests
app.use("*", require('./server/auth.js')); 
// business logic modules
app.use('/api/stock', require('./server/stock.js'));

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

if (module === require.main) {
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
}

module.exports = app;
