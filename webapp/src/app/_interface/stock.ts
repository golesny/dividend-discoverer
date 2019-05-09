import { ISIN } from './isin';
import { Dividend } from './dividend';

export interface Stock {
    isin: ISIN;
    last10yPercentage: number;
    last20yPercentage: number;
    divIn30y: number;
    divCum30y: number;
}
