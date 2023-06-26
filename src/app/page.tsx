'use client';
import { ReactElement, useEffect, useReducer } from 'react';
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
        case 'UPDATE_MONTHLY_BILL_ITEM_IS_PAID':
            const newState = state.payPeriods[
                payPeriodIndex
            ].payPeriodProps.monthlyBillsItems.map(
                (item: any) => {
                    const isItemPaid =
                        action.payload.selectedProducts &&
                        action.payload.selectedProducts.some(
                            (selected: any) =>
                                selected.id === item.id,
                        );

                    if (isItemPaid) {
                        return {
                            ...item,
                            isSelected: true,
                        };
                    }
                    return { ...item, isSelected: false };
                },
            );

            state.payPeriods[
                payPeriodIndex
            ].payPeriodProps.monthlyBillsItems = newState;

            return {
                ...state,
            };
        case 'GET_FROM_LOCAL_STORAGE_ON_INIT':
            return {
                ...action.payload,
            };
    }
};

export default function Home(): ReactElement {
    const localStorageName = 'globalRaeBudget';
    const [state, dispatch] = useReducer(reducer, initialState);

    // get budget data from local storage on init.
    useEffect(() => {
        if (state.payPeriods.length === 0) {
            const storedStateString =
                localStorage.getItem(localStorageName);

            if (storedStateString) {
                const storedState = JSON.parse(
                    storedStateString,
                );
                if (storedState.payPeriods.length > 0) {
                    dispatch({
                        type: 'GET_FROM_LOCAL_STORAGE_ON_INIT',
                        payload: storedState,
                    });
                }
            }
        }
    }, []);
    // update budget data to local storage on state change.
    useEffect(() => {
        localStorage.setItem(
            localStorageName,
            JSON.stringify(state),
        );
    }, [state]);

    return (
        <GlobalContext.Provider value={[state, dispatch]}>
            <PayPeriodTabs />
        </GlobalContext.Provider>
    );
}
