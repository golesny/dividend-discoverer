const utils = require("./utils");
const fixer_io = require("./fixer_io");

module.exports = {
/*    foo: function () {
      // whatever
    },*/
    updateReportForISIN: function(db, isin, currency, callbackError, callbackSuccess) {
      db.select("price").from("price").limit(1).where({"isin": isin}).orderBy('date', 'desc')
      .then((rows) => {
        rows.map((lastPriceRow) => {
          var lastPrice = lastPriceRow.price;
          console.log("last Price is "+lastPrice);
          internalReportUpdate(db, isin, currency, lastPrice, callbackError, callbackSuccess);
        });
      }).catch((error) => {
        callbackError("Could not get last price for isin "+isin+". "+error.message);
      });
    }      
}

function internalReportUpdate(db, isin, currency, lastPrice, callbackError, callbackSuccess) {
  db.select().from("dividend").where({"isin": isin}).orderBy('date', 'desc')
  .then((rows) => {
      console.log("start updating report for isin " + isin);
      var rawResLst = [];
      rows.map((entry) => {      
        rawResLst.push(entry);
      });
      if (rawResLst.length == 0) {
        callbackSuccess("report creation ignored (no dividends) for isin "+isin, {}); 
      }
      const reportEntry = internalCreateReportEntity(isin, rawResLst, currency, lastPrice);
      // delete old report data
      db.delete().from("report").where("isin", isin).then((r) => {
        console.log("report deleted for "+isin);
          db("report").insert(reportEntry)
          .then((r2) => {
            // enrich with non-db fields
            var rates = fixer_io.getExchangeRates();
            var rate = rates[currency];
            reportEntry["divCum30yEUR"] = utils.roundDec10_2(reportEntry["divCum30y"] / rate);
            reportEntry["divIn30yEUR"] = utils.roundDec10_2(reportEntry["divIn30y"] / rate);
            // success
            callbackSuccess("report created for "+isin, reportEntry);            
          }).catch((err2) => { callbackError("Could not insert the report for isin "+isin+". "+err2.message) });
      })
      .catch((err) => { 
        console.log(err.message);
        callbackError("Could not delete old report for isin "+isin+". "+err.message) });    
  }).catch((error) => {
    console.log(error.message);
    callbackError("Could not update the report for isin "+isin+". "+error.message) });
}

function internalCreateReportEntity(isin, rawResLst, currency, lastPrice) { 
  var reportEntry = {
    "isin": isin
  } 
  var resLst = rawResLst.filter(e => !e.estimated);
  // count div increases/equal/decreases streak    
  var div_increases = 0;
  var div_equal = 0;
  var div_decreases = 0;
  ({ div_equal, div_increases, div_decreases } = countIncDecEq(resLst, div_equal, div_increases, div_decreases));
  // 4 year average
  const diff = 4;
  var avg4Y = calculateAvgDividends(resLst, diff);
  console.log("avg4Y="+JSON.stringify(avg4Y));
  var percentages = extractPercentages(avg4Y, diff);
  console.log("avg4Y%="+JSON.stringify(percentages));
  // 1-4y avg
  var avgDivs = [];
  for (let i = 0; i < percentages.length;i+=diff) {
    avgDivs.push( percentages[i] );
  }
  if (percentages.length % 4 == 0 && percentages.length <= 16) {
    console.log("adding one previous value (percentages.length("+percentages.length+") % 4)="+(percentages.length % 4));
    avgDivs.push( percentages[percentages.length - 1] );
  }
  var avgDiv = calculateWeightedAvg(avgDivs);
  // 4,8,12,16
  for (let i = 0; i < avgDivs.length && i < 4; i++) {
    reportEntry["div_"+(i*diff+diff)+"_avg"] = utils.roundDec10_2(avgDivs[i] * 100);
  }
  // estimated
  var estimatedDiv = calculateEstimatedDiv( rawResLst.filter(e => e.estimated), resLst);
  var estimatedDivCalculated = false;
  if ( typeof estimatedDiv != "number" ) {
    estimatedDiv = avgDiv * 0.5; // w/o estimation we use half of the historic value
    estimatedDivCalculated = true;
  }
  if (estimatedDiv < avgDiv) {
    avgDivForCalc =  (estimatedDiv * 4 + avgDiv) / 5;
  } else {
    avgDivForCalc = (avgDiv * 4 + estimatedDiv) / 5;
  }
  // 
  if (avgDivForCalc < 0) {
    avgDivForCalc = 0;
  }
  console.log("using " + avgDivForCalc + " for div calc");
  var lastPriceInEUR = lastPrice / fixer_io.getExchangeRates()[currency];
  // div in 30y (=POW(1+E2;30)*D2*B2)
  var countStocks = Math.round(10000 / lastPriceInEUR);
  console.log("countStocks for 10000EUR="+countStocks+" eur-price="+lastPriceInEUR);
  var lastdividend = 0;
  if (resLst.length > 0) {
    lastdividend = resLst[0].price;
    console.log("resLst[0].price="+resLst[0].price);
  } else {
    console.log("resLst[0].price not available. using 0.0");
  }
  var divIn30y = Math.round(Math.pow(1 + avgDivForCalc, 30) * lastdividend * countStocks);
  divIn30y = utils.roundDec10_2(divIn30y);
  // div Cum 30y cum =B2*D2*(POW(1+E2;30)-1)/(E2)
  var divCum30y = 0;
  if (avgDivForCalc > 0) {
    divCum30y = Math.round(lastdividend * countStocks * (Math.pow(1 + avgDivForCalc, 30) - 1) / avgDivForCalc);
    divCum30y = utils.roundDec10_2(divCum30y);
  }
  // insert new data
  reportEntry["divIn30y"] = divIn30y;
  reportEntry["divCum30y"] = divCum30y;
  reportEntry["div_increases"] = div_increases;
  reportEntry["div_equal"] = div_equal;
  reportEntry["div_decreases"] = div_decreases;
  reportEntry["div_avg"] = utils.roundDec10_2(avgDiv * 100);
  reportEntry["div_estimated"] = utils.roundDec10_2(estimatedDiv * 100);
  reportEntry["div_estimated_calculated"] = estimatedDivCalculated;
  reportEntry["calcbase"] = avgDivForCalc;
  console.log("created report: "+JSON.stringify(reportEntry));
  return reportEntry;
}

/**
 * First entry is higher weighted than the next one.
 * @param {*} percentageList 
 */
function calculateWeightedAvg(percentageList) {
  console.log("calculateWeightedAvg: "+JSON.stringify(percentageList));
  if (percentageList == undefined || percentageList.length == 0) {
    return 0.0;
  }
  var weightFactor = percentageList.length + 1;
  var weightedResult = 0;
  var count = 0;
  for (let i = 0; i < percentageList.length; i++) {
    weightedResult += (weightFactor * percentageList[i]);
    count += weightFactor--;
  }
  console.log("calculateWeightedAvg: "+weightedResult+" / "+count);
  return weightedResult / count;
}

function countIncDecEq(resLst, div_equal, div_increases, div_decreases) {
  for (let i = 1; i < resLst.length; i++) {
    const prevY = resLst[i];
    const thisY = resLst[i - 1];
    if (prevY.price == thisY.price) {
      div_equal++;
    }
    else if (prevY.price < thisY.price) {
      div_increases++;
    }
    else {
      div_decreases++;
    }
  }
  return { div_equal, div_increases, div_decreases };
}

function extractPercentages(resLst, diff) {
  var percentages = [];
  for (let i = 0; i < resLst.length - diff; i++) {
    const thisY = resLst[i];
    const prevY = resLst[i + diff];
    // add percentage      
    if (prevY != 0) {
      var percentage = Math.pow(thisY / prevY, 1 / diff) - 1;
      percentages.push(percentage);
    } else {
      percentages.push(0.0);
    }
  }
  return percentages;
}

function calculateEstimatedDiv(resLstEstimated, resLstDividends) {
  if (resLstEstimated == undefined || resLstEstimated.length == 0) {
    console.log("no future values available");
    return undefined;
  }
  if (resLstDividends == undefined || resLstDividends.length == 0) {
    console.log("no dividend entries found");
    return undefined;
  }
  console.log("calculateEstimatedDiv start -----------");
  var mostFutureEntry = undefined;
  resLstEstimated.forEach(e => {
    if (mostFutureEntry == undefined || e.date > mostFutureEntry.date) {
      mostFutureEntry = e;
    }
  });
  if (mostFutureEntry == undefined) {
    console.log("only outdated values available");
    return undefined;
  }
  var latestDivEntry = resLstDividends[0];
  var perc = (mostFutureEntry.price / latestDivEntry.price);
  var yearsDiff = mostFutureEntry.date - latestDivEntry.date;
  console.log("yearsDiff="+yearsDiff+" perc="+perc);
  var estimated = Math.pow( perc, 1 / yearsDiff ) - 1;
  console.log("calculateEstimatedDiv end -------------estimated="+estimated);
  return estimated;
}

function calculateAvgDividends(list, size) {
  var avgDivs = [];
  var maxI = list.length - size + 1;
  var lastTokenLength = list.length % 4;
  // last token may be avg of 1 or 2 values smaller
  var minTokenLength = size - 2;
  if (minTokenLength < 1) {
    minTokenLength = 1;
  }
  if (lastTokenLength >= minTokenLength) {
      maxI += lastTokenLength;
  }
  for (let i = 0; i < maxI; i++) {
    var val = 0;
    var count = 0;
    //console.log("calculateAvgDividends: i="+i);
    for (let j = i; j < i + size && j < list.length; j++) {
      //console.log("calculateAvgDividends: list["+j+"]="+list[j].price);
      val += list[j].price;
      count++;
    }
    avgDivs.push( val / count );
  }
  return avgDivs;
}