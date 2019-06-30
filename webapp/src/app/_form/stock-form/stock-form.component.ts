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
  public mode:string;
  symbolproposals: Map<string, string>;
  symbolproposalstatus: string;

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
    this.mode = "new";
    this.symbolproposals = new Map<string, string>();
    this.symbolproposalstatus = "oi-magnifying-glass";
  }

  editISIN(isin, $formEl) {
    this.symbolproposals = new Map<string, string>();
    this.model = JSON.parse(JSON.stringify(isin)); // use a copy
    this.mode = "edit";
    $formEl.scrollIntoView({block: "start", inline: "nearest"});
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

  getAlphaVantageSymbol() {
    var keyword = this.model.symbol;
    if (keyword.length == 0) {
      keyword = this.model.name;
    }
    this.symbolproposalstatus = "oi-cloud-download";
    this.dataService.getAlphaVantageProposals(keyword).subscribe(
      data => {
        this.symbolproposalstatus = "oi-magnifying-glass";
        data["bestMatches"].forEach(proposal => {
          this.symbolproposals.set(proposal["1. symbol"], proposal["1. symbol"] + " | " + proposal["2. name"] + " (" + proposal["3. type"] + "/" + proposal["8. currency"]+")");
        });
      },
      err => {
        this.notifyService.showError("error on loading alpha vantage proposals", err);
        this.symbolproposalstatus = "oi-warning";
      }
    );
  }

  onSubmit() {
    console.log("creating new isin");

    return this.dataService.post(this.model, "isin", this.model.currency, this.mode).subscribe(
        data => {
          this.notifyService.showSuccess("ISIN "+(this.mode == "new" ? "created" : "updated")+" " + data.isin);
          if (this.mode == "edit") {
            // delete old entry
            var idx = this.isinlist.findIndex(e => e.isin == this.model.isin);
            this.isinlist.splice( idx, 1, data);
          } else {
            this.isinlist.push(data);
            this.resetISIN();
            this.router.navigate(['/price/',data.isin, data.name, data.currency, data.symbol]);
          }
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
