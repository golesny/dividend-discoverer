import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule,  HttpClient } from '@angular/common/http';

import { SocialLoginModule, AuthServiceConfig } from "angularx-social-login";
import { GoogleLoginProvider} from "angularx-social-login";

import { AppComponent } from './app.component';
import { StockFormComponent } from './_template/stock-form/stock-form.component';
import { DividendFormComponent } from './_template/dividend-form/dividend-form.component';
import { PriceFormComponent } from './_template/price-form/price-form.component';
import { StockHeaderComponent } from './_template/stock-header/stock-header.component';
import { StockDataComponent } from './_template/stock-data/stock-data.component';
import { DataService } from './_service/data.service';
import { AppRoutingModule } from './app-routing.module';
 
let config = new AuthServiceConfig([
  {
    id: GoogleLoginProvider.PROVIDER_ID,
    provider: new GoogleLoginProvider("105887568427-v423v8eb1fc5a5d2umvvbt7irmuotus9.apps.googleusercontent.com")
  }
]);
 
export function provideConfig() {
  return config;
}

@NgModule({
  declarations: [
    AppComponent,
    StockFormComponent,
    DividendFormComponent,
    PriceFormComponent,
    StockHeaderComponent,
    StockDataComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    SocialLoginModule
  ],
  providers: [DataService,
    {
      provide: AuthServiceConfig,
      useFactory: provideConfig
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
