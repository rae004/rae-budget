'use client';
import { ReactElement, useReducer } from 'react';
import {
    GlobalContext,
    initialState,
} from '@/lib/hooks/globalContext';
import PayPeriodTabs from '@/components/PayPeriodTabs';

const reducer = (state: any, action: any) => {
    switch (action.type) {
        case 'ADD_PAY_PERIOD':
            return {
                ...state,
                payPeriods: [
                    ...state.payPeriods,
                    action.payload,
                ],
            };
        case 'ADD_MONTHLY_BILL':
            const { tabIndex, newItem } = action.payload;
            const payPeriodIndex = tabIndex - 1;
            const payPeriodMonthlyBillsItems =
                state.payPeriods[payPeriodIndex].payPeriodProps
                    .monthlyBillsItems;

            // add new item to the monthly bills.
            state.payPeriods[
                payPeriodIndex
            ].payPeriodProps.monthlyBillsItems = [
                ...payPeriodMonthlyBillsItems,
                newItem,
            ];

            return {
                ...state,
            };
    }
};

export default function Home(): ReactElement {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <GlobalContext.Provider value={[state, dispatch]}>
            <PayPeriodTabs />
        </GlobalContext.Provider>
    );
}
