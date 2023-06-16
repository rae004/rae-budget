import {
    ColumnEditorOptions,
    ColumnEvent,
} from 'primereact/column';
import TextInput from '@/components/inputs/TextInput';
import CurrencyInput from '@/components/inputs/CurrencyInput';
import convertNumberToCurrencyString from '@/lib/convertNumberToCurrencyString';
import { DataTableDataSelectableEvent } from 'primereact/datatable';

export const disableInputList = [
    'Pay Period Bill total:',
    'Running Pay Period Total:',
    'Remaining for Pay Period:',
];

export const priceFields = ['amount', 'price', 'currency'];

export const isPositiveInteger = (val: any) => {
    let str = String(val);

    str = str.trim();

    if (!str) {
        return false;
    }

    str = str.replace(/^0+/, '') || '0';
    let n = Math.floor(Number(str));

    return n !== Infinity && String(n) === str && n >= 0;
};

export const onCellEditComplete = (e: ColumnEvent) => {
    let { rowData, newValue, field, originalEvent: event } = e;

    if (priceFields.includes(field)) {
        return isPositiveInteger(newValue)
            ? (rowData[field] = newValue)
            : event.preventDefault();
    }

    return newValue.trim().length > 0
        ? (rowData[field] = newValue)
        : event.preventDefault();
};

export const cellEditor = (options: ColumnEditorOptions) => {
    const { field } = options;

    return priceFields.includes(field)
        ? priceEditor(options)
        : textEditor(options);
};

export const textEditor = (options: ColumnEditorOptions) => {
    const { editorCallback } = options;

    return (
        <TextInput
            value={options.value}
            setText={editorCallback}
        />
    );
};

export const priceEditor = (options: ColumnEditorOptions) => {
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

export const priceBodyTemplate = (rowData: any) => {
    const keys = Object.keys(rowData);
    const match = keys.find((key) => priceFields.includes(key));

    return match
        ? convertNumberToCurrencyString({
              number: rowData[match],
              locale: 'en-US',
          })
        : 0;
};

export const isSelectable = (data: any) =>
    !disableInputList.includes(data.name);

export const isRowSelectable = (
    event: DataTableDataSelectableEvent,
) => (event.data ? isSelectable(event.data) : true);
export const rowClassName = (data: any) =>
    isSelectable(data) ? '' : 'p-disabled';
