export function normalizeCourseThumbnailUrl(value?: string | null) {
    if (!value) return null;
    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }
    if (value.startsWith('/files/')) return value;
    if (value.startsWith('files/')) return `/${value}`;
    if (value.startsWith('/storage/')) return value;
    if (value.startsWith('storage/')) return `/${value}`;
    return `/storage/${value.replace(/^\/+/, '')}`;
}
