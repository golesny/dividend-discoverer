import { Component } from '@angular/core';
import { ISIN } from 'src/app/_interface/isin';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from 'src/app/_service/notify.service';
import { Router } from '@angular/router';
import { DataserviceUi } from '../_abstract/dataservice-ui';

@Component({
  selector: 'stock-form',
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.sass']
})
export class StockFormComponent extends DataserviceUi {
  public isinlist:ISIN[];
  public allisinlist:ISIN[];
  public model:ISIN;
  public mode:string;
  symbolselection: string;
  symbolproposals: Map<string, string>;
  symbolproposalstatus: string;
  page:number;
  pageSize:number;
  filter_name:string;

  constructor(private dataService:DataService,
              private notifyService: NotifyService,
              private router: Router) {
    super(dataService, notifyService);
    this.pageSize = 30;
    this.page = 1;
    this.filter_name = "";
    this.resetISIN();
    this.loadISINList();
    this.loadRates();
  }

  filterList() {
    if (this.filter_name.length > 0) {
      this.isinlist = this.allisinlist.filter(r => {  return r.name.toLowerCase().indexOf(this.filter_name.toLowerCase()) != -1; });
    } else {
      this.isinlist = this.allisinlist;
    }
  }

  resetISIN() {
    this.model = new ISIN('', '', "EUR", "", "");
    this.mode = "new";
    this.symbolproposals = new Map<any, string>();
    this.symbolproposalstatus = "oi-magnifying-glass";
  }

  editISIN(isin, $formEl) {
    this.symbolproposals = new Map<any, string>();
    this.model = JSON.parse(JSON.stringify(isin)); // use a copy
    this.mode = "edit";
    $formEl.scrollIntoView({block: "start", inline: "nearest"});
  }

  loadISINList() : void {
    console.log('loading isin list');
    this.isinlist = [];
    this.allisinlist = [];
    this.dataService.getISINList()
      .subscribe((data: ISIN[]) => {
        this.allisinlist = data;
        console.log('isin loaded %s', this.allisinlist);
        this.filterList();
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
          this.symbolproposals.set(proposal["1. symbol"] + "/" +proposal["8. currency"], proposal["1. symbol"] + " | " + proposal["2. name"] + " (" + proposal["3. type"] + "/" + proposal["8. currency"]+")");
        });
      },
      err => {
        this.notifyService.showError("error on loading alpha vantage proposals", err);
        this.symbolproposalstatus = "oi-warning";
      }
    );
  }

  onSymbolSelection() {
    console.log("symbol selection changed: "+this.symbolselection);
    var tok = this.symbolselection.split("/");
    this.model.symbol = tok[0];
    this.model.symbolcurrency = tok[1];
  }

  onSubmit() {
    console.log("creating new isin");

    return this.dataService.post(this.model, "isin", this.model.currency, this.mode).subscribe(
        data => {
          this.notifyService.showSuccess("ISIN "+(this.mode == "new" ? "created" : "updated")+" " + data.isin);
          if (this.mode == "edit") {
            // delete old entry
            var idx = this.allisinlist.findIndex(e => e.isin == this.model.isin);
            this.allisinlist.splice( idx, 1, data);
          } else {
            this.allisinlist.push(data);
            this.resetISIN();
            this.router.navigate(['/price/',data.isin, data.name, data.currency, data.symbol]);
          }
          this.filterList();
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
        this.allisinlist.filter((f) => (f.isin == isin)).forEach((e) => e.report_count = 1);
      },
      err => {
        console.log("err="+err);
        this.notifyService.showError("Could not recreate the report:", err);}
    ); 
  }

  updateAllPrices() {
    this.dataService.updateAllPrices(true).subscribe(
      data => {
        this.notifyService.showSuccess(data["msg"]);
      },
      err => {
        this.notifyService.showError("Could not start batch:", err);
      }
    )
  }
}
