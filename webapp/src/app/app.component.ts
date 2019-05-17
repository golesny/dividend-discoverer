import { Component } from '@angular/core';
import { DataService } from './_service/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {  
  title = 'Dividend Discoverer';
  

  constructor(private dataService:DataService) { }

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
