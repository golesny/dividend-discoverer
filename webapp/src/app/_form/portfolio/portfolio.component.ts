import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from 'src/app/_service/notify.service';
import { PortfolioContainer } from 'src/app/_interface/portfolio-container';
import { DataserviceUi } from '../_abstract/dataservice-ui';
import { Portfolio } from 'src/app/_interface/portfolio';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.sass']
})
export class PortfolioComponent extends DataserviceUi implements OnInit {
  portfolio_overview: PortfolioContainer;
  filteredTableEntries: Portfolio[];
  constructor(private dataService:DataService,
              private notifyService: NotifyService) {
      super(dataService, notifyService);
      this.loadRates();
  }

// chart
public chartType: string = 'pie';
public chartDatasets: Array<any>;
public chartLabels: Array<any>;
public chartColors: Array<any>;
public chartOptions: any = {
  responsive: true
};

public chartDataLoaded: boolean = false;

// chart-end


  fillChartData(data: PortfolioContainer) {
    console.log("fill with new data");
    var sectorMap: Map<String, number> = new Map();

    for (let i = 0; i < data.overview.length; i++) {
      const element = data.overview[i];
      var exchRate = this.currencies[element.currency];
      var vol = Math.round(element.amount * element.lastprice / exchRate);
      if (!sectorMap.has(element.sector)) {
        sectorMap.set(element.sector, vol);
      } else {
        sectorMap.set(element.sector, vol + sectorMap.get(element.sector));
      }
      console.log(element.sector + " = "+ sectorMap.get(element.sector));
    }

    var mapSorted = new Map([...sectorMap.entries()].sort((a, b) => {
      return b[1] - a[1];
    }));
    this.chartDatasets = [
      { data: Array.from(mapSorted.values()), label: 'Sector distribution' }
    ];
    console.log("this.chartDatasets.data="+this.chartDatasets["data"]);
    this.chartLabels = Array.from( mapSorted.keys() );
    var colors:Array<string> = [];
    var colorCount: number = 3;
    for (let r=0; r<colorCount; r++) {
      for (let g=0;g<colorCount; g++) {
        for (let b=0;b<colorCount; b++) {
          var c = 'rgb('+Math.round(r*255/colorCount)+','+Math.round(g*255/colorCount)+','+Math.round(b*255/colorCount)+')';
          if (b % 3 == 0) {
            colors.push(c);
          } else {
            colors.unshift(c);
          }
        }
      }
    }
    this.chartColors = [{ backgroundColor: colors, borderWidth: 2 }];
    this.chartDataLoaded = true;
  }

  ngOnInit() {
    this.dataService.getPortfolio().subscribe(data => {      
      this.portfolio_overview = data;
      this.filteredTableEntries = data.overview;
      this.fillChartData(data);
    }, e => {
      this.notifyService.showError("Could not load portfolio. ", e);
    });
  }



  
  public chartClicked(e: any): void {
    var selectedCategory = this.chartLabels[e.active[0]._index];
    console.log("chartClicked:"+selectedCategory);
    this.filteredTableEntries = this.filterEntries(selectedCategory);
   }
  public chartHovered(e: any): void { }

  public filterEntries(cat: string): Portfolio[] {
    return this.portfolio_overview.overview.filter(e => {return e.sector == cat});
  }
  
  updateMyPortfolioPrices() {
    this.dataService.updateAllPrices(false).subscribe(
      data => {
        this.notifyService.showSuccess(data["msg"]);
      },
      err => {
        this.notifyService.showError("Could not start batch:", err);
      }
    )
  }
} 
