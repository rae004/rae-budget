import { useContext, useEffect, useState } from 'react';
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
import { GlobalContext } from '@/lib/hooks/globalContext';

const TotalsOverview = ({ ...props }) => {
    const { tabIndex, action } = props;
    const payPeriodIndex = tabIndex - 1;
    const [state, dispatch] = useContext(GlobalContext);
    console.log('our state in totals: ', state);

    const [additionalIncome, setAdditionalIncome] =
        useState<number>(0);
    const [payCheck, setPayCheck] = useState<number>(0);

    const tableData = [
        {
            name: 'Pay Period Bill total:',
            parameter: 'monthlySpending',
            amount: 0,
            note: '',
        },
        {
            name: 'Running Pay Period Total:',
            parameter: 'runningTotal',
            amount: 0,
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
            amount: 0,
            note: '',
        },
    ];

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
