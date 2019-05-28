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
        }
    }