import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stock } from '../_interface/stock';
import { environment } from 'src/environments/environment';
import { AuthService } from "angularx-social-login";
import { GoogleLoginProvider } from "angularx-social-login";
import { SocialUser } from "angularx-social-login";
import { ISIN } from '../_interface/isin';


@Injectable({
  providedIn: 'root'
})
export class DataService {
  public user: SocialUser;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.init();
  }

  // api calls
  getStockList(): Observable<Stock[]> {
    if (this.isUserLoggedIn()) {
      return this.http.get<Stock[]>(environment.apiUrl + "/stock", this.createHttpHeader());
    }
    return null;
  }

  getISINList(): Observable<ISIN[]> {
    if (this.isUserLoggedIn()) {
      return this.http.get<ISIN[]>(environment.apiUrl + "/stock/isin/list", this.createHttpHeader());
    }
    return null;
  }

  // create
  post(entity: any, entityName: string): Observable<any> {
      if (this.isUserLoggedIn()) {
        console.log("posting", entityName, JSON.stringify(entity));
        return this.http.post(environment.apiUrl + "/stock/"+entityName+"/create", JSON.stringify(entity), this.createHttpHeader());
      }
  }

  // auth
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
      });
    } else {
      console.info("developer auto-login");
      var devUser = new SocialUser();
      devUser.email = "d@veloper.de";
      devUser.name = "Dev";
      devUser.idToken = "none";
      this.user = devUser;
    }
  }
}
