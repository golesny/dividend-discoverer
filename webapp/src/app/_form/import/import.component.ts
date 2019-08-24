import { Component, OnInit } from '@angular/core';
import { PriceDatePair } from 'src/app/_interface/price-date-pair';
import { NotifyService } from 'src/app/_service/notify.service';
import { DataService } from 'src/app/_service/data.service';
import { stringify } from '@angular/core/src/util';
import { ISIN } from 'src/app/_interface/isin';
import { ExpectedConditions } from 'protractor';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.sass']
})
export class ImportComponent implements OnInit {
  isValid: boolean;
  prices: PriceDatePair[];
  mode: string;
  title: string;
  constructor(private dataService: DataService,
              private notifyService: NotifyService) {
    this.prices = [];
    this.isValid = false;
    this.title = "?";
    this.mode = "";
  }

  ngOnInit() {
  }

  onFileChange(event) {
    this.prices = [];
    let reader = new FileReader();
    if(event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];
      reader.readAsText(file);
      reader.onload = () => {
        console.log("import: Start processing");
        this.prices = [];
        this.mode = event.target.id;
        if ("csvfileActiveTrader" == event.target.id) {
          this.title = "Price";
          this.importActiveTrader(reader.result.toString());
        } else if ("csvfileAristo" == event.target.id) {
          this.title = "Dividend";
          this.importAristocratsDiv(reader.result.toString());
        }
        console.log("import: Stop processing");
      };
    }
  }

  private importAristocratsDiv(content: string){
    var lines = content.split('\n');
    // read header line Name;Symbol;Y0;Y-1;...
    const headerTok = lines[0].split(";");
    var years = [0,0,0];
    for (let i = 3; i < headerTok.length; i++) {
      years.push(Number.parseInt(headerTok[i]));
    }
    console.log("import: years "+years[3]+" - "+years[years.length - 1 ]);
    //
    var symbols = [];
    for (let i = 1; i < lines.length; i++) { // ignore first header line
      if (lines[i].length > 3) {
        try {
          const tok = lines[i].split(";");
          var companyName = tok[0].trim();
          var symbol = tok[1].trim();
          var currency = tok[2].trim();
          for (let j=3; j < tok.length; j++) {
            var div = Number.parseFloat(tok[j].replace(",", "."));
            var datStr = ""+ years[j];
            
            var pdp = new PriceDatePair("", datStr, div, false, false, 0, currency);
            pdp["name"] = companyName;
            pdp["symbol"] = symbol;
            this.prices.push(pdp);
            if ( symbols.filter(s => s == symbol).length ==  0) {
              symbols.push(symbol);
            }            
          }
        }
        catch (err) {
          this.notifyService.showError("Error in line " + (i + 1), err.message);
        }
      }
    }
    // get ISIN from server
    this.dataService.getISINs(symbols).subscribe(data => {
      data.forEach(isin => {
        this.prices.filter(p => p["symbol"] == isin.symbol).forEach(pr => pr.isin = isin.isin);
      });
      this.updateValidity();
    }, err => {
      this.notifyService.showError("Could not load isins. ", err);
    });
  }

  insertISIN(price: PriceDatePair){
    var isin = prompt("Please enter the ISIN of "+price["name"], "");
    if (isin != undefined) {
      isin = isin.trim();
      var entity = new ISIN(isin, price["name"], price.currency, "", price["symbol"]);

      return this.dataService.post(entity, "isin", price.currency, this.mode).subscribe(
        data => {
          this.notifyService.showSuccess("ISIN created: " + data.isin);
          this.prices.filter(p => p["symbol"] == price["symbol"]).forEach(pr => pr.isin = isin);
          this.updateValidity();
        }, err => {
          this.notifyService.showError("error on creating isin", err);
        });
    }
  }

  private importActiveTrader(content: string) {
    var lines = content.split('\n');
    for (let i = 1; i < lines.length; i++) { // ignore first header line
      if (lines[i].length > 10) {
        try {
          const tok = lines[i].split(";");
          var datStr = tok[10].substr(6, 4) + "-" + tok[10].substr(3, 2) + "-" + tok[10].substr(0, 2); // dd.mm.yyyy
          var price = Number.parseFloat(tok[8].replace(",", "."));
          var pdp = new PriceDatePair(tok[6], datStr, price, false, false, 0, tok[9]);
          pdp["name"] = tok[7];
          this.prices.push(pdp);
        }
        catch (err) {
          this.notifyService.showError("Error in line " + (i + 1), err.message);
        }
      }
      this.updateValidity();
    }
  }

  saveData() {
    if (this.prices.length > 0 && this.isPriceListValid()) {
      if (this.mode == "csvfileActiveTrader"){
        this.prices.forEach((pricesToStore) => {
          this.dataService.post([pricesToStore], "price", pricesToStore.currency, "new").subscribe(
            res => {
              pricesToStore = Object.assign(pricesToStore, res["pricepairs"][0]);
              pricesToStore.inDB = true;
            },
            err => {
                this.notifyService.showError("error on saving price for isin "+pricesToStore.isin, err);
            }
          )
        });
      } else if (this.mode == "csvfileAristo") {
        // send isin by isin to reduce the big amount of data
        // prepare packages
        var packs = new Map<string, PriceDatePair[]>();
        var isins:string[] = [];
        this.prices.forEach(element => {
          if (isins.indexOf(element.isin) == -1) {
            // new isin
            packs.set(element.isin, []);
            isins.push(element.isin);
          }
          packs.get(element.isin).push(element);
        });
        // send isin packs
        this.sendIsinPackage(packs, isins);
      }
    }
  }


  private sendIsinPackage(packs: Map<string, PriceDatePair[]>, isins: string[]) {
    var isin = isins.splice(0, 1)[0];
    this.dataService.postImportDividends(packs.get(isin)).subscribe(res => {
      if (res["errCode"] == 0) {
        console.log("import: isin " + isin + " successfully imported");
        packs.get(isin).forEach(p => p.inDB = true);
        // call next package
        if (isins.length > 0) {
          this.sendIsinPackage(packs, isins);
        }
      }
    }, err => {
      this.notifyService.showError("error on saving dividends", err);
    });
  }

  updateValidity() {
    this.isValid = this.isPriceListValid();
  }
  
  isPriceListValid(): boolean {
    return this.prices.filter(p => p.isin == "").length == 0
  }

}
