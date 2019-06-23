import { Portfolio } from './portfolio';
import { AnnualOverview } from './annual-overview';

export interface PortfolioContainer {
    /** value of all stocks */
    stock_sum: number;
    overview:Portfolio[];
    overview_col_headers:string[];
    annualoverview:AnnualOverview[];
    totaldeposit: number;
    currentcash: number;
    totalprofit_perc: number;
    depot_total_value: number;
    depotAnnualPercentage: number;
    depotExpectedValue: number;
    currency: string;
}