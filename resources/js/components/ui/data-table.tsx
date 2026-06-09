import React from 'react';
import { PaginationLinkItem, PaginationLinks } from '@/components/ui/pagination-links';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import './data-table.css'; // Import the new CSS file

interface Column {
    key: string;
    label: string;
    className?: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    title?: string;
    emptyMessage?: string;
    emptyAction?: React.ReactNode;
    className?: string;
    paginationLinks?: PaginationLinkItem[];
    onPageChange?: (url: string) => void;
}

export function DataTable({
    columns,
    data = [], 
    title,
    emptyMessage = "No data found",
    emptyAction,
    className = "",
    paginationLinks = [],
    onPageChange,
}: DataTableProps) {
    return (
        <div className={`space-y-6 custom-data-table ${className}`}>
            <Card className="p-0 border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                    <div className="bg-white shadow-sm border border-slate-100 rounded-2xl overflow-hidden">
                        {title && (
                            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                            </div>
                        )}
                        
                        <div className="p-0">
                            {data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                {columns.map((column) => (
                                                    <th
                                                        key={column.key}
                                                        className={`px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider ${column.className || ''}`}
                                                    >
                                                        {column.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-50">
                                            {data.map((row, index) => (
                                                <tr key={row.id || index} className="hover:bg-slate-50/80 transition-colors group">
                                                    {columns.map((column) => (
                                                        <td
                                                            key={column.key}
                                                            className={`px-6 py-4 whitespace-nowrap text-sm text-slate-600 ${column.className || ''}`}
                                                        >
                                                            {column.render 
                                                                ? column.render(row[column.key], row)
                                                                : row[column.key]
                                                            }
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-slate-50/20">
                                    <p className="text-slate-400 font-medium mb-6">{emptyMessage}</p>
                                    {emptyAction}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {data.length > 0 && onPageChange ? (
                <div className="px-2">
                    <PaginationLinks links={paginationLinks} onPageChange={onPageChange} />
                </div>
            ) : null}
        </div>
    );
}
