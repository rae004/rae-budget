import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import convertNumberToCurrencyString from '@/lib/convertNumberToCurrencyString';

export interface RaeDataTableProps {
    dataTable: any;
    columns: ColumnMeta[];
}

export interface ColumnMeta {
    field: string;
    header: string;
}

const RaeDataTable = ({ ...props }: RaeDataTableProps) => {
    const { dataTable, columns } = props;
    // Convert to currency string format $0.00
    const viewData = dataTable.map((item: any) => {
        const stringCurrency = convertNumberToCurrencyString({
            number: item.currency,
            locale: 'en-US',
        });
        return { ...item, currency: stringCurrency };
    });

    return (
        <div className="card">
            <DataTable
                value={viewData}
                stripedRows
                tableStyle={{ minWidth: '50rem' }}
            >
                {columns.map((col, i) => (
                    <Column
                        key={i}
                        field={col.field}
                        header={col.header}
                    />
                ))}
            </DataTable>
        </div>
    );
};

export default RaeDataTable;
