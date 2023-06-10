import { useEffect, useState } from 'react';
import NewDataTable, {
    ColumnMeta,
    NewDataTableProps,
    OnCellEditComplete,
} from '@/components/NewDataTable';
import { ColumnEvent } from 'primereact/column';
import {
    isPositiveInteger,
    priceFields,
} from '@/lib/dataTableHelpers';

const TotalsOverview = ({ ...props }) => {
    const [payPeriodBillTotal, setPayPeriodBillTotal] =
        useState<number>(
            props.monthlySpending.totalMonthlySpending,
        );
    const [runningTotal, setRunningTotal] = useState<number>(0);
    const [additionalIncome, setAdditionalIncome] =
        useState<number>(0);
    const [
        remainingPayPeriodAmount,
        setRemainingPayPeriodAmount,
    ] = useState<number>(0);

    const [payCheck, setPayCheck] = useState<number>(0);

    const tableData = [
        {
            name: 'Pay Period Bill total:',
            parameter: 'monthlySpending',
            amount: payPeriodBillTotal,
            note: '',
        },
        {
            name: 'Running Pay Period Total:',
            parameter: 'runningTotal',
            amount: runningTotal,
            note: '',
        },
        {
            name: 'Additional Income (Bonus):',
            parameter: 'additionalIncome',
            amount: additionalIncome,
            note: '',
        },
        {
            name: 'Pay Check:',
            parameter: 'payCheck',
            amount: payCheck,
            note: '',
        },
        {
            name: 'Remaining for Pay Period:',
            parameter: 'remainingPayPeriodAmount',
            amount: remainingPayPeriodAmount,
            note: '',
        },
    ];

    // update totals on dependency changes.
    useEffect(() => {
        setPayPeriodBillTotal(
            props.monthlySpending.totalMonthlySpending,
        );
        setRunningTotal(
            props.monthlySpending.totalMonthlySpending +
                props.additionalSpending
                    .totalAdditionalSpending,
        );
        setRemainingPayPeriodAmount(
            payCheck +
                additionalIncome -
                (props.monthlySpending.totalMonthlySpending +
                    props.additionalSpending
                        .totalAdditionalSpending),
        );
    }, [
        props.monthlySpending.totalMonthlySpending,
        props.additionalSpending.totalAdditionalSpending,
        payCheck,
        additionalIncome,
    ]);

    const columns: ColumnMeta[] = [
        { field: 'name', header: 'Name' },
        { field: 'amount', header: 'Amount' },
        { field: 'note', header: 'Note' },
    ];

    const onCellEditComplete: OnCellEditComplete = (
        e: ColumnEvent,
    ) => {
        let {
            rowData,
            newValue,
            field,
            originalEvent: event,
        } = e;

        let result;

        if (priceFields.includes(field)) {
            result = isPositiveInteger(newValue)
                ? (rowData[field] = newValue)
                : event.preventDefault();
        }

        if (rowData.parameter === 'payCheck') {
            setPayCheck(result);
        }

        if (rowData.parameter === 'additionalIncome') {
            setAdditionalIncome(result);
        }

        return result;
    };

    const tableProps: NewDataTableProps = {
        columns,
        tableData,
        tableHeader: 'Totals Overview',
        styles: {
            parentDiv: 'card p-fluid',
            tableHeader: '',
            tableBody: { minWidth: '50rem' },
            columnStyle: { width: '25%' },
        },
        ourOnCellEditComplete: onCellEditComplete,
    };

    return <NewDataTable {...tableProps} />;
};

export default TotalsOverview;
