export class PriceDatePair {
    constructor(
        /**
         * isin
         */
        public isin: string,
        public date: string,
        public price: number,
        public estimated: boolean,
        public inDB?: boolean,
        public deltaPercentage?: number,
        public currency?: string
    ) {}
};
