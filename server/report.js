const utils = require("./utils");

module.exports = {
/*    foo: function () {
      // whatever
    },*/
    updateReportForISIN: function(db, isin, res) {
      db.select("price").from("price").limit(1).where({"isin": isin}).orderBy('date', 'desc')
      .then((rows) => {
        rows.map((lastPriceRow) => {
          var lastPrice = lastPriceRow.price;
          console.log("last Price is "+lastPrice);
          internalReportUpdate(db, isin, res, lastPrice);
        });
      }).catch((error) => {
        console.error("Could not get last price for isin " + isin+": " + error);
        res.status(500).send("Could not get last price for isin "+isin);
      });
    }      
}

function internalReportUpdate(db, isin, res, lastPrice) {
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
        last10yPercentage = utils.roundDec10_2((resLst[0].price / resLst[9].price - 1) * 100); // Example 10€ / 5 € - 1 = 1 => 100%
      }
    }
    // calculate last20y dividends
    if (resLst.length >= 20) {
      if (resLst[19].price != 0) {
        last20yPercentage = utils.roundDec10_2((resLst[0].price / resLst[19].price  - 1) * 100);
      }
    }
    // count div increases/equal/decreases streak
    var percentages = [];
    for (let i = 1; i < resLst.length; i++) {
      const prevY = resLst[i];
      const thisY = resLst[i-1];
      if (prevY.price == thisY.price) {
        div_equal++;
      } else if (prevY.price < thisY.price) {
        div_increases++;
      } else {
        div_decreases++;
      }
      // add percentage
      if (prevY.price != 0) { 
        var percentage = (thisY.price / prevY.price);            
        percentages.push(percentage);
      }
    }
    var medianDiv = utils.median(percentages);    
    console.log("median = " + medianDiv + " resLst[0]=" + resLst[0].price);
    // div in 30y (=POW(1+E2;30)*D2*B2)
    var countStocks = Math.round(10000 / lastPrice);
    var divIn30y = Math.round(Math.pow(medianDiv, 30) * resLst[0].price * countStocks);
    divIn30y = utils.roundDec10_2(divIn30y);
    // div Cum 30y cum =B2*D2*(POW(1+E2;30)-1)/(E2)
    var divCum30y = Math.round(resLst[0].price * countStocks * (Math.pow(medianDiv, 30) - 1 ) / (medianDiv - 1));
    divCum30y = utils.roundDec10_2(divCum30y);
    console.log("divCum30y="+divCum30y+" divIn30y="+divIn30y);
    // delete old report data
    db.delete().from("report").where("isin", isin).then((r) => {
      console.log("report deleted for "+isin);

        // insert new data
        medianDiv = utils.roundDec10_2((medianDiv - 1) * 100);
        var reportEntry = { "isin":isin,
                            "last10yPercentage": last10yPercentage,
                            "last20yPercentage": last20yPercentage,
                            "divIn30y": divIn30y,
                            "divCum30y":divCum30y,
                            "div_increases": div_increases,
                            "div_equal": div_equal,
                            "div_decreases": div_decreases,
                            "div_median": medianDiv
                          };
        db("report").insert(reportEntry)
        .then((r) => {
          console.log("report created for "+isin);
          res.json({"msg":"Report created", "report":reportEntry});
        })
        .catch((err) => {console.error("Could not insert report: "+err);
                        res.status(500).send("Could not insert the report for isin "+isin+". "+err);
        });

    })
    .catch((err) => {console.error("Could not delete old report: "+err);
                     res.status(500).send("Could not delete old report for isin "+isin);
                    });    
  }).catch((error) => {
    console.error("Could not update report for isin " + isin+": " + error);
    res.status(500).send("Could not update the report for isin "+isin+". "+error);
  });
}