import { DataService } from 'src/app/_service/data.service';

export class AuthComponent  {
    
    constructor(protected dataService: DataService) {
    }
    
  hasUserRights(role: string): boolean {
    if ( this.dataService.getUserInfo() == undefined ) {
      return false;
    }
    var hasRight = this.dataService.getUserInfo().rights.includes(role);
    return hasRight;
  }

  get userInfo() {
    return this.dataService.userInfo;
  }
}