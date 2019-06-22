import { Component, OnInit } from '@angular/core';
import { Portfolio } from 'src/app/_interface/portfolio';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from 'src/app/_service/notify.service';
import { PortfolioContainer } from 'src/app/_interface/portfolio-container';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.sass']
})
export class PortfolioComponent implements OnInit {
  portfolio_overview: PortfolioContainer;
  constructor(private dataService:DataService,
              private notifyService: NotifyService,) {
  }

  ngOnInit() {
    this.dataService.getPortfolio().subscribe(data => {      
      this.portfolio_overview = data;
    }, e => {
      this.notifyService.showError("Could not load portfolio. ", e);
    });
  }

}
