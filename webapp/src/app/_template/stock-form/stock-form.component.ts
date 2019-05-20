import { Component } from '@angular/core';
import { ISIN } from 'src/app/_interface/isin';
import { DataService } from 'src/app/_service/data.service';
import { ISO8601_DATE_REGEX } from '@angular/common/src/i18n/format_date';

@Component({
  selector: 'stock-form',
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.sass']
})
export class StockFormComponent {
  public isinlist:ISIN[];
  currencies = ['EUR', 'USD', 'SKR'];
  public model = new ISIN('', '', this.currencies[0]);

  constructor(private dataService:DataService) {
    this.loadISINList();
  }

  loadISINList() : void {
    console.log('loading isin list');
    this.isinlist = [];
    this.dataService.getISINList()
      .subscribe((data: ISIN[]) => {
        this.isinlist = data;        
        console.log('isin loaded %s', this.isinlist);
      }, error => {
        console.error('%cERROR: ${error.message}', 'color:red');
      }
      );
  }

  onSubmit() {
    console.log("creating new isin");

    return this.dataService.post(this.model, "isin").subscribe(
        res => {
            // the complete list is resend
            this.isinlist = res.body;
        },
        err => {
            //TODO good error message to user
            console.log("error on creating isin:", err);
        }
    );
}
}
