import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Search,
    Filter,
    BookOpen,
    User,
    Clock,
    Star,
    Eye,
    Heart,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import EnrollmentButton from '@/components/enrollment/enrollment-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaginationLinks } from '@/components/ui/pagination-links';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn, formatDuration } from '@/lib/utils';

interface Course {
    id: number;
    title: string;
    slug: string;
    description: string;
    price: number;
    duration_hours: number;
    difficulty_level: string;
    thumbnail: string | null;
    average_rating: number;
    reviews_count: number;
    instructor: {
        id: number;
        name: string;
    };
    category: {
        id: number;
        name: string;
    };
    enrollment_status?: {
        id: number;
        payment_status: string;
        status: string;
        progress: number | string | null;
        completion_date: string | null;
        formatted_expiry_date?: string;
        days_left?: number;
        is_expired?: boolean;
    } | null;
    created_at: string;
}

interface Props {
    courses: {
        data: Course[];
        links: any[];
        meta: any;
    };
    categories: Array<{ id: number; name: string }>;
    difficulties: Record<string, string>;
    wishlist_ids: number[];
    filters: {
        search?: string;
        category_id?: string;
        price_filter?: string;
        difficulty?: string;
    };
}

export default function Index({
    courses,
    categories,
    difficulties,
    wishlist_ids = [],
    filters,
}: Props) {
    const { auth } = usePage().props as any;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(
        filters.category_id || 'all',
    );
    const [priceFilter, setPriceFilter] = useState(
        filters.price_filter || 'all',
    );
    const [difficultyFilter, setDifficultyFilter] = useState(
        filters.difficulty || 'all',
    );

    const handleSearch = useCallback(() => {
        router.get(
            '/student/courses',
            {
                search: searchTerm || undefined,
                category_id:
                    categoryFilter === 'all' ? undefined : categoryFilter,
                price_filter: priceFilter === 'all' ? undefined : priceFilter,
                difficulty:
                    difficultyFilter === 'all' ? undefined : difficultyFilter,
            },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            },
        );
    }, [searchTerm, categoryFilter, priceFilter, difficultyFilter]);

    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== (filters.search || '')) {
                handleSearch();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Instant search for filters
    useEffect(() => {
        if (
            categoryFilter !== (filters.category_id || 'all') ||
            priceFilter !== (filters.price_filter || 'all') ||
            difficultyFilter !== (filters.difficulty || 'all')
        ) {
            handleSearch();
        }
    }, [categoryFilter, priceFilter, difficultyFilter]);

    const toggleWishlist = (courseId: number) => {
        router.post(
            '/student/wishlist/toggle',
            {
                course_id: courseId,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('all');
        setPriceFilter('all');
        setDifficultyFilter('all');
        router.get('/student/courses');
    };

    const getDifficultyBadgeColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner':
                return 'bg-green-100 text-green-800';
            case 'Intermediate':
                return 'bg-yellow-100 text-yellow-800';
            case 'Advanced':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getEnrollmentStatusBadge = (enrollmentStatus: any) => {
        if (!enrollmentStatus) {
            return null;
        }

        if (enrollmentStatus.payment_status === 'Pending') {
            return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Payment Pending</Badge>;
        }

        if (enrollmentStatus.status === 'Active') {
            return (
                <div className="flex flex-col gap-1">
                    <Badge className="bg-emerald-500 text-white border-none">Enrolled</Badge>
                    {enrollmentStatus.formatted_expiry_date && (
                        <Badge variant="outline" className={cn(
                            "text-[10px] font-bold backdrop-blur-md border-none",
                            enrollmentStatus.is_expired ? "bg-rose-500/80 text-white" : 
                            (enrollmentStatus.days_left <= 7 ? "bg-amber-500/80 text-white" : "bg-white/80 text-indigo-600")
                        )}>
                            {enrollmentStatus.is_expired ? 'Expired' : `${enrollmentStatus.days_left} days left`}
                        </Badge>
                    )}
                </div>
            );
        }

        if (enrollmentStatus.status === 'Refunded' || enrollmentStatus.status === 'Cancelled') {
            return null;
        }

        if (enrollmentStatus.status === 'Refund Requested') {
            return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Refund Pending</Badge>;
        }

        return <Badge variant="secondary">Enrolled</Badge>;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'Courses', href: '/student/courses' },
            ]}
        >
            <Head title="Browse Courses" />

            <div className="space-y-10 pb-12">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl md:p-12">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl space-y-4">
                            <Badge className="border-none bg-indigo-500 px-3 py-1 text-white">
                                Courses
                            </Badge>
                            <h1 className="page-title">
                                What will you{' '}
                                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                                    learn today?
                                </span>
                            </h1>
                            <p className="max-w-md text-lg text-slate-300">
                                Explore over {courses.meta?.total || 0}{' '}
                                professional courses from top instructors across
                                the globe.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="flex h-48 w-48 rotate-6 animate-pulse items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-3xl">
                                <BookOpen className="h-24 w-24 text-indigo-400 opacity-40" />
                            </div>
                        </div>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl"></div>
                </div>

                {/* Filters Section - Modern Floating Bar */}
                <div className="sticky top-4 z-40">
                    <Card className="border-none bg-white/80 shadow-xl ring-1 ring-slate-200 backdrop-blur-xl">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4 lg:flex-row">
                                <div className="group relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                                    <Input
                                        placeholder="Search for courses, skills, or instructors..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="h-12 rounded-xl border-none bg-slate-50 pl-11 text-base ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500"
                                        onKeyPress={(e) =>
                                            e.key === 'Enter' && handleSearch()
                                        }
                                    />
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Select
                                        value={categoryFilter}
                                        onValueChange={setCategoryFilter}
                                    >
                                        <SelectTrigger className="h-12 w-[180px] rounded-xl border-none bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500">
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="all">
                                                All Categories
                                            </SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id.toString()}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={difficultyFilter}
                                        onValueChange={setDifficultyFilter}
                                    >
                                        <SelectTrigger className="h-12 w-[160px] rounded-xl border-none bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500">
                                            <SelectValue placeholder="All Levels" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="all">
                                                All Levels
                                            </SelectItem>
                                            {Object.entries(difficulties).map(
                                                ([key, label]) => (
                                                    <SelectItem
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <div className="ml-auto flex gap-2">
                                        <Button
                                            onClick={handleSearch}
                                            className="h-12 rounded-xl bg-indigo-600 px-6 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:scale-105 hover:bg-indigo-700 active:scale-95"
                                        >
                                            Search
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={clearFilters}
                                            className="h-12 rounded-xl border-slate-200 px-6 font-bold text-slate-600 hover:bg-slate-50"
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Course Grid Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800">
                            Courses
                        </h2>
                        <Link href="/student/wishlist">
                            <Button
                                variant="ghost"
                                className="rounded-xl font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                                <Heart className="mr-2 h-5 w-5 fill-current" />
                                View Wishlist
                            </Button>
                        </Link>
                    </div>

                    {courses.data.length > 0 ? (
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                            {courses.data.map((course) => {
                                const isWishlisted = wishlist_ids.includes(
                                    course.id,
                                );
                                return (
                                    <Card
                                        key={course.id}
                                        className="group flex flex-col overflow-hidden rounded-3xl border-none bg-white shadow-md transition-all duration-500 hover:shadow-2xl"
                                    >
                                        {/* Thumbnail with Overlay */}
                                        <div className="relative aspect-video overflow-hidden bg-slate-100">
                                            {course.thumbnail ? (
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-200">
                                                    <BookOpen className="h-16 w-16" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                                {getEnrollmentStatusBadge(
                                                    course.enrollment_status,
                                                )}
                                            </div>
                                            <div className="absolute top-4 right-4 z-10">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={() =>
                                                        toggleWishlist(
                                                            course.id,
                                                        )
                                                    }
                                                    className={cn(
                                                        'h-10 w-10 rounded-full border-none shadow-lg transition-all duration-300',
                                                        isWishlisted
                                                            ? 'scale-110 bg-white text-rose-600'
                                                            : 'bg-white/80 text-slate-400 backdrop-blur-sm hover:bg-white hover:text-rose-500',
                                                    )}
                                                >
                                                    <Heart
                                                        className={cn(
                                                            'h-5 w-5',
                                                            isWishlisted &&
                                                                'fill-current',
                                                        )}
                                                    />
                                                </Button>
                                            </div>
                                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                                <Link
                                                    href={`/student/courses/${course.id}`}
                                                    className="w-full"
                                                >
                                                    <Button className="w-full rounded-xl bg-white font-bold text-slate-900 shadow-xl hover:bg-white/90">
                                                        Quick View
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>

                                        <CardHeader className="space-y-3 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="border-none bg-indigo-50 text-[10px] font-bold tracking-wider text-indigo-600 uppercase"
                                                >
                                                    {course.category.name}
                                                </Badge>
                                                <Badge
                                                    className={`border-none text-[10px] font-bold tracking-wider uppercase ${getDifficultyBadgeColor(course.difficulty_level)}`}
                                                >
                                                    {course.difficulty_level}
                                                </Badge>
                                            </div>
                                            <CardTitle className="line-clamp-2 min-h-[3.5rem] text-xl font-bold text-slate-800 transition-colors group-hover:text-indigo-600">
                                                {course.title}
                                            </CardTitle>
                                            <div className="flex items-center gap-3 pt-1">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500">
                                                    {course.instructor.name.charAt(
                                                        0,
                                                    )}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-600">
                                                    {course.instructor.name}
                                                </span>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex flex-grow flex-col justify-between space-y-6">
                                            <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-slate-500">
                                                {course.description}
                                            </p>

                                            <div className="flex items-center gap-4 border-y border-slate-50 py-3 text-xs font-bold text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    {formatDuration(course.duration_hours)}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Star className={cn("h-4 w-4", course.average_rating > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                                                    {course.average_rating > 0 ? `${course.average_rating} (${course.reviews_count})` : 'New'}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                        Price
                                                    </span>
                                                    <span className={cn(
                                                        "text-2xl font-black",
                                                        Number(course.price) === 0 ? "text-emerald-600" : "text-slate-900"
                                                    )}>
                                                        {Number(course.price) >
                                                        0
                                                            ? `$${Number(course.price).toFixed(2)}`
                                                            : 'Free'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={`/student/courses/${course.id}`}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            className="h-12 rounded-xl border-slate-200 px-5 font-bold text-slate-600 hover:bg-slate-50"
                                                        >
                                                            Details
                                                        </Button>
                                                    </Link>
                                                    <EnrollmentButton
                                                        course={{
                                                            id: course.id,
                                                            title: course.title,
                                                            price: course.price,
                                                            status: 'Published',
                                                        }}
                                                        user={auth.user}
                                                        variant="simple"
                                                        initialEnrollment={
                                                            course.enrollment_status
                                                        }
                                                        className={cn(
                                                            "h-12 rounded-xl px-6 font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95",
                                                            course.enrollment_status?.status === 'Active' 
                                                                ? "bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700" 
                                                                : "bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-3xl border-2 border-dashed border-slate-100 bg-white py-24 text-center shadow-sm">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
                                <Search className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">
                                No courses match your search
                            </h3>
                            <p className="mx-auto mt-2 mb-8 max-w-xs font-medium text-slate-500">
                                Try adjusting your filters or search terms to
                                find what you're looking for.
                            </p>
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="h-12 rounded-xl px-8 font-bold"
                            >
                                Reset All Filters
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex justify-end pt-10">
                        <PaginationLinks
                            links={courses.links}
                            onPageChange={(url) => router.get(url)}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
