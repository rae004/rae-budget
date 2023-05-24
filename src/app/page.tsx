'use client';
import { ReactElement, useState } from 'react';
import {
    GlobalContext,
    GlobalProps,
    GlobalState,
} from '@/lib/globalContext';
import AdditionalSpending from '@/components/additionalSpending';
import convertNumberToCurrencyString from '@/lib/convertNumberToCurrencyString';

export default function Home(): ReactElement {
    const [globalState, setGlobalState] = useState<GlobalState>(
        { totalAdditionalSpending: 0 },
    );
    const globalProps: GlobalProps = {
        ...globalState,
        setGlobalState,
    };

    return (
        <GlobalContext.Provider value={globalProps}>
            <main className="flex min-h-screen flex-col items-center justify-center p-24">
                <div>
                    Additional Spending:{' '}
                    {convertNumberToCurrencyString(
                        globalState.totalAdditionalSpending,
                    )}
                </div>
                <div className={'w-1/2'}>
                    <AdditionalSpending />
                </div>
            </main>
        </GlobalContext.Provider>
    );
}
