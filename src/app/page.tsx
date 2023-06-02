'use client';
import { ReactElement, useState } from 'react';
import {
    AdditionalSpendingContext,
    MonthlySpendingContext,
    GlobalAdditionalSpendingProps,
    GlobalAdditionalSpendingState,
    GlobalMonthlySpendingState,
    GlobalMonthlySpendingProps,
} from '@/lib/globalContext';
import AdditionalSpending from '@/components/additionalSpending';
import convertNumberToCurrencyString from '@/lib/convertNumberToCurrencyString';
import MonthlyBills from '@/components/monthlyBills';

export default function Home(): ReactElement {
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

    return (
        <MonthlySpendingContext.Provider
            value={globalMonthlySpendingStateProps}
        >
            <AdditionalSpendingContext.Provider
                value={globalAdditionalSpendingStateProps}
            >
                {/*<main className="flex min-h-screen flex-col items-center justify-center p-24">*/}
                <main>
                    <div>
                        Additional Spending:{' '}
                        {convertNumberToCurrencyString(
                            additionalSpending.totalAdditionalSpending,
                        )}
                    </div>
                    <div>
                        Monthly Spending:{' '}
                        {convertNumberToCurrencyString(
                            monthlySpending.totalMonthlySpending,
                        )}
                    </div>
                    {/*<div className={'w-2/3 flex flex-row m-2'}>*/}
                    <div>
                        {/*<span className={'w-1/2 mr-4'}>*/}
                        <span>
                            <MonthlyBills />
                        </span>
                        {/*<span className={'w-1/2 mr-2'}>*/}
                        <span>
                            {/*<AdditionalSpending />*/}
                        </span>
                    </div>
                </main>
            </AdditionalSpendingContext.Provider>
        </MonthlySpendingContext.Provider>
    );
}
