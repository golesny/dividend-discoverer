
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
    latest_price:number,
    latest_div:number,
    report_count:number
}
