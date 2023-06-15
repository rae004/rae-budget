import { useContext } from 'react';
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
    const payPeriodBillsTotal =
        state.payPeriods[payPeriodIndex].payPeriodProps
            .monthlyBillsTotal;
    const additionalSpendingTotal =
        state.payPeriods[payPeriodIndex].payPeriodProps
            .additionalSpendingTotal;
    const payPeriodRunningTotal =
        additionalSpendingTotal + payPeriodBillsTotal;
    const payCheck =
        state.payPeriods[payPeriodIndex].payPeriodProps
            .totalsOverview.payCheck;
    const additionalIncome =
        state.payPeriods[payPeriodIndex].payPeriodProps
            .totalsOverview.additionalIncome;
    const remainingPayPeriodAmount =
        payCheck +
        additionalIncome -
        (payPeriodBillsTotal + additionalSpendingTotal);

    const tableData = [
        {
            name: 'Pay Period Bill total:',
            parameter: 'monthlySpending',
            amount: payPeriodBillsTotal,
            note: '',
        },
        {
            name: 'Running Pay Period Total:',
            parameter: 'runningTotal',
            amount: payPeriodRunningTotal,
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
            dispatch({
                type: 'UPDATE_PAY_PERIOD_PAY_CHECK_AMOUNT',
                payload: { newItem: result, tabIndex },
            });
        }

        if (rowData.parameter === 'additionalIncome') {
            dispatch({
                type: 'UPDATE_PAY_PERIOD_BONUS_AMOUNT',
                payload: { newItem: result, tabIndex },
            });
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
