import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import {
    cellEditor,
    isRowSelectable,
    onCellEditComplete,
    priceBodyTemplate,
    rowClassName,
} from '@/lib/dataTableHelpers';

export interface NewDataTableProps {
    columns: any[];
    tableData: any;
    tableHeader: string;
    styles: {
        parentDiv: string;
        tableHeader: string;
        tableBody: Record<string, any>;
        columnStyle: Record<string, any>;
    };
}

export interface ColumnMeta {
    field: string;
    header: string;
}

const NewDataTable = ({ ...props }: NewDataTableProps) => {
    console.log('our props in new table: ', props);

    return (
        <div className={props.styles.parentDiv}>
            <h2 className={props.styles.tableHeader}>
                props.tableHeader
            </h2>
            <DataTable
                value={props.tableData}
                editMode="cell"
                tableStyle={props.styles.tableBody}
                isDataSelectable={isRowSelectable}
                rowClassName={rowClassName}
            >
                {props.columns.map(
                    ({ field, header }: ColumnMeta) => {
                        return (
                            <Column
                                key={field}
                                field={field}
                                header={header}
                                style={
                                    field === 'name'
                                        ? {
                                              ...props.styles
                                                  .columnStyle,
                                              textAlign:
                                                  'right',
                                          }
                                        : props.styles
                                              .columnStyle
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
                    },
                )}
            </DataTable>
        </div>
    );
};

export default NewDataTable;
