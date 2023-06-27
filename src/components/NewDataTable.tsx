import { Column, ColumnEvent } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import {
    cellEditor,
    isRowSelectable,
    onCellEditComplete,
    priceBodyTemplate,
    priceFields,
    rowClassName,
} from '@/lib/dataTableHelpers';
import styles from '@/components/component.module.css';
import {
    GlobalContext,
    SingleSpendingItemType,
} from '@/lib/hooks/globalContext';
import { useContext, useEffect, useState } from 'react';
import { boolean } from 'zod';

export type OnCellEditComplete = (event: ColumnEvent) => void;
export interface NewDataTableProps {
    columns: any[];
    tableData: any;
    tableHeader?: string;
    styles: {
        parentDiv: string;
        tableHeader: string;
        tableBody: Record<string, any>;
        columnStyle: Record<string, any>;
    };
    ourOnCellEditComplete?: OnCellEditComplete;
    selectedProducts?: SingleSpendingItemType[] | null;
    setSelectedProducts?: (
        value: SingleSpendingItemType[],
    ) => void;
    disableCellEditing?: boolean;
    tabIndex?: number;
}

export interface ColumnMeta {
    field: string;
    header: string;
}

const NewDataTable = ({ ...props }: NewDataTableProps) => {
    const [state, dispatch] = useContext(GlobalContext);
    console.log('our state in data table: ', state);

    const ourOnCellEditComplete =
        props.ourOnCellEditComplete || onCellEditComplete;

    const selectedProdInitialState = props.tableData
        ? props.tableData.filter(
              (item: SingleSpendingItemType) =>
                  item.isSelected === true,
          )
        : null;

    const [selectedProducts, setSelectedProducts] = useState<
        SingleSpendingItemType[] | null
    >(selectedProdInitialState);

    useEffect(() => {
        console.log('our tab index: ', props.tabIndex);
        console.log(
            'our selected products: ',
            selectedProducts,
        );
        if (props.tabIndex) {
            const payload = {
                tabIndex: props.tabIndex,
                selectedProducts,
            };
            // setSelectedProducts(selectedProducts);
            dispatch({
                type: 'UPDATE_MONTHLY_BILL_ITEM_IS_PAID',
                payload: payload,
            });
        }
    }, [selectedProducts]);

    return (
        <div className={props.styles.parentDiv}>
            {props.tableHeader && (
                <h2 className={props.styles.tableHeader}>
                    {props.tableHeader}
                </h2>
            )}
            <DataTable
                value={props.tableData}
                editMode="cell"
                tableStyle={props.styles.tableBody}
                isDataSelectable={isRowSelectable}
                rowClassName={rowClassName}
                selection={selectedProducts!}
                selectionMode="checkbox"
                onSelectionChange={(e) => {
                    console.log(
                        'our e in selection change:  ',
                        e.value,
                    );
                    if (props.tabIndex) {
                        const selectedProducts =
                            e.value as SingleSpendingItemType[];
                        const existingMonthlyBills =
                            state.payPeriods[props.tabIndex]
                                .payPeriodProps
                                .monthlyBillsItems;

                        for (const billIdx in existingMonthlyBills) {
                            const billIsSelected =
                                selectedProducts.some(
                                    (
                                        selected: SingleSpendingItemType,
                                    ) =>
                                        selected.id ===
                                        existingMonthlyBills[
                                            billIdx
                                        ].id,
                                );

                            if (billIsSelected) {
                                existingMonthlyBills[
                                    billIdx
                                ].isSelected = true;
                            } else {
                                existingMonthlyBills[
                                    billIdx
                                ].isSelected = false;
                            }
                        }

                        const payload = {
                            tabIndex: props.tabIndex,
                            existingMonthlyBills,
                        };

                        dispatch({
                            type: 'UPDATE_MONTHLY_BILL_ITEM_IS_PAID',
                            payload: payload,
                        });
                    }
                    // const ourItem =
                    //     e.value as SingleSpendingItemType[];
                    // const itemExists = checkIdExists(
                    //     ourItem,
                    //     selectedProducts,
                    // );
                    // console.log(
                    //     'our item exists: ',
                    //     itemExists,
                    // );
                    // if (
                    //     // props.setSelectedProducts &&
                    //     setSelectedProducts &&
                    //     !itemExists &&
                    //     e.type !== 'row'
                    // ) {
                    //     const value =
                    //         e.value as SingleSpendingItemType[];
                    //     console.log('our new value: ', value);
                    //     // props.setSelectedProducts(value);
                    //     setSelectedProducts(value);
                    // }

                    // if (props.tabIndex) {
                    //     const isItemPaid =
                    //         state.payPeriods[props.tabIndex]
                    //             .payPeriodProps
                    //             .monthlyBillsItems;
                    //     const payload = {
                    //         tabIndex: props.tabIndex,
                    //         selectedProducts,
                    //     };
                    //     // setSelectedProducts(selectedProducts);
                    //     dispatch({
                    //         type: 'UPDATE_MONTHLY_BILL_ITEM_IS_PAID',
                    //         payload: payload,
                    //     });
                    // }
                }}
            >
                {props.columns.map(
                    ({ field, header }: ColumnMeta) => {
                        const cellEditingDisabled =
                            props.disableCellEditing
                                ? 'p-disabled'
                                : '';

                        return field !== 'checkbox' ? (
                            <Column
                                key={field}
                                field={field}
                                header={header}
                                style={props.styles.columnStyle}
                                body={
                                    priceFields.includes(
                                        field,
                                    ) && priceBodyTemplate
                                }
                                editor={(options) =>
                                    cellEditor(options)
                                }
                                onCellEditComplete={
                                    ourOnCellEditComplete
                                }
                                className={cellEditingDisabled}
                            />
                        ) : (
                            <Column
                                key={field}
                                selectionMode="multiple"
                                header={header}
                                headerStyle={{
                                    width: '3rem',
                                }}
                                headerClassName={
                                    styles.paidHeader
                                }
                            ></Column>
                        );
                    },
                )}
            </DataTable>
        </div>
    );
};

export default NewDataTable;
