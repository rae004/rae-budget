'use client';
import { ReactElement, useState } from 'react';
import {
    AdditionalSpendingContext,
    GlobalAdditionalSpendingProps,
    GlobalAdditionalSpendingState,
} from '@/lib/globalContext';
import AdditionalSpending from '@/components/additionalSpending';
import convertNumberToCurrencyString from '@/lib/convertNumberToCurrencyString';
import MonthlyBills from '@/components/monthlyBills';

export default function Home(): ReactElement {
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

    return (
        <AdditionalSpendingContext.Provider
            value={globalAdditionalSpendingStateProps}
        >
            <main className="flex min-h-screen flex-col items-center justify-center p-24">
                <div className={'w-2/3 text-right'}>
                    Additional Spending:{' '}
                    {convertNumberToCurrencyString(
                        additionalSpending.totalAdditionalSpending,
                    )}
                </div>
                <div className={'w-2/3 flex flex-row m-2'}>
                    <span className={'w-1/2 mr-4'}>
                        <MonthlyBills />
                    </span>
                    <span className={'w-1/2 mr-2'}>
                        <AdditionalSpending />
                    </span>
                </div>
            </main>
        </AdditionalSpendingContext.Provider>
    );
}
