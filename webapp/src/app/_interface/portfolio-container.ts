import { Portfolio } from './portfolio';
import { AnnualOverview } from './annual-overview';

export interface PortfolioContainer {
    /** value of all stocks */
    stock_sum: number;
    overview:Portfolio[];
    annualoverview:AnnualOverview[];
    totaldeposit: number;
    currentcash: number;
    totalprofit_perc: number;
    depot_total_value: number;
    depotAnnualPercentage: number;
    depotExpectedValue: number;
    currency: string;
}