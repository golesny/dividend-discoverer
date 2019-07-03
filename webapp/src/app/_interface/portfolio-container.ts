import { Portfolio } from './portfolio';
import { AnnualOverview } from './annual-overview';
import { PortfolioColumn } from './portfolio-column';

export interface PortfolioContainer {
    /** value of all stocks */
    stock_sum: number;
    overview:Portfolio[];
    overview_cols:PortfolioColumn[];
    annualoverview:AnnualOverview[];
    totaldeposit: number;
    currentcash: number;
    totalprofit_perc: number;
    depot_total_value: number;
    depotAnnualPercentage: number;
    depotExpectedValue: number;
    currency: string;
}