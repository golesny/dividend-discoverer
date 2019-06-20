import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Report } from '../_interface/report';
import { environment } from 'src/environments/environment';
import { AuthService } from "angularx-social-login";
import { GoogleLoginProvider } from "angularx-social-login";
import { SocialUser } from "angularx-social-login";
import { ISIN } from '../_interface/isin';
import { ToastrService } from 'ngx-toastr';
import { PriceDatePair } from '../_interface/price-date-pair';
import { Portfolio } from '../_interface/portfolio';
import { Transaction } from '../_interface/transaction';


@Injectable({
  providedIn: 'root'
})
export class DataService {
  public user: SocialUser;

  constructor(private http: HttpClient,
              private authService: AuthService,
              private toastr: ToastrService) {
    this.init();
  }

  // api calls

  refreshReport(isin: string, currency: string): Observable<any> {
    if (this.isUserLoggedIn()) {
      return this.http.post<any>(environment.apiUrl + "/stock/report/recreate/"+isin+"/"+currency, this.createHttpHeader());
    }
  }

  getReportList(): Observable<Report[]> {
    if (this.isUserLoggedIn()) {
      return this.http.get<Report[]>(environment.apiUrl + "/stock", this.createHttpHeader());
    }
    return null;
  }

  getISINList(): Observable<ISIN[]> {
    if (this.isUserLoggedIn()) {
      return this.http.get<ISIN[]>(environment.apiUrl + "/stock/isin/list", this.createHttpHeader());
    }
    return null;
  }

  getExchangeRates(): Observable<Map<string, number>> {
    if (this.isUserLoggedIn()) {
      console.log("dataservice:loading exchange rates");
      return this.http.get<Map<string, number>>(environment.apiUrl + "/rates", this.createHttpHeader());
    }
    return null;
  }

  getAlphaVantage(symbol:string): Observable<string> {
    if (this.isUserLoggedIn()) {
      return this.http.get<string>(environment.apiUrl + "/monthlyadjusted/"+symbol, this.createHttpHeader());
    }
    return null;
  }

  getPricePairList(type: string, isin: string): Observable<PriceDatePair[]> {
    if (this.isUserLoggedIn()) {
      return this.http.get<PriceDatePair[]>(environment.apiUrl + "/stock/"+type+"/list/"+isin, this.createHttpHeader());
    }
    return null;
  }

  // create
  post<T>(entity: T, entityName: string, currency: string): Observable<T> {
      if (this.isUserLoggedIn()) {
        console.log("posting", entityName, JSON.stringify(entity));
        return this.http.post<T>(environment.apiUrl + "/stock/"+entityName+"/create/"+currency, JSON.stringify(entity), this.createHttpHeader());
      }
  }

  // create
  postTransaction(entity:Transaction): Observable<Transaction> {
    if (this.isUserLoggedIn()) {
      console.log("posting transaction", JSON.stringify(entity));
      return this.http.post<Transaction>(environment.apiUrl + "/portfolio/create", JSON.stringify(entity), this.createHttpHeader());
    }
  }

  getTransactions(): Observable<Transaction[]> {
    if (this.isUserLoggedIn()) {
      return this.http.get<Transaction[]>(environment.apiUrl + "/portfolio/transactions", this.createHttpHeader());
    }
    return null;
  }

  getPortfolio(): Observable<Portfolio[]> {
    if (this.isUserLoggedIn()) {
      return this.http.get<Portfolio[]>(environment.apiUrl + "/portfolio", this.createHttpHeader());
    }
    return null;
  }

  // --------------- auth ------------------
  signInWithGoogle(): void {
    console.log("sign in with google")
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }

  signOut(): void {
    console.log("Logout user");
    this.authService.signOut().then(res => {
      console.log(res);
    });
    this.user = null;
  }

  bearerToken(): string {
    if (this.user != null) {
      return this.user.idToken;
    }
    return "none";
  }

  isUserLoggedIn(): boolean {
    if (this.user != null) {
      return true;
    } else {
      console.error("User not logged in and may not access the service");
      this.toastr.error("Please login");
      return false;
    }
  }

  createHttpHeader() {
    return  {
      headers: new HttpHeaders({'Content-Type': 'application/json',
                                'authorization': this.bearerToken()})
      };
  }

  init() {
    if (environment.loginEnabled) {
      console.log("subscribing for authState");
      this.authService.authState.subscribe((user) => {
        this.user = user;
        console.log("login successful: token "+this.bearerToken());
        this.toastr.success("Logged in successfully");
      });
    } else {
      console.info("developer auto-login");
      var devUser = new SocialUser();
      devUser.email = "d@veloper.de";
      devUser.name = "Dev Op";
      devUser.idToken = "none";
      this.user = devUser;
    }
  }
}
