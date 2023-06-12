import MonthlyBills, {
    MonthlyBillsProps,
} from '@/components/MonthlyBills';
import { useContext, useEffect, useState } from 'react';
import {
    GlobalBudgetContext,
    PayPeriodProps,
    useGlobalBudgetContext,
} from '@/lib/hooks/globalContext';

const PayPeriod = ({ ...props }: PayPeriodProps) => {
    const context = useContext(GlobalBudgetContext);
    console.log('context in pay period: ', context);

    // monthly bills state
    const [monthlySpendingTotal, setMonthlySpendingTotal] =
        useState(props.monthlyBillsTotal);
    const [monthlySpendingItems, setMonthlySpendingItems] =
        useState(props.monthlyBillsItems);
    const monthlyBillsProps: MonthlyBillsProps = {
        monthlySpendingTotal,
        setMonthlySpendingTotal,
        monthlySpendingItems,
        setMonthlySpendingItems,
    };
    //
    // useEffect(() => {
    //     setGlobalBudgetState({
    //         ...globalProps,
    //     });
    // }, [monthlySpendingItems]);
    // console.log('global props in pay period: ', globalProps);

    return (
        <main>
            <MonthlyBills {...monthlyBillsProps} />
            {/*<AdditionalSpending />*/}
            {/*<TotalsOverview {...totalsOverviewProps} />*/}
        </main>
    );
};

export default PayPeriod;
