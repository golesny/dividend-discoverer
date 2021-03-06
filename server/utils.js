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

module.exports = {
    /*    foo: function () {
          // whatever
        },*/
        avg: function(values) {
          if (values == undefined) {
            return 0.0;
          }
          var len = values.length;
          if (len == 0) {
            return 0.0;
          }
          var sum = 0;
          for (let i = 0; i < values.length; i++) {
            sum  += values[i];
          }
          var avg = sum / len;
          return avg; 
        },
        /**
         * makes an Decimal(10,2)
         * @param {number} value 
         */
        roundDec10_2: function(value) {
          return Math.round(value * 100) / 100;
        }
    }