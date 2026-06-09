import React from 'react';
import { Button } from '@/components/ui/button';

export interface PaginationLinkItem {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationLinksProps {
    links?: PaginationLinkItem[];
    onPageChange: (url: string) => void;
}

export function PaginationLinks({ links = [], onPageChange }: PaginationLinksProps) {
    if (!links.length) {
        return null;
    }

    return (
        <div className="flex justify-end mt-4">
            <div className="flex flex-wrap gap-2">
                {links.map((link, index) => (
                    <Button
                        key={`${link.label}-${index}`}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        disabled={!link.url}
                        onClick={() => link.url && onPageChange(link.url)}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}
