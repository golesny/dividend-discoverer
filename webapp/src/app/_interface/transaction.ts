
export class Transaction {

    constructor(
      public isin: string,
      public amount: number,
      public pricetotal: number,
      public type: string,
      public date: string,
      public name?: string,
      public comment?: string
      ) {
      }
}
