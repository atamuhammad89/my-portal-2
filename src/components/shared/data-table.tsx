import type { ReactNode } from "react";

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

type DataTableProps<T extends { id: string }> = {
  columns: Column<T>[];
  rows: T[];
};

export function DataTable<T extends { id: string }>({ columns, rows }: DataTableProps<T>) {
  return (
    <div className="premium-table-container">
      <table className="premium-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => {
                const value = row[column.key];
                return (
                  <td key={String(column.key)}>
                    {column.render ? column.render(value, row) : String(value ?? "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
