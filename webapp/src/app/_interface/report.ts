
export interface Report {
    isin: string;
    name: string;
    currency: string;
    divIn30y: number;
    divCum30y: number;
    div_increases: number;
    div_equal: number;
    div_decreses: number;
    div_avg: number;
    div_5_avg?: number;
    div_10_avg?: number;
    div_15_avg?: number;
    div_pessimistic?:number;
    latest_price:number,
    latest_div:number,
    report_count:number
}
