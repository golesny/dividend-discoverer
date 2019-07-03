import { Component, OnInit } from '@angular/core';
import { Report } from 'src/app/_interface/report';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from 'src/app/_service/notify.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.sass']
})
export class ReportComponent implements OnInit {
  public reports: Report[];
  public allreports: Report[];
  page:number;
  pageSize:number;
  filter_name:string;

  constructor(private dataService: DataService,
              private notifyService: NotifyService) { 
    this.reports = [];
    this.allreports = [];
    this.filter_name = "";
    this.pageSize = 30;
    this.page = 1;
    this.loadStockList();
  }

  ngOnInit() {
    console.log("init Stock Data component");
  }

  filterList() {
    if (this.filter_name.length > 0) {
      this.reports = this.allreports.filter(r => { return r.name.toLowerCase().indexOf(this.filter_name.toLowerCase()) != -1;});
    } else {
      this.reports = this.allreports;
    }
  }

  loadStockList() : void {
    console.log('loading stock list');
    this.reports = [];
    this.allreports = [];
    this.dataService.getReportList()
      .subscribe((data: Report[]) => {
        this.allreports = data; // deep copy
        this.filterList();
        console.log('data loaded %s', this.allreports);
      }, err => {
        this.notifyService.showError("Could not load reports", err);
      }
      );
  }

  refreshReport(isin: string, currency: string) {
    this.dataService.refreshReport(isin, currency).subscribe(
      data => {
        console.log("data="+JSON.stringify(data));
        this.notifyService.showSuccess(data["msg"]);
        for (let i = 0; i < this.allreports.length; i++) {
          const r = this.allreports[i];
          if (r.isin == isin) {
            this.allreports[i] = Object.assign(this.allreports[i], data["report"]);
            continue;
          }
        }
      },
      err => {
        console.log("err="+err);
        this.notifyService.showError("Could not recreate the report:", err);}
    ); 
  }
  
}
