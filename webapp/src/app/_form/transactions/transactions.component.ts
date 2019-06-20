import { Component, OnInit } from '@angular/core';
import { Transaction } from 'src/app/_interface/transaction';
import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from 'src/app/_service/notify.service';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.sass']
})
export class TransactionsComponent implements OnInit {
  model: Transaction;
  date: Date;
  transactions: Transaction[];

  constructor(private dataService: DataService,
              private notifyService: NotifyService) {
    this.resetForm();
    this.transactions = [];
  }

  ngOnInit() {
    this.dataService.getTransactions().subscribe(
      data => {
        this.transactions = data;
      },
      err => {
        this.notifyService.showError("Could not load transactions", err);
      }
    );
  }

  resetForm() {
    this.model = new Transaction('', 1, 0, 'BUY', '');
    this.date = new Date();
  }

  onSubmit() {
    var d = this.date.toISOString().substr(0, 10);
    this.model.date = d;
    this.dataService.postTransaction(this.model).subscribe(
      data => {
        this.transactions.unshift(data["transaction"]);
      }
    )
  }
}
