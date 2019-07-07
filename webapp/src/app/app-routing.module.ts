import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';
import { StockFormComponent }    from 'src/app/_form/stock-form/stock-form.component';
import { ReportComponent }       from 'src/app/_form/report/report.component';
import { PriceFormComponent }    from 'src/app/_form/price-form/price-form.component';
import { PortfolioComponent }    from 'src/app/_form/portfolio/portfolio.component';
import { TransactionsComponent } from 'src/app/_form/transactions/transactions.component';
import { ImportComponent } from './_form/import/import.component';

const routes: Routes = [
  { path: 'report', component: ReportComponent },
  { path: 'stock', component: StockFormComponent },
  { path: 'price/:isin/:name/:currency/:symbol', component: PriceFormComponent,
      data: {
        title: 'Price',
        type: 'price'
      }
  },
  { path: 'dividend/:isin/:name/:currency/:symbol', component: PriceFormComponent,
      data: {
        title: 'Dividend',
        type: 'dividend'
      } },
  { path: 'portfolio', component: PortfolioComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'import', component: ImportComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}