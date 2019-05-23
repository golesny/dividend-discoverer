import { Component, OnInit } from '@angular/core';
import { PriceDatePair } from 'src/app/_interface/price-date-pair';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from '../../_service/notify.service';

@Component({
  selector: 'app-price-form',
  templateUrl: './price-form.component.html',
  styleUrls: ['./price-form.component.sass']
})
export class PriceFormComponent implements OnInit {
  prices: PriceDatePair[];
  public inArea: string;
  isin: string;
  title: string;
  type: string;

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
    this.inArea.split('\n').forEach(line => {
      if (line != null && line.length > 10 && line.indexOf("**") == -1) {
        var lineTok = line.split('\t');
        var p:number = Number.parseFloat(lineTok[2].replace(",","."));
        var d:Date = new Date(Number.parseInt(lineTok[4]), 0);
        var pd = new PriceDatePair(this.isin, d,  p);
        this.prices.push(pd);
      }
    });
  }

  transferPricesFromFinanzenDotNet() {
    console.log("start analysis of prices with format from finanzen.net");
    this.inArea.split('\n').forEach(line => {
      if (line != null && line.length > 10) {
        var lineTok = line.split('\t');
        var p:number = Number.parseFloat(lineTok[2].replace(".","").replace(",","."));
        var pd = new PriceDatePair(this.isin, this.dateString2Date(lineTok[0]),  p);
        this.prices.push(pd);
      }
    });
  }

  // convert german format 30.05.16 --> iso 2016-05-30
  dateString2Date(dateString:string):Date {
    var dt  = dateString.split(/\.|\s/);
    var y:number = Number.parseInt(dt[2]);
    var nowY:number = Math.floor(new Date().getFullYear()/100);
    if (y < nowY) {
      y += 2000;
    } else {
      y += 1900;
    }
    return new Date(y+"-"+dt[1]+"-"+dt[0]);
  }

  ngOnInit() {
    this.route.params.subscribe(p => this.isin = p['isin']);
    this.route.data.subscribe(d => {
      this.title = d['title'];
      this.type = d['type'];
    });
  }

  saveData() {
    var pricesToStore = this.prices.filter(p => !p.inDB );
    this.dataService.post(pricesToStore, this.type).subscribe(
      res => {
        res.forEach(r => {
          console.log("searching for " + r.isin + " " + r.date);
          this.prices.forEach((pr) => {
            if (this.compareDate(pr.date,r.date)) {
              console.log("updating: "+pr.isin);
               pr.inDB = true;
            }
          });
        }
        );
      },
      err => {
          this.notifyService.showError("error on saaving "+this.type, err);
      }
  )
  }

  compareDate(d1:Date, d2:Date):boolean {
    if (d1.getFullYear() != d2.getFullYear()) {
      return false;
    }
    if (d1.getMonth() != d2.getMonth()) {
      return false;
    }
    if (d1.getDay() != d2.getDay()) {
      return false;
    }
    return true;
  }
}