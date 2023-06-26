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
import { SingleSpendingItemType } from '@/lib/hooks/globalContext';

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
}

export interface ColumnMeta {
    field: string;
    header: string;
}

const NewDataTable = ({ ...props }: NewDataTableProps) => {
    const ourOnCellEditComplete =
        props.ourOnCellEditComplete || onCellEditComplete;

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
                selection={props.selectedProducts!}
                selectionMode="single"
                onSelectionChange={(e) => {
                    if (props.setSelectedProducts) {
                        const value =
                            e.value as SingleSpendingItemType[];
                        props.setSelectedProducts(value);
                    }
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
