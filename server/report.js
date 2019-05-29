const utils = require("./utils");

module.exports = {
/*    foo: function () {
      // whatever
    },*/
    updateReportForISIN: function(db, isin, res) {
        db.select().from("dividend").where({"isin": isin}).orderBy('date', 'desc').then((rows) => {
          console.log("start updating report for isin "+isin);
          var last10yPercentage = undefined;
          var last20yPercentage = undefined;
          var div_increases = 0;
            var div_equal = 0;
            var div_decreases = 0;
          var resLst = [];
          rows.map((entry) => {
            entry.date = utils.convertDateToUTC(entry.date); 
            resLst.push(entry);
          });
          var maxYear = new Date(resLst[0].date).getFullYear();
          // calculate last10y dividends
          if (resLst.length >= 10) {
            if (resLst[9].price != 0) {
              console.log("last10yPerc: [9]="+resLst[9].price+" [0]="+resLst[0].price);
              last10yPercentage = (resLst[0].price / resLst[9].price - 1) * 100; // Example 10€ / 5 € - 1 = 1 => 100%
            }
          }
          // calculate last20y dividends
          if (resLst.length >= 20) {
            if (resLst[19].price != 0) {
              last20yPercentage = (resLst[0].price /  - 1) * 100;
            }
          }
          // count div increases/equal/decreases streak
          for (let i = 1; i < resLst.length; i++) {
            const prevY = resLst[i];
            const thisY = resLst[i-1];
            console.log("compare: "+prevY.price + " vs. "+ thisY.price);
            if (prevY.price == thisY.price) {
              div_equal++;
            } else if (prevY.price < thisY.price) {
              div_increases++;
            } else {
              div_decreases++;
            }
          }
          // delete old report data
          db.delete().from("report").where("isin", isin).then((r) => console.log("report deleted for "+isin))
          .catch((err) => {console.error("Could not delete old report: "+error);
                           res.status(500).send("Could not delete old report for isin "+isin);
                          });
          // insert new data
          db("report").insert({"isin":isin,
                               "last10yPercentage": last10yPercentage,
                               "last20yPercentage": last20yPercentage,
                               "divIn30y":0,
                               "divCum30y":0,
                               "div_increases": div_increases,
                               "div_equal": div_equal,
                               "div_decreases": div_decreases
                              })
          .then((r) => {
            console.log("report created for "+isin);
            res.json({"msg":"Report created"});
          })
          .catch((err) => {console.error("Could not insert report: "+err);
                           res.status(500).send("Could not insert the report for isin "+isin);
                          });
        }).catch((error) => {
          console.error("Could not update report for isin " + isin+": " + error);
          res.status(500).send("Could not update the report for isin "+isin);
        });
      }
}