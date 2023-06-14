'use client';
import { ReactElement, useReducer } from 'react';
import {
    GlobalContext,
    initialState,
} from '@/lib/hooks/globalContext';
import PayPeriodTabs from '@/components/PayPeriodTabs';

const reducer = (state: any, action: any) => {
    const { tabIndex, newItem } = action.payload;
    const payPeriodIndex = tabIndex - 1;
    switch (action.type) {
        case 'ADD_PAY_PERIOD':
            return {
                ...state,
                payPeriods: [
                    ...state.payPeriods,
                    action.payload,
                ],
            };
        case 'ADD_MONTHLY_BILL_ITEM':
            const payPeriodMonthlyBillsItems =
                state.payPeriods[payPeriodIndex].payPeriodProps
                    .monthlyBillsItems;
            const newMonthlyBillsTotal =
                newItem.amount +
                state.payPeriods[payPeriodIndex].payPeriodProps
                    .monthlyBillsTotal;

            // add new item to the monthly bills.
            state.payPeriods[
                payPeriodIndex
            ].payPeriodProps.monthlyBillsItems = [
                ...payPeriodMonthlyBillsItems,
                newItem,
            ];

            // update the total of the monthly bills.
            state.payPeriods[
                payPeriodIndex
            ].payPeriodProps.monthlyBillsTotal =
                newMonthlyBillsTotal;

            return {
                ...state,
            };
        case 'ADD_ADDITIONAL_SPENDING_ITEM':
            const payPeriodAdditionalSpendingItems =
                state.payPeriods[payPeriodIndex].payPeriodProps
                    .additionalSpendingItems;
            const newAdditionalSpendingTotal =
                newItem.amount +
                state.payPeriods[payPeriodIndex].payPeriodProps
                    .additionalSpendingTotal;

            // add new item to the monthly bills.
            state.payPeriods[
                payPeriodIndex
            ].payPeriodProps.additionalSpendingItems = [
                ...payPeriodAdditionalSpendingItems,
                newItem,
            ];

            // update the total of the additional spending.
            state.payPeriods[
                payPeriodIndex
            ].payPeriodProps.additionalSpendingTotal =
                newAdditionalSpendingTotal;

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
