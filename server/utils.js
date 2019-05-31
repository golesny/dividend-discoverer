module.exports = {
    /*    foo: function () {
          // whatever
        },*/
        convertDateToUTC: function(d) {
            var hoursDiff = d.getHours() - d.getTimezoneOffset() / 60;
            var minutesDiff = (d.getHours() - d.getTimezoneOffset()) % 60;
            d.setHours(hoursDiff);
            d.setMinutes(minutesDiff);
            return d;
        },
        avg: function(values) {
          var len = values.length;
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