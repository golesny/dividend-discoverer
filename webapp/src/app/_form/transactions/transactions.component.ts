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
  mode:string;

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

  edit(t: Transaction) {
    this.model = JSON.parse(JSON.stringify(t));
    this.date = new Date(Date.parse(this.model.date));
  }
  
  delete(t: Transaction) {
    if (confirm("Are you sure to delete "+t.date +", "+t.type+" "+t.amount)) {
      this.dataService.deleteTransaction(t.id).subscribe(
        data => {
          var idx = this.transactions.findIndex(e => e.id == data["deleted_transaction_id"]);
          this.transactions.splice(idx, 1); 
        }
      )
    }
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
        if (this.model.id == undefined) {
          this.transactions.unshift(data["transaction"]);
          this.resetForm();
        } else {
          var idx = this.transactions.findIndex(e => e.id == data["transaction"].id);
          this.transactions.splice(idx, 1, data["transaction"]);
        }
      }
    )
  }
}
