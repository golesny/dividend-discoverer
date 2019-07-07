import { Component, OnInit } from '@angular/core';
import { PriceDatePair } from 'src/app/_interface/price-date-pair';
import { NotifyService } from 'src/app/_service/notify.service';
import { DataService } from 'src/app/_service/data.service';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.sass']
})
export class ImportComponent implements OnInit {
  prices: PriceDatePair[];
  constructor(private dataService: DataService,
              private notifyService: NotifyService) {
    this.prices = [];
  }

  ngOnInit() {
  }

  onFileChange(event) {
    let reader = new FileReader();
    if(event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];
      reader.readAsText(file);
      reader.onload = () => {
        var lines = reader.result.toString().split('\n');
        for (let i = 1; i < lines.length; i++) {// ignore first header line
         if (lines[i].length > 10) {
            try {
              const tok = lines[i].split(";");
              var datStr = tok[10].substr(6,4) + "-" + tok[10].substr(3,2) + "-" + tok[10].substr(0,2); // dd.mm.yyyy
              var price = Number.parseFloat(tok[8].replace(",","."));
              var pdp = new PriceDatePair(tok[6], datStr, price, false, false, 0, tok[8]);
              pdp["name"] = tok[7];
              this.prices.push(pdp);
            } catch (err) {
              this.notifyService.showError("Error in line "+(i+1), err.message);
            }
          }
        }
      };
    }
  }

  saveData() {
    if (this.prices.length > 0) {
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
    }
  }
}
