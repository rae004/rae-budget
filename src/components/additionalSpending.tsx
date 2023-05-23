'use client';
import { FC, useState } from 'react';
import convertNumberToCurrencyString from '@/lib/convertNumberToCurrencyString';
import TwoColumnDataTableTextAndCurrency from '@/components/twoColumnDataTableTextAndCurrency';

export interface DataTableItem {
    text: string;
    currency: number;
}

const AdditionalSpending: FC = () => {
    const [text, setText] = useState('');
    const [currency, setCurrency] = useState(0);
    const [dataTable, setDataTable] = useState<DataTableItem[]>(
        [],
    );

    const totalAdditionalSpending = dataTable.reduce(
        (total, item) => {
            total += item.currency;
            return total;
        },
        0,
    );
    console.log(totalAdditionalSpending);

    const handleAddButtonClick = () => {
        const newItem: DataTableItem = { text, currency };
        setDataTable([...dataTable, newItem]);
        setText('');
        setCurrency(0);
    };

    return (
        <div className="container mx-auto">
            <div className="w-full flex justify-start items-start mb-4">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="mr-2 p-2 border text-white dark:text-black w-full"
                    placeholder={'Name'}
                />
                <input
                    type="number"
                    value={currency}
                    onChange={(e) =>
                        setCurrency(parseFloat(e.target.value))
                    }
                    className="mr-2 p-2 border text-white dark:text-black w-5/6"
                />
                <button
                    onClick={handleAddButtonClick}
                    className="p-2 bg-blue-500 text-white"
                >
                    Add
                </button>
            </div>

            <TwoColumnDataTableTextAndCurrency
                dataTable={dataTable}
            />
        </div>
    );
};

export default AdditionalSpending;
