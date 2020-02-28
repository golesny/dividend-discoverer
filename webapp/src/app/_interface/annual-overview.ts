export interface AnnualOverview {
    year: number;
    cashinyear: number; // new money
    endyearcash: number; // cash at end of the year
    stockvalue: number;  // stock value at end if the year
    deltaPerc: number; // delta of this year
    expected_value: number;
}