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
      <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
        <div className="flex flex-col items-center justify-center py-14 px-6">
          <div className="w-14 h-14 bg-brand-paper border border-brand-line rounded-xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm text-brand-muted font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-brand-line overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-line bg-brand-paper/70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left text-[11px] font-bold text-brand-navy uppercase tracking-widest px-5 py-3.5 ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-brand-paper/50 transition-colors duration-100">
                {columns.map((col) => (
                  <td key={col.key} className={`px-5 py-3.5 text-sm text-brand-body ${col.className || ""}`}>
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
