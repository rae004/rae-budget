import { createContext } from 'react';

export type GlobalAdditionalSpendingState = {
    totalAdditionalSpending: number;
    // totalMonthlyBillsSpending?: number;
};

export type GlobalAdditionalSpendingProps = {
    setGlobalAdditionalSpendingState: (
        state: GlobalAdditionalSpendingState,
    ) => void;
} & GlobalAdditionalSpendingState;

export const AdditionalSpendingContext =
    createContext<GlobalAdditionalSpendingProps>({
        totalAdditionalSpending: 0,
        setGlobalAdditionalSpendingState: () => {},
    });
