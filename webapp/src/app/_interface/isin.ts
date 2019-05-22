
export class ISIN {

    constructor(
      public isin: string,
      public name: string,
      public currency: string,
      public updated_ts?: Date) {
      }
}
