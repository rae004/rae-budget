import { createContext, Dispatch, SetStateAction } from 'react';

type SingleSpendingItemType = {
    name: string;
    amount: number;
};

type PayPeriodPropsType = {
    tabIndex: number;
    additionalSpendingTotal: number;
    additionalSpendingItems: SingleSpendingItemType[];
    monthlyBillsTotal: number;
    monthlyBillsItems: SingleSpendingItemType[];
    totalsOverview: {
        monthlySpending: number;
        runningTotal: number;
        additionalIncome: number;
        payCheck: number;
        remainingPayPeriodAmount: number;
    };
};

type GlobalPayPeriodType = {
    tabTitle: string;
    tabDescription: string;
    payPeriodProps: PayPeriodPropsType;
};

type GlobalContextType = {
    totalIncome: number;
    totalBills: number;
    totalAdditionalSpending: number;
    payPeriods: GlobalPayPeriodType[];
};

type ContextType = [
    GlobalContextType,
    Dispatch<SetStateAction<{ type: string; payload: any }>>,
];

export const initialState = {
    totalIncome: 0,
    totalBills: 0,
    totalAdditionalSpending: 0,
    payPeriods: [],
};

export const GlobalContext = createContext<ContextType>([
    initialState,
    () => null,
]);
