import { TimeseriesPair } from './timeseries-pair';

export interface Portfolio {
    isin: string;
    name: string;
    currency: string;
    symbol: string;
    amount: number;
    entryprice: number;
    lastprice: number;

    timeseries: Map<string,TimeseriesPair>;
}