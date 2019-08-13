export class PriceDatePair {
    constructor(
        /**
         * isin
         */
        public isin: string,
        /**
         * Can be a date for price or a year for dividends
         */
        public date: string,
        public price: number,
        public estimated: boolean,
        public inDB?: boolean,
        public deltaPercentage?: number,
        public currency?: string
    ) {}
};
