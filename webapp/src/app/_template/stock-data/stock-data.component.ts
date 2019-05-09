import { Component, OnInit } from '@angular/core';
import { Stock } from 'src/app/_interface/stock';
import { DataService } from 'src/app/_service/data.service';

@Component({
  selector: 'app-stock-data',
  templateUrl: './stock-data.component.html',
  styleUrls: ['./stock-data.component.sass']
})
export class StockDataComponent implements OnInit {
  public stocks: Stock[];

  constructor(public dataService: DataService) { 
    this.stocks = [];
    this.loadStockList();
  }

  ngOnInit() {
    console.log("init Stock Data component");
    
  }

  loadStockList() : void {
    console.log('loading stock list');
    this.stocks = [];//[{"isin":{"isin":"DE1111","name":"Lbl1","currency":"s"},"last10yPercentage":5.6,"last20yPercentage":3.5,"divIn30y":4000,"divCum30y":30000},{"isin":{"isin":"DE2","name":"Lbl2","currency":"s"},"last10yPercentage":5.6,"last20yPercentage":3.5,"divIn30y":4000,"divCum30y":30000}];
    this.dataService.getStockList()
      .subscribe((data: Stock[]) => {
        this.stocks = data;        
        console.log('data loaded %s', this.stocks);
      }, error => {
        console.error('%cERROR: ${error.message}', 'color:red');
      }
      );
  }

  
}
