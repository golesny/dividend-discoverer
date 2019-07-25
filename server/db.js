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

// db
const Knex = require("knex");

module.exports = {
    connect: function () {
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
        },
    initUsers: function(appLocal) {
        appLocal.db.select().from("user")
        .then((rows) => {
            var users  = {};
            rows.map((entry) => {       
                entry.userrights = entry.userrights.split(",");     
                users[entry.id] = entry;            
            });
            console.log("loaded "+Object.keys(users).length+" user(s) from database");
            appLocal.users = users;
        })
        .catch((err) => {
            console.error("Could not read users from database", err.message);
        });
    }
}