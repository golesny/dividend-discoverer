import { Component } from '@angular/core';
import { ISIN } from 'src/app/_interface/isin';
import { DataService } from 'src/app/_service/data.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'stock-form',
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.sass']
})
export class StockFormComponent {
  public isinlist:ISIN[];
  currencies = ['EUR', 'USD', 'SKR'];
  public model;

  constructor(private dataService:DataService,
              private toastr: ToastrService) {
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
        this.toastr.error("error "+error.message);
      }
      );
  }

  onSubmit() {
    console.log("creating new isin");

    return this.dataService.post(this.model, "isin").subscribe(
        data => {
          console.log("ISIN created", JSON.stringify(data));
          this.toastr.success("ISIN created: " + data.isin);
          // the complete list is resend
          this.isinlist.push(data);
          this.resetISIN();
        },
        err => {            
            console.log("error on creating isin:", err);
            this.toastr.error("error on creating isin: " + err);
        }
    );
}
}
