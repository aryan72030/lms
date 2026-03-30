import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search, Filter, BookOpen, User, Clock, Star, Eye, Heart } from 'lucide-react';
import { useState } from 'react';
import EnrollmentButton from '@/components/enrollment/enrollment-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaginationLinks } from '@/components/ui/pagination-links';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface Course {
    id: number;
    title: string;
    slug: string;
    description: string;
    price: number;
    duration_hours: number;
    difficulty_level: string;
    thumbnail: string | null;
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

export default function Index({ courses, categories, difficulties, wishlist_ids = [], filters }: Props) {
    const { auth } = usePage().props as any;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category_id || 'all');
    const [priceFilter, setPriceFilter] = useState(filters.price_filter || 'all');
    const [difficultyFilter, setDifficultyFilter] = useState(filters.difficulty || 'all');

    const handleSearch = () => {
        router.get('/student/courses', {
            search: searchTerm || undefined,
            category_id: categoryFilter === 'all' ? undefined : categoryFilter,
            price_filter: priceFilter === 'all' ? undefined : priceFilter,
            difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const toggleWishlist = (courseId: number) => {
        router.post('/student/wishlist/toggle', {
            course_id: courseId
        }, {
            preserveScroll: true
        });
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
            case 'Beginner': return 'bg-green-100 text-green-800';
            case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'Advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEnrollmentStatusBadge = (enrollmentStatus: any) => {
        if (!enrollmentStatus) {
            return null;
        }
        
        if (enrollmentStatus.payment_status === 'Pending') {
            return <Badge variant="outline">Payment Pending</Badge>;
        }
        
        if (enrollmentStatus.status === 'Active') {
            return <Badge className="bg-blue-100 text-blue-800">Enrolled</Badge>;
        }
        
        return <Badge variant="secondary">Enrolled</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/student/dashboard' },
            { title: 'Course Catalog', href: '/student/courses' }
        ]}>
            <Head title="Browse Courses" />

            <div className="space-y-10 pb-12">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white md:p-12 shadow-2xl">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl space-y-4">
                            <Badge className="bg-indigo-500 text-white border-none px-3 py-1">
                                Course Catalog
                            </Badge>
                            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                                What will you <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">learn today?</span>
                            </h1>
                            <p className="text-lg text-slate-300 max-w-md">
                                Explore over {courses.meta?.total || 0} professional courses from top instructors across the globe.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="h-48 w-48 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-3xl border border-white/10 flex items-center justify-center rotate-6 animate-pulse">
                                <BookOpen className="h-24 w-24 text-indigo-400 opacity-40" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl"></div>
                </div>

                {/* Filters Section - Modern Floating Bar */}
                <div className="sticky top-4 z-40">
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-200">
                        <CardContent className="p-4">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <Input
                                        placeholder="Search for courses, skills, or instructors..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-11 h-12 bg-slate-50 border-none ring-0 focus-visible:ring-2 focus-visible:ring-indigo-500 text-base rounded-xl"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-[180px] h-12 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                                        <SelectTrigger className="w-[160px] h-12 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                                            <SelectValue placeholder="All Levels" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="all">All Levels</SelectItem>
                                            {Object.entries(difficulties).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2 ml-auto">
                                        <Button onClick={handleSearch} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
                                            Search
                                        </Button>
                                        <Button variant="outline" onClick={clearFilters} className="h-12 px-6 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">
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
                        <h2 className="text-2xl font-black text-slate-800">
                            {courses.meta?.total || 0} Courses Found
                        </h2>
                        <Link href="/student/wishlist">
                            <Button variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold rounded-xl">
                                <Heart className="h-5 w-5 mr-2 fill-current" />
                                View Wishlist
                            </Button>
                        </Link>
                    </div>

                    {courses.data.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {courses.data.map((course) => {
                                const isWishlisted = wishlist_ids.includes(course.id);
                                return (
                                    <Card key={course.id} className="group border-none shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white rounded-3xl flex flex-col">
                                        {/* Thumbnail with Overlay */}
                                        <div className="relative aspect-video overflow-hidden bg-slate-100">
                                            {course.thumbnail ? (
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
                                                    <BookOpen className="h-16 w-16" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                                {getEnrollmentStatusBadge(course.enrollment_status)}
                                            </div>
                                            <div className="absolute top-4 right-4 z-10">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={() => toggleWishlist(course.id)}
                                                    className={cn(
                                                        "h-10 w-10 rounded-full shadow-lg border-none transition-all duration-300",
                                                        isWishlisted 
                                                            ? "bg-white text-rose-600 scale-110" 
                                                            : "bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white backdrop-blur-sm"
                                                    )}
                                                >
                                                    <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                                                </Button>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                                <Link href={`/student/courses/${course.id}`} className="w-full">
                                                    <Button className="w-full bg-white text-slate-900 hover:bg-white/90 font-bold rounded-xl shadow-xl">
                                                        Quick View
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>

                                        <CardHeader className="pb-3 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-bold text-[10px] uppercase tracking-wider">
                                                    {course.category.name}
                                                </Badge>
                                                <Badge className={`border-none font-bold text-[10px] uppercase tracking-wider ${getDifficultyBadgeColor(course.difficulty_level)}`}>
                                                    {course.difficulty_level}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-xl font-bold text-slate-800 line-clamp-2 min-h-[3.5rem] group-hover:text-indigo-600 transition-colors">
                                                {course.title}
                                            </CardTitle>
                                            <div className="flex items-center gap-3 pt-1">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                                                    {course.instructor.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-600">
                                                    {course.instructor.name}
                                                </span>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                                {course.description}
                                            </p>

                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-y border-slate-50 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    {course.duration_hours} Hours
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                                    4.8 (1.2k)
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Price</span>
                                                    <span className="text-2xl font-black text-slate-900">
                                                        {Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : 'Free'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link href={`/student/courses/${course.id}`}>
                                                        <Button variant="outline" className="h-12 px-5 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">
                                                            Details
                                                        </Button>
                                                    </Link>
                                                    <EnrollmentButton 
                                                        course={{
                                                            id: course.id,
                                                            title: course.title,
                                                            price: course.price,
                                                            status: 'Published'
                                                        }}
                                                        user={auth.user}
                                                        variant="simple"
                                                        initialEnrollment={course.enrollment_status}
                                                        className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-105"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-100">
                            <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                                <Search className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">No courses match your search</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-8 font-medium">
                                Try adjusting your filters or search terms to find what you're looking for.
                            </p>
                            <Button variant="outline" onClick={clearFilters} className="h-12 px-8 font-bold rounded-xl">
                                Reset All Filters
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="pt-10 flex justify-center">
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
