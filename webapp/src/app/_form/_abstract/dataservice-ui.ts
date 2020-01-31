import { DataService } from 'src/app/_service/data.service';
import { NotifyService } from 'src/app/_service/notify.service';
import { AuthComponent } from '../auth/auth-component';

export class DataserviceUi extends AuthComponent {

    currencies:Map<string, number>;

    constructor(private dservice:DataService,
        private nservice: NotifyService) {
          super(dservice);
          this.currencies = new Map();
          this.currencies.set("EUR", 1);
    }

    public loadRates(): void {
        this.dservice.getExchangeRates()
        .subscribe((data: Map<string, number>) => {
          this.currencies = data;        
          console.log('currencies loaded %s', this.currencies);
        }, error => {
          console.error('ERROR: ${error.message}');
          this.nservice.showError("error ", error.message);
        }
        );
      }
}