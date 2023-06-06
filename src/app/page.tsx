'use client';
import { ReactElement } from 'react';
import {
    AdditionalSpendingContext,
    MonthlySpendingContext,
    useGlobalContext,
} from '@/lib/hooks/globalContext';
import Main from '@/components/Main';

export default function Home(): ReactElement {
    const {
        globalAdditionalSpendingStateProps,
        globalMonthlySpendingStateProps,
        additionalSpending,
        monthlySpending,
    } = useGlobalContext();
    const mainProps = { additionalSpending, monthlySpending };

    return (
        <MonthlySpendingContext.Provider
            value={globalMonthlySpendingStateProps}
        >
            <AdditionalSpendingContext.Provider
                value={globalAdditionalSpendingStateProps}
            >
                <Main {...mainProps} />
            </AdditionalSpendingContext.Provider>
        </MonthlySpendingContext.Provider>
    );
}
