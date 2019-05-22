import { ISIN } from './isin';

export interface Stock {
    isin: ISIN;
    last10yPercentage: number;
    last20yPercentage: number;
    divIn30y: number;
    divCum30y: number;
}
