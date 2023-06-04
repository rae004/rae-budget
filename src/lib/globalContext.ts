import { createContext, useState } from 'react';

// custom hook to manage global context
export const useGlobalContext = () => {
    // additional spending context
    const [
        additionalSpending,
        setGlobalAdditionalSpendingState,
    ] = useState<GlobalAdditionalSpendingState>({
        totalAdditionalSpending: 0,
    });
    const globalAdditionalSpendingStateProps: GlobalAdditionalSpendingProps =
        {
            ...additionalSpending,
            setGlobalAdditionalSpendingState,
        };

    // monthly spending context
    const [monthlySpending, setGlobalMonthlySpendingState] =
        useState<GlobalMonthlySpendingState>({
            totalMonthlySpending: 0,
        });
    const globalMonthlySpendingStateProps: GlobalMonthlySpendingProps =
        {
            ...monthlySpending,
            setGlobalMonthlySpendingState,
        };

    return {
        globalAdditionalSpendingStateProps,
        globalMonthlySpendingStateProps,
        additionalSpending,
        monthlySpending,
    };
};

// global additional spending context
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

// global monthly spending context
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
