import { Component } from '@angular/core';
import { ISIN } from 'src/app/_interface/isin';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from 'src/app/_service/notify.service';
import { Router } from '@angular/router';

@Component({
  selector: 'stock-form',
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.sass']
})
export class StockFormComponent {
  public isinlist:ISIN[];
  currencies:Map<string, number>;
  public model:ISIN;

  constructor(private dataService:DataService,
              private notifyService: NotifyService,
              private router: Router) {
    this.currencies = new Map();
    this.currencies.set("EUR", 1);
    this.resetISIN();
    this.loadISINList();
    this.loadRates();
  }

  resetISIN() {
    this.model = new ISIN('', '', "EUR", "", "");
  }

  loadISINList() : void {
    console.log('loading isin list');
    this.isinlist = [];
    this.dataService.getISINList()
      .subscribe((data: ISIN[]) => {
        this.isinlist = data;        
        console.log('isin loaded %s', this.isinlist);
      }, error => {
        console.error('ERROR: ${error.message}');
        this.notifyService.showError("error ", error.message);
      }
      );
  }

  loadRates(): void {
    this.dataService.getExchangeRates()
    .subscribe((data: Map<string, number>) => {
      this.currencies = data;        
      console.log('currencies loaded %s', this.currencies);
    }, error => {
      console.error('ERROR: ${error.message}');
      this.notifyService.showError("error ", error.message);
    }
    );
  }

  onSubmit() {
    console.log("creating new isin");

    return this.dataService.post(this.model, "isin", this.model.currency).subscribe(
        data => {
          this.notifyService.showSuccess("ISIN created: " + data.isin);
          // the complete list is resend
          this.isinlist.push(data);
          this.resetISIN();
          this.router.navigate(['/price/',data.isin, data.name, data.currency, data.symbol]);
        },
        err => {                        
            this.notifyService.showError("error on creating isin", err);
        }
    );
  }

  refreshReport(isin: string, currency: string) {
    this.dataService.refreshReport(isin, currency).subscribe(
      data => {
        console.log("data="+JSON.stringify(data));
        this.notifyService.showSuccess(data["msg"]);
        this.isinlist.filter((f) => (f.isin == isin)).forEach((e) => e.report_count = 1);
      },
      err => {
        console.log("err="+err);
        this.notifyService.showError("Could not recreate the report:", err);}
    ); 
  }

  updateAllPrices() {
    this.dataService.updateAllPrices().subscribe(
      data => {
        this.notifyService.showSuccess(data["msg"]);
      },
      err => {
        this.notifyService.showError("Could not start batch:", err);
      }
    )
  }
}
