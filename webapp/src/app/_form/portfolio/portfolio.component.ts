import { Component, OnInit } from '@angular/core';
import { Portfolio } from 'src/app/_interface/portfolio';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from 'src/app/_service/notify.service';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.sass']
})
export class PortfolioComponent implements OnInit {
  portfolios: Portfolio[];
  constructor(private dataService:DataService,
              private notifyService: NotifyService,) {
        this.portfolios = [];
  }

  ngOnInit() {
    this.dataService.getPortfolio().subscribe(data => {
      this.portfolios = data;
    }, e => {
      this.notifyService.showError("Could not load portfolio. ", e);
    });
  }

}
