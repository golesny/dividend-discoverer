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
  currencies = ['EUR', 'USD', 'SKR', 'CHF', 'GBP', 'CAD', 'DDK'];
  public model:ISIN;

  constructor(private dataService:DataService,
              private notifyService: NotifyService,
              private router: Router) {
    this.resetISIN();
    this.loadISINList();
  }

  resetISIN() {
    this.model = new ISIN('', '', this.currencies[0]);
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

  onSubmit() {
    console.log("creating new isin");

    return this.dataService.post(this.model, "isin").subscribe(
        data => {
          this.notifyService.showSuccess("ISIN created: " + data.isin);
          // the complete list is resend
          this.isinlist.push(data);
          this.resetISIN();
          this.router.navigate(['/price/',data.isin, data.name, data.currency]);
        },
        err => {                        
            this.notifyService.showError("error on creating isin", err);
        }
    );
  }

  refreshReport(isin: string) {
    this.dataService.refreshReport(isin).subscribe(
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
}
