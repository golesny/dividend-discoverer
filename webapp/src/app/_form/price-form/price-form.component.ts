import { Component, OnInit } from '@angular/core';
import { PriceDatePair } from 'src/app/_interface/price-date-pair';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from '../../_service/notify.service';
import { AuthComponent } from '../auth/auth-component';

@Component({
  selector: 'app-price-form',
  templateUrl: './price-form.component.html',
  styleUrls: ['./price-form.component.sass']
})
export class PriceFormComponent extends AuthComponent implements OnInit {
  prices: PriceDatePair[];
  public inArea: string;
  isin: string;
  name: string;
  currency: string;
  title: string;
  type: string;
  singleYear: number;
  singleDat: Date;
  price: number;
  estimated: string;
  symbol: string;
  symbolproposals: Map<string, string>;
  symbolselection: string;

  constructor(private route:  ActivatedRoute,
              protected dataService: DataService,
              private notifyService: NotifyService) {
    super(dataService);
    this.prices = [];
    this.symbolproposals = new Map<string, string>();
  }

  transferData() {
    switch (this.type) {
      case "price":
          this.transferPricesFromFinanzenDotNet();
        break;
      case "dividend":
        this.transferDividendsFromFinanzenDotNet();
        break;
        default:
            this.notifyService.showError("Unsupported type ", this.type);
    }
  }
  transferDividendsFromFinanzenDotNet() {
    console.log("start analysis of prices with format from finanzen.net");
    var ignoreCount = 0;
    var successCount = 0;
    this.inArea.split('\n').forEach(line => {
      if (line != null && line.length > 10) {
        var lineTok = line.split('\t');
        var p:number = Number.parseFloat(lineTok[2].replace(",",".").replace("** ", ""));
        var estimated = lineTok[2].startsWith("**");
        console.log("estimated="+estimated+" div="+p+ " tok="+lineTok[2]);
        // new Date(Date.UTC(myDate.getFullYear(),myDate.getMonth(), myDate.getDate()));
        // var midnightUTCDate = new Date( dateString + 'T00:00:00Z');
        var d = lineTok[4];
        var pd = new PriceDatePair(this.isin, d,  p, estimated);
        // search for entry
        var sameDateEntries: PriceDatePair[] = this.prices.filter(e => e.date == pd.date && e.estimated == pd.estimated);
        if (sameDateEntries.length == 0) {
          this.prices.unshift(pd);
          successCount++;
        } else {
          // update entries? not yet implemented
          ignoreCount++;
        }
      }
    });
    this.notifyService.showSuccess("Add "+successCount+" | Ignored "+ignoreCount);
    this.sortPrices();
  }

  transferPricesFromFinanzenDotNet() {
    console.log("start analysis of prices with format from finanzen.net");
    this.inArea.split('\n').forEach(line => {
      if (line != null && line.length > 10) {
        var lineTok = line.split('\t');
        var p:number = Number.parseFloat(lineTok[2].replace(".","").replace(",","."));
        var pd = new PriceDatePair(this.isin, this.dateString2Date(lineTok[0]),  p, false);
        // search for entry
        var sameDateEntries: PriceDatePair[] = this.prices.filter(e => e.date == pd.date);
        if (sameDateEntries.length == 0) {
          this.prices.unshift(pd);
        } else {
          // update entries? not yet implemented
        }
      }
    });
    this.sortPrices();
  }

  // convert german format 30.05.16 --> iso 2016-05-30
  dateString2Date(dateString:string):string {
    var dt  = dateString.split(/\.|\s/);
    var y:number = Number.parseInt(dt[2]);
    var nowY:number = Math.floor(new Date().getFullYear()/100);
    if (y < nowY) {
      y += 2000;
    } else {
      y += 1900;
    }
    return y+"-"+dt[1]+"-"+dt[0];
  }

  ngOnInit() {
    this.singleDat = new Date();
    this.singleYear = new Date().getFullYear();

    this.route.params.subscribe(p => {
      this.isin = p['isin'];
      this.name = p['name'];
      this.currency = p['currency'];      
      this.symbol = p['symbol'] == undefined ? "" : p['symbol'];
    });
    this.route.data.subscribe(d => {
      this.title = d['title'];
      this.type = d['type'];
    });
    this.dataService.getPricePairList(this.type, this.isin).subscribe(data =>{      
      this.prices = data;
    },
    err => {
      this.notifyService.showError("Could not load "+this.type, err);
    }
    );
  }

  saveData(currency: string) {
    var pricesToStore = this.prices.filter(p => !p.inDB );
    this.dataService.post(pricesToStore, this.type, currency, "new").subscribe(
      res => {
        res["pricepairs"].forEach(r => {
          console.log("searching for " + r.isin + " " + r.date);
          this.prices.forEach((pr) => {
            if (pr.date == r.date) {
              console.log("updating: "+pr.isin);
               pr.inDB = true;
            }
          });
        }        
        );
        this.sortPrices();
        this.notifyService.showSuccess(res["msg"]);
      },
      err => {
          this.notifyService.showError("error on saving "+this.type, err);
      }
    )
  }

  transferSinglePrice() {
    var d;
    if (this.type == "price") {
      d = this.singleDat.toISOString().substr(0, 10)
    } else if (this.type == "dividend") {
      d = "" + this.singleYear;
    }
    var p:number = Number.parseFloat(this.price.toString().replace(",","."));
    var priceToSave = new PriceDatePair(this.isin, d, p, "estimated" === this.estimated);
    var sameDateEntries: PriceDatePair[] = this.prices.filter(e => e.date == priceToSave.date);
    if (sameDateEntries.length == 0) {
      this.prices.unshift(priceToSave);
    } else {
      // update entries? not yet implemented
    }
  }

  getAlphaVantage() {
    this.dataService.getAlphaVantage(this.symbol).subscribe(
      data => {
        var ignoreCurrentYear = ""+new Date().getUTCFullYear();
        var divMap = new Map<string, number>();
        const timeseries = data["Monthly Adjusted Time Series"];
        if (this.type == "dividend") {
          for (let mm in timeseries) {
            var year = mm.substr(0,4);
            if (year != ignoreCurrentYear) {
              if (!divMap.has(year)) {
                divMap.set(year, 0);
              }
              var price = Number.parseFloat(timeseries[mm]["7. dividend amount"]);
              divMap.set(year, divMap.get(year) + price);
            }
          }
          divMap.forEach((price, year) => {
            var d = year + "-01-01";
            var priceToSave = new PriceDatePair(this.isin, d, price, false);
            this.addPrice(priceToSave);
          });
        } else if (this.type == "price") {
          var count = 0;
          var ignored = 0;
          for(let mm in timeseries) {
            var price = Number.parseFloat(timeseries[mm]["4. close"]);
            var priceToSave = new PriceDatePair(this.isin, mm, price, false);
            if (this.addPrice(priceToSave)) {
              count++;
            } else {
              ignored++;
            }
          }
          this.notifyService.showSuccess("Add "+count+" ignored "+ignored);
        }
      },
      err =>{
        this.notifyService.showError("error on loading from alpha vantage", err);
      }
    );
  }

  getAlphaVantageSymbol() {
    this.dataService.getAlphaVantageProposals(this.symbol).subscribe(
      data => {
        data["bestMatches"].forEach(proposal => {
          this.symbolproposals.set(proposal["1. symbol"], proposal["1. symbol"] + " | " + proposal["2. name"] + " (" + proposal["3. type"] + "/" + proposal["8. currency"]+")");
        });
      },
      err => {
        this.notifyService.showError("error on loading alpha vantage proposals", err);
      }
    );
  }

  addPrice(priceToSave: PriceDatePair): boolean {
    var sameDateEntries: PriceDatePair[] = this.prices.filter(e => e.date == priceToSave.date);
    if (sameDateEntries.length == 0) {
      this.prices.unshift(priceToSave);
      return true;
    }
    else {
      // update entries? not yet implemented
    }
    return false;
  }

  sortPrices(): void {
    this.prices.sort((a: PriceDatePair, b: PriceDatePair) => {
      if (a.date > b.date) {
        return -1;
    }

    if (a.date < b.date) {
        return 1;
    }

    return 0;
    });
  }
}