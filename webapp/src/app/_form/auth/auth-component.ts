import { DataService } from 'src/app/_service/data.service';

export class AuthComponent  {
    
    constructor(private ds: DataService) {
    }
    
  hasUserRights(role: string): boolean {
    if ( this.ds.getUserInfo() == undefined ) {
      return false;
    }
    var hasRight = this.ds.getUserInfo().rights.includes(role);
    return hasRight;
  }

  get userInfo() {
    return this.ds.userInfo;
  }
}