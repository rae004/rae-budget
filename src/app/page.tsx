'use client';
import { ReactElement, useEffect, useReducer } from 'react';
import {
    GlobalContext,
    initialState,
} from '@/lib/hooks/globalContext';
import PayPeriodTabs from '@/components/PayPeriodTabs';
import { useLocalStorage } from 'primereact/hooks';

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
        case 'UPDATE_PAY_PERIOD_PAY_CHECK_AMOUNT':
            // update pay check amount in the pay period.
            state.payPeriods[
                payPeriodIndex
            ].payPeriodProps.totalsOverview.payCheck = newItem;

            return {
                ...state,
            };
        case 'UPDATE_PAY_PERIOD_BONUS_AMOUNT':
            // update bonus amount in the pay period.
            state.payPeriods[
                payPeriodIndex
            ].payPeriodProps.totalsOverview.additionalIncome =
                newItem;

            return {
                ...state,
            };
    }
};

export default function Home(): ReactElement {
    const localStorageName = 'globalRaeBudget';
    const storedState = localStorage.getItem(localStorageName);
    const ourInitialState = storedState
        ? JSON.parse(storedState)
        : initialState;

    const [globalState, storeGlobalState] = useLocalStorage(
        ourInitialState,
        localStorageName,
    );
    const [state, dispatch] = useReducer(reducer, globalState);

    useEffect(() => {
        storeGlobalState(state);
    }, [state]);

    return (
        <GlobalContext.Provider value={[state, dispatch]}>
            <PayPeriodTabs />
        </GlobalContext.Provider>
    );
}
