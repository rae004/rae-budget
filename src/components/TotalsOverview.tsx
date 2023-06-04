import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import {
    Column,
    ColumnEvent,
    ColumnEditorOptions,
} from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import {
    InputNumber,
    InputNumberValueChangeEvent,
} from 'primereact/inputnumber';

interface ColumnMeta {
    field: string;
    header: string;
}
interface Product {
    name: string;
    amount: number;
    note: string;
}

const TotalsOverview = ({ ...props }) => {
    const [products, setProducts] = useState<Product[] | []>(
        [],
    );

    const columns: ColumnMeta[] = [
        { field: 'name', header: 'Name' },
        { field: 'amount', header: 'Amount' },
        { field: 'note', header: 'Note' },
    ];

    useEffect(() => {
        const products: Product[] = [
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
        ];
        setProducts(products);
    }, []);

    const isPositiveInteger = (val: any) => {
        let str = String(val);

        str = str.trim();

        if (!str) {
            return false;
        }

        str = str.replace(/^0+/, '') || '0';
        let n = Math.floor(Number(str));

        return n !== Infinity && String(n) === str && n >= 0;
    };

    const onCellEditComplete = (e: ColumnEvent) => {
        let {
            rowData,
            newValue,
            field,
            originalEvent: event,
        } = e;

        switch (field) {
            case 'amount':
                if (isPositiveInteger(newValue)) {
                    rowData[field] = newValue;
                } else {
                    event.preventDefault();
                }
                break;

            default:
                if (newValue.trim().length > 0) {
                    rowData[field] = newValue;
                } else {
                    event.preventDefault();
                }
                break;
        }
    };

    const cellEditor = (options: ColumnEditorOptions) => {
        console.log('our options: ', options);
        if (options.field === 'amount') {
            return priceEditor(options);
        } else {
            return textEditor(options);
        }
    };

    const textEditor = (options: ColumnEditorOptions) => {
        const { editorCallback } = options;
        return (
            <InputText
                type="text"
                value={options.value}
                onChange={(
                    e: React.ChangeEvent<HTMLInputElement>,
                ) =>
                    editorCallback &&
                    editorCallback(e.target.value)
                }
            />
        );
    };

    const priceEditor = (options: ColumnEditorOptions) => {
        const { editorCallback } = options;
        return (
            <InputNumber
                value={options.value}
                onValueChange={(
                    e: InputNumberValueChangeEvent,
                ) => editorCallback && editorCallback(e.value)}
                mode="currency"
                currency="USD"
                locale="en-US"
            />
        );
    };

    const priceBodyTemplate = (rowData: Product) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(rowData.amount);
    };

    return (
        <div className="card p-fluid">
            <h2>TotalsOverview</h2>
            <DataTable
                value={products}
                editMode="cell"
                tableStyle={{ minWidth: '50rem' }}
            >
                {columns.map(({ field, header }) => {
                    return (
                        <Column
                            key={field}
                            field={field}
                            header={header}
                            style={
                                field === 'name'
                                    ? {
                                          width: '25%',
                                          textAlign: 'right',
                                      }
                                    : { width: '25%' }
                            }
                            body={
                                field === 'amount' &&
                                priceBodyTemplate
                            }
                            editor={(options) =>
                                cellEditor(options)
                            }
                            onCellEditComplete={
                                onCellEditComplete
                            }
                        />
                    );
                })}
            </DataTable>
        </div>
    );
};

export default TotalsOverview;
