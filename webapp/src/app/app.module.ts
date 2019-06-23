import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule,  HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { SocialLoginModule, AuthServiceConfig } from "angularx-social-login";
import { GoogleLoginProvider} from "angularx-social-login";

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';  
import { ToastrModule } from 'ngx-toastr';

import { NgbModule, NgbDateAdapter, NgbDateNativeAdapter } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { StockFormComponent } from './_form/stock-form/stock-form.component';
import { PriceFormComponent } from './_form/price-form/price-form.component';
import { ReportComponent } from './_form/report/report.component';
import { DataService } from './_service/data.service';
import { AppRoutingModule } from './app-routing.module';
import { environment } from 'src/environments/environment';
import { PortfolioComponent } from './_form/portfolio/portfolio.component';
import { TransactionsComponent } from './_form/transactions/transactions.component';
import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import localeDEExtra from '@angular/common/locales/extra/de';

// the second parameter 'fr' is optional
registerLocaleData(localeDE, 'de', localeDEExtra);
 
let config = new AuthServiceConfig([
  {
    id: GoogleLoginProvider.PROVIDER_ID,
    provider: new GoogleLoginProvider(environment.googleOAuthId)
  }
]);
 
export function provideConfig() {
  return config;
}

@NgModule({
  declarations: [
    AppComponent,
    StockFormComponent,
    PriceFormComponent,
    ReportComponent,
    PortfolioComponent,
    TransactionsComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    SocialLoginModule,
    FormsModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    NgbModule
  ],
  providers: [
    DataService,
    { provide: AuthServiceConfig, useFactory: provideConfig },
    { provide: NgbDateAdapter, useClass: NgbDateNativeAdapter }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
