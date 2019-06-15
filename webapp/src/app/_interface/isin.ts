
export class ISIN {

    constructor(
      public isin: string,
      public name: string,
      public currency: string,
      public sector: string,
      public updated_ts?: Date,
      public report_count?: number
      ) {
      }
}
