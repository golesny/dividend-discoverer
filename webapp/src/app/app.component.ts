import { Component } from '@angular/core';
import { DataService } from './_service/data.service';
import { AuthComponent } from './_form/auth/auth-component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent extends AuthComponent {  
  title = 'Dividend Discoverer';

  constructor(protected dataService:DataService) {
    super(dataService);
  }

  signInWithGoogle(): void {
    this.dataService.signInWithGoogle();
  }

  signOut(): void {
    this.dataService.signOut();
  }

  requestAccess(): void {
    console.log("requestAccess");
    this.dataService.requestAccess().subscribe((userinfo) => {
      console.log("user created");
      this.dataService.userInfo = userinfo;
    }, (err) => {console.log(err.message)});
  }

  get user() {
    return this.dataService.user;
  }
}
