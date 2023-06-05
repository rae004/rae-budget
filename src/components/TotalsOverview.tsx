import { useState } from 'react';
import NewDataTable, {
    ColumnMeta,
    NewDataTableProps,
} from '@/components/NewDataTable';

interface Product {
    name: string;
    amount: number;
    note: string;
}

const TotalsOverview = ({ ...props }) => {
    console.log('our props: ', props);
    const [products, setProducts] = useState<Product[]>([
        {
            name: 'Pay Period Bill total:',
            amount: 0,
            note: '',
        },
        {
            name: 'Running Pay Period Total:',
            amount: 0,
            note: '',
        },
        {
            name: 'Additional Income (Bonus):',
            amount: 0,
            note: '',
        },
        {
            name: 'Pay Check:',
            amount: 0,
            note: '',
        },
        {
            name: 'Remaining for Pay Period:',
            amount: 0,
            note: '',
        },
    ]);

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
