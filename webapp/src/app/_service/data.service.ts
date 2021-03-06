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
import { Transaction } from '../_interface/transaction';
import { PortfolioContainer } from '../_interface/portfolio-container';
import { UserInfo } from '../_interface/user-info';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class DataService {
  public user: SocialUser;
  public userInfo: UserInfo;
  public filterISIN: string;

  constructor(private http: HttpClient,
              private authService: AuthService,
              private toastr: ToastrService,
              private router: Router) {
    this.init();
  }

  // api calls

  refreshReport(isin: string, currency: string): Observable<any> {
    if (this.isUserLoggedIn()) {
      return this.http.get<any>(environment.apiUrl + "/stock/report/recreate/"+isin+"/"+currency, this.createHttpHeader());
    }
  }

  getReportList(): Observable<Report[]> {
    if (this.isUserLoggedIn()) {
      if (this.filterISIN != undefined) {
        return this.http.get<Report[]>(environment.apiUrl + "/stock/report/"+this.filterISIN, this.createHttpHeader());
      } else {
        return this.http.get<Report[]>(environment.apiUrl + "/stock/report/all", this.createHttpHeader());
      }
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

  updateAllPrices(userPrices:boolean): Observable<string> {
    if (this.isUserLoggedIn()) {
      console.log("dataservice:loading exchange rates");
      return this.http.get<string>(environment.apiUrl + "/updateallprices"+(userPrices?"":"user"), this.createHttpHeader());
    }
    return null;
  }

  getAlphaVantage(symbol:string): Observable<any> {
    if (this.isUserLoggedIn()) {
      return this.http.get<any>(environment.apiUrl + "/monthlyadjusted/"+symbol, this.createHttpHeader());
    }
    return null;
  }

  getAlphaVantageProposals(keywords:string): Observable<any> {
    if (this.isUserLoggedIn()) {
      return this.http.get<any>(environment.apiUrl + "/symbolsearch/"+keywords, this.createHttpHeader());
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
  // TODO: return value is not T
  /**
   * 
   * @param entity 
   * @param entityName 
   * @param currency 
   * @param mode create | edit
   */
  post<T>(entity: T, entityName: string, currency: string, mode: string): Observable<T> {
      if (this.isUserLoggedIn()) {
        var modeString = mode == "edit" ? "update" : "create";
        console.log("posting/"+mode, entityName, JSON.stringify(entity));
        return this.http.post<T>(environment.apiUrl + "/stock/"+entityName+"/"+modeString+"/"+currency, JSON.stringify(entity), this.createHttpHeader());
      }
  }

  // create
  postTransaction(entity:Transaction): Observable<any> {
    if (this.isUserLoggedIn()) {
      console.log("posting transaction", JSON.stringify(entity));
      return this.http.post<any>(environment.apiUrl + "/portfolio/create", JSON.stringify(entity), this.createHttpHeader());
    }
  }

  deleteTransaction(id:number): Observable<any> {
    if (this.isUserLoggedIn()) {
      console.log("deleting transaction " + id);
      return this.http.get<any>(environment.apiUrl + "/portfolio/delete/" + id, this.createHttpHeader());
    }
  }

  getTransactions(): Observable<Transaction[]> {
    if (this.isUserLoggedIn()) {
      return this.http.get<Transaction[]>(environment.apiUrl + "/portfolio/transactions", this.createHttpHeader());
    }
    return null;
  }

  getPortfolio(): Observable<PortfolioContainer> {
    if (this.isUserLoggedIn()) {
      return this.http.get<PortfolioContainer>(environment.apiUrl + "/portfolio", this.createHttpHeader());
    }
    return null;
  }

  getUserInfo(): UserInfo {
    return this.userInfo;
  }

  requestAccess(): Observable<UserInfo> {
    if (this.isUserLoggedIn()) {
      return this.http.get<UserInfo>(environment.apiUrl + "/user/requestaccess", this.createHttpHeader());
    }
    return null; 
  }

  getISINs(symbolCompanyPair: string[] ): Observable<ISIN[]> {
    if (this.isUserLoggedIn()) {
      return this.http.post<ISIN[]>(environment.apiUrl + "/import/isin", JSON.stringify(symbolCompanyPair), this.createHttpHeader());
    } else {
      this.router.navigate(['/']);
    }
    return null;
  }

  postImportDividends(entityList: PriceDatePair[]): Observable<any> {
    if (this.isUserLoggedIn()) {
      return this.http.post<any>(environment.apiUrl + "/import/divaristos", JSON.stringify(entityList), this.createHttpHeader());
    }
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
    this.userInfo = null;
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
        if (user != null) {
          this.user = user;
          console.log("login successful: token "+this.bearerToken());
          this.toastr.success("Logged in successfully");
          this.initUserInfo();
        } else {
          console.log("Could not log in user "+JSON.stringify(user));
        }
      });
    } else {
      console.info("developer auto-login");
      var devUser = new SocialUser();
      devUser.email = "d@veloper.de";
      devUser.name = "Dev Op";
      devUser.idToken = "none";
      this.user = devUser;
      this.initUserInfo();
    }
  }

  initUserInfo() {
    if (this.isUserLoggedIn()) {
      var ob = this.http.get<UserInfo>(environment.apiUrl + "/user/userinfo", this.createHttpHeader());
      ob.subscribe((userInfo) => {
        this.userInfo = userInfo;
        console.log("userinfo: "+JSON.stringify(userInfo));
      }, (err) => {
        console.log("login failed" + JSON.stringify(err));
        if (err.status == 403) {
          // no user currently created in database --> request
          this.userInfo = new UserInfo(['userNoInDB']);
        }
      });
    }
  }
}
