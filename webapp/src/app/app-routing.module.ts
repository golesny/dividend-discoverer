import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockFormComponent }      from 'src/app/_template/stock-form/stock-form.component';
import { ReportComponent }      from 'src/app/_template/report/report.component';
import { PriceFormComponent } from './_template/price-form/price-form.component';

const routes: Routes = [
  { path: 'report', component: ReportComponent },
  { path: 'stock-form', component: StockFormComponent },
  { path: 'price/:isin/:name/:currency', component: PriceFormComponent,
      data: {
        title: 'Price',
        type: 'price'
      }
  },
  { path: 'dividend/:isin/:name/:currency', component: PriceFormComponent,
      data: {
        title: 'Dividend',
        type: 'dividend'
      } }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}