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

  get user() {
    return this.dataService.user;
  }
}
