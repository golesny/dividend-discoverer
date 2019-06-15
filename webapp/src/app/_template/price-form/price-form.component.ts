import { Component, OnInit } from '@angular/core';
import { PriceDatePair } from 'src/app/_interface/price-date-pair';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from '../../_service/notify.service';
import { NgbDateStruct, NgbDate, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-price-form',
  templateUrl: './price-form.component.html',
  styleUrls: ['./price-form.component.sass']
})
export class PriceFormComponent implements OnInit {
  prices: PriceDatePair[];
  public inArea: string;
  isin: string;
  name: string;
  currency: string;
  title: string;
  type: string;
  singleDat: Date;
  price: number;
  estimated: string;

  constructor(private route:  ActivatedRoute,
              private dataService: DataService,
              private notifyService: NotifyService) {
    this.prices = [];
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
        var d = lineTok[4]+"-01-01";
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

    this.route.params.subscribe(p => {
      this.isin = p['isin'];
      this.name = p['name'];
      this.currency = p['currency'];
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
    this.dataService.post(pricesToStore, this.type, currency).subscribe(
      res => {
        res["pricepairs"].forEach(r => {
          console.log("searching for " + r.isin + " " + r.date);
          this.prices.forEach((pr) => {
            if (pr.date == r.date) {
              console.log("updating: "+pr.isin);
               pr.inDB = true;
            }
          });
          this.sortPrices();
        }
        );
      },
      err => {
          this.notifyService.showError("error on saving "+this.type, err);
      }
    )
  }

  transferSinglePrice() {
    var d = this.singleDat.toISOString().substr(0, 10);
    var p:number = Number.parseFloat(this.price.toString().replace(",","."));
    var priceToSave = new PriceDatePair(this.isin, d, p, "estimated" === this.estimated);
    var sameDateEntries: PriceDatePair[] = this.prices.filter(e => e.date == priceToSave.date);
    if (sameDateEntries.length == 0) {
      this.prices.unshift(priceToSave);
    } else {
      // update entries? not yet implemented
    }
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

  convertDateToUTC(d:Date): Date {
        var hoursDiff = d.getHours() - d.getTimezoneOffset() / 60;
        var minutesDiff = (d.getHours() - d.getTimezoneOffset()) % 60;
        d.setHours(hoursDiff);
        d.setMinutes(minutesDiff);
        return d;
  }
}