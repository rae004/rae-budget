import { createContext } from 'react';

export type GlobalAdditionalSpendingState = {
    totalAdditionalSpending: number;
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

export type GlobalMonthlySpendingState = {
    totalMonthlySpending: number;
};

export type GlobalMonthlySpendingProps = {
    setGlobalMonthlySpendingState: (
        state: GlobalMonthlySpendingState,
    ) => void;
} & GlobalMonthlySpendingState;

export const MonthlySpendingContext =
    createContext<GlobalMonthlySpendingProps>({
        totalMonthlySpending: 0,
        setGlobalMonthlySpendingState: () => {},
    });
