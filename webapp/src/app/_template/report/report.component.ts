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

  constructor(private dataService: DataService,
              private notifyService: NotifyService) { 
    this.reports = [];
    this.loadStockList();
  }

  ngOnInit() {
    console.log("init Stock Data component");
    
  }

  loadStockList() : void {
    console.log('loading stock list');
    this.reports = [];
    this.dataService.getReportList()
      .subscribe((data: Report[]) => {
        this.reports = data;        
        console.log('data loaded %s', this.reports);
      }, err => {
        this.notifyService.showError("Could not load reports", err);
      }
      );
  }

  refreshReport(isin: string) {
    this.dataService.refreshReport(isin).subscribe(
      data => {
        console.log("data="+JSON.stringify(data));
        this.notifyService.showSuccess(data["msg"]);
        for (let i = 0; i < this.reports.length; i++) {
          const r = this.reports[i];
          if (r.isin == isin) {
            this.reports[i] = Object.assign(this.reports[i], data["report"]);
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
