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
import { useContext, useState } from 'react';
import {
    GlobalContext,
    SingleSpendingItemType,
} from '@/lib/hooks/globalContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import styles from './component.module.css';

interface Product {
    id: string;
    code: string;
    name: string;
    description: string;
    image: string;
    price: number;
    category: string;
    quantity: number;
    inventoryStatus: string;
    rating: number;
}
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

    const [name, setName] = useState<string>('');
    const [amount, setAmount] = useState(0);

    const handleAddButtonClick = () => {
        const newItem: SingleSpendingItemType = {
            name,
            amount,
        };

        const addItemPayload = {
            tabIndex,
            newItem,
        };
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

    const tableData =
        state.payPeriods[payPeriodIndex].payPeriodProps
            .monthlyBillsItems;

    const tableProps: NewDataTableProps = {
        columns,
        tableData,
        styles: {
            parentDiv: 'card',
            tableHeader: '',
            tableBody: { minWidth: '50rem' },
            columnStyle: { width: '25%' },
        },
    };

    const [products, setProducts] = useState<Product[]>([
        {
            id: '1',
            code: 'prod-1',
            name: 'Test Product 1',
            description: 'A product for testing purposes',
            image: './prod-image.jpg',
            price: 100,
            category: 'Category 1',
            quantity: 10,
            inventoryStatus: 'INSTOCK',
            rating: 5,
        },
        {
            id: '3',
            code: 'prod-3',
            name: 'Test Product 3',
            description: 'A product for testing purposes',
            image: './prod-image.jpg',
            price: 100,
            category: 'Category 2',
            quantity: 10,
            inventoryStatus: 'INSTOCK',
            rating: 5,
        },
        {
            id: '2',
            code: 'prod-2',
            name: 'Test Product 2',
            description: 'A product for testing purposes',
            image: './prod-image.jpg',
            price: 100,
            category: 'Category 1',
            quantity: 10,
            inventoryStatus: 'INSTOCK',
            rating: 5,
        },
        {
            id: '4',
            code: 'prod-4',
            name: 'Test Product 4',
            description: 'A product for testing purposes',
            image: './prod-image.jpg',
            price: 100,
            category: 'Category 2',
            quantity: 10,
            inventoryStatus: 'INSTOCK',
            rating: 5,
        },
    ]);
    const [selectedProducts, setSelectedProducts] = useState<
        any[] | null
    >(null);
    const [rowClick, setRowClick] = useState<boolean>(true);

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
            {/*<NewDataTable {...tableProps} />*/}
            {/*<Column field="code" header="Code"></Column>*/}
            {/*<Column field="name" header="Name"></Column>*/}
            {/*<Column*/}
            {/*    field="category"*/}
            {/*    header="Category"*/}
            {/*></Column>*/}
            {/*<Column*/}
            {/*    field="quantity"*/}
            {/*    header="Quantity"*/}
            {/*></Column>*/}
            <div className="card">
                <DataTable
                    value={tableData}
                    selectionMode={
                        rowClick ? undefined : 'multiple'
                    }
                    selection={selectedProducts!}
                    onSelectionChange={(e) => {
                        const value = e.value as any;
                        const amount = value.amount;
                        const ourProduct =
                            selectedProducts?.map((prod) => {
                                if (prod.amount === amount) {
                                }
                            });

                        console.log('our value: ', value);
                        setSelectedProducts(value);
                    }}
                    dataKey="id"
                    tableStyle={{ minWidth: '50rem' }}
                >
                    {/*<Column*/}
                    {/*    key={'checkboxPaid'}*/}
                    {/*    selectionMode="multiple"*/}
                    {/*    headerStyle={{ width: '3rem' }}*/}
                    {/*></Column>*/}

                    {columns.map((column, index) =>
                        column.field === 'checkbox' ? (
                            <Column
                                key={index}
                                selectionMode="multiple"
                                header={column.header}
                                headerStyle={{
                                    width: '3rem',
                                }}
                                headerClassName={
                                    styles.paidHeader
                                }
                            ></Column>
                        ) : (
                            <Column
                                key={index}
                                field={column.field}
                                header={column.header}
                            ></Column>
                        ),
                    )}
                </DataTable>
            </div>
        </div>
    );
};

export default MonthlyBills;
