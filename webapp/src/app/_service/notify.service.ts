import { ToastrService } from 'ngx-toastr';
import { Injectable } from '@angular/core';


@Injectable({
    providedIn: 'root'
  })
  export class NotifyService {
    constructor(private toastr: ToastrService) {

    }

    /**
     * showError
     *
     */
    public showError(customMsg: string, err: any) {
        var errMsg;
        if (err.error != undefined) {
            errMsg = err.error;
        } else {
            errMsg = JSON.stringify(err);
        }
        console.error(customMsg, errMsg);
        this.toastr.error(customMsg+ " " + errMsg);
    }
}