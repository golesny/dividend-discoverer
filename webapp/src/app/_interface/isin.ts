
export class ISIN {

    constructor(
      public isin: string,
      public name: string,
      public currency: string,
      public sector: string,
      public symbol: string,
      public symbolcurrency?: string,
      public updated_ts?: Date,
      public report_count?: number      
      ) {
      }
}
