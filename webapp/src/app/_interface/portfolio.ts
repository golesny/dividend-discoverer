
export interface Portfolio {
    isin: string;
    name: string;
    currency: string;

    dates: string[];
    values: number[][];
}