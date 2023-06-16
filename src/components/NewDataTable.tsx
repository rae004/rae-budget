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
}

export interface ColumnMeta {
    field: string;
    header: string;
    useCheckbox?: boolean;
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
            >
                {props.columns.map(
                    ({
                        field,
                        header,
                        useCheckbox,
                    }: ColumnMeta) => {
                        return useCheckbox ? (
                            <Column
                                key={field}
                                field={field}
                                header={header}
                                selectionMode="multiple"
                            />
                        ) : (
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
                            />
                        );
                    },
                )}
            </DataTable>
        </div>
    );
};

export default NewDataTable;
