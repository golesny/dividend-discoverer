import { Component, OnInit } from '@angular/core';
import { Report } from 'src/app/_interface/report';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from 'src/app/_service/notify.service';

@Component({
  selector: 'app-stock-data',
  templateUrl: './stock-data.component.html',
  styleUrls: ['./stock-data.component.sass']
})
export class StockDataComponent implements OnInit {
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

  
}
