import { useEffect, useState } from 'react';
import NewDataTable, {
    ColumnMeta,
    NewDataTableProps,
} from '@/components/NewDataTable';

interface Product {
    name: string;
    parameter: string;
    amount: number;
    note: string;
}

const TotalsOverview = ({ ...props }) => {
    const [products, setProducts] = useState<Product[]>([
        {
            name: 'Pay Period Bill total:',
            parameter: 'monthlySpending',
            amount: props.monthlySpending.totalMonthlySpending,
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
            amount: 0,
            note: '',
        },
        {
            name: 'Pay Check:',
            parameter: 'payCheck',
            amount: 0,
            note: '',
        },
        {
            name: 'Remaining for Pay Period:',
            parameter: 'remainingPayPeriodAmount',
            amount: 0,
            note: '',
        },
    ]);

    // update monthly bills total when updated in the parent component
    useEffect(() => {
        if (props.monthlySpending.totalMonthlySpending) {
            setProducts(
                products.map((product) => {
                    if (
                        product.parameter === 'monthlySpending'
                    ) {
                        product.amount =
                            props.monthlySpending.totalMonthlySpending;
                    }
                    return product;
                }),
            );
        }
    }, [props.monthlySpending.totalMonthlySpending]);

    const columns: ColumnMeta[] = [
        { field: 'name', header: 'Name' },
        { field: 'amount', header: 'Amount' },
        { field: 'note', header: 'Note' },
    ];

    const tableProps: NewDataTableProps = {
        columns,
        tableData: products,
        tableHeader: 'Totals Overview',
        styles: {
            parentDiv: 'card p-fluid',
            tableHeader: '',
            tableBody: { minWidth: '50rem' },
            columnStyle: { width: '25%' },
        },
    };

    return <NewDataTable {...tableProps} />;
};

export default TotalsOverview;
