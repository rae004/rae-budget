'use client';
import { FC, useContext, useEffect, useState } from 'react';
import TwoColumnDataTableTextAndCurrency from '@/components/twoColumnDataTableTextAndCurrency';
import { GlobalContext } from '@/lib/globalContext';

export interface DataTableItem {
    text: string;
    currency: number;
}

const AdditionalSpending: FC = () => {
    const { setGlobalState } = useContext(GlobalContext);
    const [text, setText] = useState('');
    const [currency, setCurrency] = useState(0);
    const [dataTable, setDataTable] = useState<DataTableItem[]>(
        [],
    );

    const getTotalAdditionalSpending = () => {
        return dataTable.reduce((total, item) => {
            total += item.currency;
            return total;
        }, 0);
    };

    const handleAddButtonClick = () => {
        const newItem: DataTableItem = { text, currency };
        setDataTable([...dataTable, newItem]);
        setText('');
        setCurrency(0);
    };

    // update global state total additional spending when dataTable changes
    useEffect(() => {
        const totalAdditionalSpending =
            getTotalAdditionalSpending();
        setGlobalState({
            totalAdditionalSpending,
        });
    }, [dataTable, getTotalAdditionalSpending, setGlobalState]);

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
