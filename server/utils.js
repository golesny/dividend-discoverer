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
        /**
         * Calculates the median of all values
         * @param {*} values 
         */
        median: function(values) {
            if(values.length === 0) return 0;
          
            values.sort(function(a,b){
              return a-b;
            });
          
            var half = Math.floor(values.length / 2);
          
            if (values.length % 2)
              return values[half];
          
            return (values[half - 1] + values[half]) / 2.0;
        },
        /**
         * makes an Decimal(10,2)
         * @param {number} value 
         */
        roundDec10_2: function(value) {
          return Math.round(value * 100) / 100;
        }
    }