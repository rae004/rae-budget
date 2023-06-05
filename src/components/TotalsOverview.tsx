import React, { useEffect, useState } from 'react';
import {
    DataTable,
    DataTableDataSelectableEvent,
} from 'primereact/datatable';
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
import CurrencyInput from '@/components/inputs/CurrencyInput';
import TextInput from '@/components/inputs/TextInput';
import convertNumberToCurrencyString from '@/lib/convertNumberToCurrencyString';
import { useGlobalContext } from '@/lib/globalContext';

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
    console.log('our props: ', props);
    const disableInputList = [
        'Pay Period Bill total:',
        'Running Pay Period Total:',
        'Remaining for Pay Period:',
    ];

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
        if (options.field === 'amount') {
            return priceEditor(options);
        } else {
            return textEditor(options);
        }
    };

    const textEditor = (options: ColumnEditorOptions) => {
        const { editorCallback } = options;

        return (
            <TextInput
                value={options.value}
                setText={editorCallback}
            />
        );
    };

    const priceEditor = (options: ColumnEditorOptions) => {
        const { editorCallback } = options;
        const numberInputProps = {
            value: options.value,
            setCurrency: editorCallback,
            inputClasses: '',
            currency: 'USD',
            locale: 'en-US',
        };

        return <CurrencyInput {...numberInputProps} />;
    };

    const priceBodyTemplate = (rowData: Product) => {
        return convertNumberToCurrencyString({
            number: rowData.amount,
            locale: 'en-US',
        });
    };

    const isSelectable = (data: Product) =>
        !disableInputList.includes(data.name);

    const isRowSelectable = (
        event: DataTableDataSelectableEvent,
    ) =>
        event.data ? isSelectable(event.data as Product) : true;
    const rowClassName = (data: Product) =>
        isSelectable(data) ? '' : 'p-disabled';

    return (
        <div className="card p-fluid">
            <h2>TotalsOverview</h2>
            <DataTable
                value={products}
                editMode="cell"
                tableStyle={{ minWidth: '50rem' }}
                isDataSelectable={isRowSelectable}
                rowClassName={rowClassName}
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
