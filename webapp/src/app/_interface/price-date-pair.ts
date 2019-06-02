export class PriceDatePair {
    constructor(
        public isin: string,
        public date: Date,
        public price: number,
        public inDB?: boolean,
        public deltaPercentage?: number
    ) {}
};
