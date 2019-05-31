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
        var percentage = (thisY.price / prevY.price - 1) * 100; 
        console.log(thisY.price+ " -> "+prevY.price+" = "+percentage+"%");           
        percentages.push(percentage);
      }
    }    
    var avgDiv = utils.avg(percentages);   
    var avgDivForCalc = avgDiv;
    avgDiv = utils.roundDec10_2(avgDiv);
    var avg5Div = undefined;
    if (percentages.length >= 5) {
      avg5Div = utils.avg(percentages.slice(0,5));
      avgDivForCalc = Math.min(avgDiv, avg5Div);
      avg5Div = utils.roundDec10_2(avg5Div);
    }
    var avg10Div = undefined;
    if (percentages.length >= 10) {
      avg10Div = utils.avg(percentages.slice(0,10));
      avgDivForCalc = Math.min(avgDivForCalc, avg10Div);
      avg10Div = utils.roundDec10_2(avg10Div);
    }
    console.log("avg = " + avgDiv + " avg5Div="+avg5Div+" avg10Div" +avg10Div +" resLst[0]=" + resLst[0].price);
    console.log("using "+avgDivForCalc+" for div calc");
    // div in 30y (=POW(1+E2;30)*D2*B2)
    var countStocks = Math.round(10000 / lastPrice);
    var divIn30y = Math.round(Math.pow(1 + avgDivForCalc/100, 30) * resLst[0].price * countStocks);
    divIn30y = utils.roundDec10_2(divIn30y);
    // div Cum 30y cum =B2*D2*(POW(1+E2;30)-1)/(E2)
    var divCum30y = Math.round(resLst[0].price * countStocks * (Math.pow(1 + avgDivForCalc/100, 30) - 1 ) / (avgDivForCalc/100));
    divCum30y = utils.roundDec10_2(divCum30y);
    console.log("divCum30y="+divCum30y+" divIn30y="+divIn30y);
    // delete old report data
    db.delete().from("report").where("isin", isin).then((r) => {
      console.log("report deleted for "+isin);

        // insert new data
        var reportEntry = { "isin":isin,
                            "last10yPercentage": last10yPercentage,
                            "last20yPercentage": last20yPercentage,
                            "divIn30y": divIn30y,
                            "divCum30y":divCum30y,
                            "div_increases": div_increases,
                            "div_equal": div_equal,
                            "div_decreases": div_decreases,
                            "div_avg": avgDiv
                          };
        if (avg5Div != undefined) {
          reportEntry["div_5_avg"] = avg5Div;
        }
        if (avg10Div != undefined) {
          reportEntry["div_10_avg"] = avg10Div;
        }
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