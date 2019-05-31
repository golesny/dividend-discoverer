
export interface Report {
    isin: string;
    name: string;
    currency: string;
    last10yPercentage: number;
    last20yPercentage: number;
    divIn30y: number;
    divCum30y: number;
    div_increases: number;
    div_equal: number;
    div_decreses: number;
    div_avg: number;
    div_5_avg: number;
    div_10_avg: number;
    latest_price:number,
    latest_div:number,
    report_count:number
}
