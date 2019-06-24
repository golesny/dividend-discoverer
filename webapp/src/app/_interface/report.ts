import { ISIN } from './isin';

export interface Report extends ISIN {
    divIn30y: number;
    divCum30y: number;
    divIn30yEUR: number;
    divCum30yEUR: number;
    div_increases: number;
    div_equal: number;
    div_decreses: number;
    div_avg: number;
    div_4_avg?: number;
    div_8_avg?: number;
    div_12_avg?: number;
    div_16_avg?: number;
    div_pessimistic?:number;

}
