import { TimeseriesPair } from './timeseries-pair';

export interface Portfolio {
    isin: string;
    name: string;
    currency: string;
    symbol: string;

    timeseries: Map<string,TimeseriesPair>;
}