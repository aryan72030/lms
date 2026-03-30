import React from 'react';
import { PaginationLinkItem, PaginationLinks } from '@/components/ui/pagination-links';

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
    data, 
    title, 
    emptyMessage = "No data found", 
    emptyAction,
    className = "",
    paginationLinks = [],
    onPageChange,
}: DataTableProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {title && (
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    </div>
                )}
                
                {data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column.key}
                                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                                        >
                                            {column.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((row, index) => (
                                    <tr key={row.id || index} className="hover:bg-gray-50">
                                        {columns.map((column) => (
                                            <td
                                                key={column.key}
                                                className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
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
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">{emptyMessage}</p>
                        {emptyAction}
                    </div>
                )}
            </div>

            {data.length > 0 && onPageChange ? (
                <PaginationLinks links={paginationLinks} onPageChange={onPageChange} />
            ) : null}
        </div>
    );
}
