"use client";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

export default function DataTable({ columns, data, emptyMessage = "No data found" }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-gray-50/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 text-sm ${col.className || ""}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
