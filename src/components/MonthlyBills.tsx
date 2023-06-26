import TextInput, {
    TextInputProps,
} from '@/components/inputs/TextInput';
import CurrencyInput, {
    CurrencyInputProps,
} from '@/components/inputs/CurrencyInput';
import 'primereact/resources/primereact.min.css';
import SimpleButton from '@/components/buttons/SimpleButton';
import NewDataTable, {
    ColumnMeta,
    NewDataTableProps,
} from '@/components/NewDataTable';
import usePayPeriod from '@/lib/hooks/usePayPeriod';
import { useContext, useEffect, useState } from 'react';
import {
    GlobalContext,
    SingleSpendingItemType,
} from '@/lib/hooks/globalContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import styles from './component.module.css';

const MonthlyBills = ({ ...props }) => {
    // const {
    //     state,
    //     payPeriodIndex,
    //     columns,
    //     handleAddButtonClick,
    //     textProps,
    //     currencyProps,
    // } = usePayPeriod({
    //     ...props,
    //     action: 'ADD_MONTHLY_BILL_ITEM',
    // });
    const { tabIndex } = props;
    const payPeriodIndex = tabIndex - 1;
    const [state, dispatch] = useContext(GlobalContext);

    const columns: ColumnMeta[] = [
        {
            field: 'name',
            header: 'Text',
        },
        {
            field: 'amount',
            header: 'Amount',
        },
        {
            field: 'checkbox',
            header: 'Paid',
        },
    ];
    const monthlyBillsItems =
        state.payPeriods[payPeriodIndex].payPeriodProps
            .monthlyBillsItems;
    const selectedProdInitialState = monthlyBillsItems
        ? monthlyBillsItems.filter(
              (item) => item.isSelected === true,
          )
        : null;

    const [name, setName] = useState<string>('');
    const [amount, setAmount] = useState(0);
    const [selectedProducts, setSelectedProducts] = useState<
        SingleSpendingItemType[] | null
    >(selectedProdInitialState);

    const handleAddButtonClick = () => {
        const id =
            state.payPeriods[payPeriodIndex].payPeriodProps
                .monthlyBillsItems.length + 1;
        const isSelected = false;

        const newItem: SingleSpendingItemType = {
            id,
            name,
            amount,
            isSelected,
        };

        const addItemPayload = {
            tabIndex,
            newItem,
        };
        console.log('our new item: ', newItem);
        dispatch({
            type: 'ADD_MONTHLY_BILL_ITEM',
            payload: addItemPayload,
        });
        setName('');
        setAmount(0);
    };

    const textProps: TextInputProps = {
        value: name,
        setText: setName,
    };
    const currencyProps: CurrencyInputProps = {
        value: amount,
        setCurrency: setAmount,
        inputClasses: '',
        currency: 'USD',
        locale: 'en-US',
    };

    const tableProps = {
        columns,
        tableData: monthlyBillsItems,
        styles: {
            parentDiv: 'card',
            tableHeader: '',
            tableBody: { minWidth: '50rem' },
            columnStyle: {},
        },
        selectedProducts,
        setSelectedProducts,
    };

    useEffect(() => {
        console.log('our checkbox change!!!', selectedProducts);

        const payload = {
            tabIndex,
            selectedProducts,
        };
        dispatch({
            type: 'UPDATE_MONTHLY_BILL_ITEM_IS_PAID',
            payload: payload,
        });
    }, [selectedProducts]);

    return (
        <div>
            <h2>Monthly Bills</h2>
            <div className="flex flex-wrap flex-row gap-3 p-fluid align-items-end">
                <div className="flex-auto">
                    <label
                        htmlFor="currency-us"
                        className="font-bold block mb-2"
                    >
                        Amount
                    </label>
                    <CurrencyInput {...currencyProps} />
                </div>
                <div className="flex-auto">
                    <label
                        htmlFor="text-input"
                        className="font-bold block mb-2"
                    >
                        Text
                    </label>
                    <TextInput {...textProps} />
                </div>
                <div className="flex-auto">
                    <SimpleButton
                        label={'Add'}
                        clickHandler={handleAddButtonClick}
                    />
                </div>
            </div>

            <NewDataTable {...tableProps} />
        </div>
    );
};

export default MonthlyBills;
