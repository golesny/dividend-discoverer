import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockFormComponent }      from 'src/app/_template/stock-form/stock-form.component';
import { StockDataComponent }      from 'src/app/_template/stock-data/stock-data.component';

const routes: Routes = [
  { path: 'data', component: StockDataComponent },
  { path: 'stock-form', component: StockFormComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}