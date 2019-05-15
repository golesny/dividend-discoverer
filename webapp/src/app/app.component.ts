import { Component, OnInit } from '@angular/core';

import { AuthService } from "angularx-social-login";
import { GoogleLoginProvider } from "angularx-social-login";
import { SocialUser } from "angularx-social-login";
import { environment } from '../environments/environment';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  title = 'Dividend Discoverer';
  public user: SocialUser;
  public loggedIn: boolean;

  constructor(private authService: AuthService) { }

  signInWithGoogle(): void {
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }

  signOut(): void {
    this.authService.signOut();
  }

  ngOnInit() {
    if (environment.loginEnabled) {
      this.authService.authState.subscribe((user) => {
        this.user = user;
        this.loggedIn = (user != null);
      });
    } else {
      console.info("developer auto-login");
      this.user = new SocialUser();
      this.user.email = "d@veloper.de"
      this.loggedIn = true;
    }
  }
}
