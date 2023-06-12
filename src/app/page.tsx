'use client';
import { ReactElement, useReducer } from 'react';
import {
    GlobalContext,
    initialState,
} from '@/lib/hooks/globalContext';
import PayPeriodTabs from '@/components/PayPeriodTabs';

const reducer = (state: any, action: any) => {
    // console.log('our state in reducer', state);
    console.log('our action in reducer', action);
    switch (action.type) {
        case 'ADD_PAY_PERIOD':
            return {
                ...state,
                payPeriods: [
                    ...state.payPeriods,
                    action.payload,
                ],
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
