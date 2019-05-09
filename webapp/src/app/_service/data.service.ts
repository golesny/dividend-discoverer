import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stock } from '../_interface/stock';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private stocksUrl : string = "http://www.nettesheim.name/dividend-discoverer/data.php";

  constructor(private http: HttpClient) { }

  getStockList(): Observable<Stock[]> {
    // https://www.youtube.com/watch?v=ZVMXOxwKQA0&t=871s
    const httpOptions = {
      headers: new HttpHeaders({'Content-Type': 'aplication/json'})
    };
    return this.http.get<Stock[]>(this.stocksUrl, httpOptions );
  }
}
