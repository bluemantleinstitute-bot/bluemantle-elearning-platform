import { cn } from "@/lib/utils";

interface Column {
  key: string;
  header: string;
  render?: (val: any, row: any) => React.ReactNode;
}

export function DataTable({ 
  columns, 
  data,
  className
}: { 
  columns: Column[]; 
  data: any[];
  className?: string;
}) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-outline_variant/30">
            {columns.map((c) => (
              <th 
                key={c.key} 
                className="py-4 px-4 text-xs font-semibold text-outline uppercase tracking-[0.05em]"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr 
              key={i} 
              className="group border-b border-outline_variant/10 hover:bg-surface_container_low transition-colors duration-200"
            >
              {columns.map((c) => (
                <td key={c.key} className="py-4 px-4 text-sm text-on_surface_variant group-hover:text-on_surface transition-colors">
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
