import { Head, Link, router } from '@inertiajs/react';
import {
    Heart,
    Trash2,
    BookOpen,
    Clock,
    User,
    ArrowRight,
    Search,
    ShoppingBag,
    Filter,
    Star,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

interface WishlistItem {
    id: number;
    course: {
        id: number;
        title: string;
        description: string;
        price: number;
        thumbnail: string | null;
        instructor: {
            name: string;
        };
        category: {
            name: string;
        };
    };
}

interface Props {
    wishlist: WishlistItem[];
}

export default function WishlistIndex({ wishlist }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [itemToRemove, setItemToRemove] = useState<WishlistItem | null>(null);

    const filteredWishlist = wishlist.filter(
        (item) =>
            item.course.title
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            item.course.instructor.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const handleRemove = () => {
        if (!itemToRemove) return;

        router.delete(`/student/wishlist/${itemToRemove.id}`, {
            onFinish: () => setItemToRemove(null),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'Wishlist', href: '/student/wishlist' },
            ]}
        >
            <Head title="My Wishlist" />

            <div className="space-y-10 pb-12">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl md:p-12">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl space-y-4">
                            <Badge className="border-none bg-rose-500 px-3 py-1 text-white">
                                Saved for Later
                            </Badge>
                            <h1 className="page-title">
                                My{' '}
                                <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                                    Wishlist
                                </span>
                            </h1>
                            <p className="max-w-md text-lg text-slate-300">
                                Keep track of courses you're interested in and
                                enroll when you're ready.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="flex h-48 w-48 -rotate-12 animate-pulse items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-3xl">
                                <Heart className="h-24 w-24 fill-current text-rose-400 opacity-40" />
                            </div>
                        </div>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-rose-600/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-pink-600/10 blur-3xl"></div>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card className="border-none bg-white/80 shadow-xl ring-1 ring-slate-200 backdrop-blur-xl md:col-span-3">
                        <CardContent className="p-4">
                            <div className="group relative">
                                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-rose-600" />
                                <Input
                                    placeholder="Search your wishlist..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="h-12 rounded-xl border-none bg-slate-50 pl-11 text-base ring-0 focus-visible:ring-2 focus-visible:ring-rose-500"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-none bg-rose-500 text-white shadow-xl">
                        <CardContent className="flex h-full flex-col items-center justify-center p-4">
                            <span className="text-xs font-black tracking-widest uppercase opacity-80">
                                Saved Items
                            </span>
                            <span className="text-3xl font-black">
                                {wishlist.length}
                            </span>
                        </CardContent>
                    </Card>
                </div>

                {/* Wishlist Grid */}
                <div className="space-y-8">
                    {filteredWishlist.length > 0 ? (
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                            {filteredWishlist.map((item) => (
                                <Card
                                    key={item.id}
                                    className="group flex flex-col overflow-hidden rounded-3xl border-none bg-white shadow-md transition-all duration-500 hover:shadow-2xl"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                                        {item.course.thumbnail ? (
                                            <img
                                                src={item.course.thumbnail}
                                                alt={item.course.title}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-200">
                                                <BookOpen className="h-16 w-16" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 z-10">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() =>
                                                    setItemToRemove(item)
                                                }
                                                className="h-10 w-10 rounded-full border-none bg-white text-rose-600 shadow-lg transition-transform hover:scale-110 hover:bg-rose-50"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            <Link
                                                href={`/student/courses/${item.course.id}`}
                                                className="w-full"
                                            >
                                                <Button className="w-full rounded-xl bg-white font-bold text-slate-900 shadow-xl hover:bg-white/90">
                                                    View Details
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
                                                {item.course.category.name}
                                            </Badge>
                                        </div>
                                        <CardTitle className="line-clamp-2 min-h-[3.5rem] text-xl font-bold text-slate-800 transition-colors group-hover:text-rose-600">
                                            {item.course.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-3 pt-1">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                                {item.course.instructor.name.charAt(
                                                    0,
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600">
                                                {item.course.instructor.name}
                                            </span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="flex flex-grow flex-col justify-between space-y-6">
                                        <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
                                            {item.course.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                    Price
                                                </span>
                                                <span className="text-2xl font-black text-slate-900">
                                                    {Number(item.course.price) >
                                                    0
                                                        ? `$${Number(item.course.price).toFixed(2)}`
                                                        : 'Free'}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/student/courses/${item.course.id}`}
                                            >
                                                <Button className="h-12 rounded-xl bg-rose-600 px-8 font-black text-white shadow-lg shadow-rose-100 transition-all hover:scale-105 hover:bg-rose-700 active:scale-95">
                                                    Enroll Now
                                                    <ArrowRight className="ml-2 h-5 w-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border-2 border-dashed border-slate-100 bg-white py-24 text-center shadow-sm">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
                                <Heart className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">
                                Your wishlist is empty
                            </h3>
                            <p className="mx-auto mt-2 mb-8 max-w-xs font-medium text-slate-500">
                                Find courses you love and save them here for
                                later.
                            </p>
                            <Link href="/student/courses">
                                <Button className="h-12 rounded-xl bg-indigo-600 px-8 font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700">
                                    Explore Courses
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!itemToRemove}
                onClose={() => setItemToRemove(null)}
                onConfirm={handleRemove}
                title="Remove from Wishlist"
                description={`Are you sure you want to remove "${itemToRemove?.course.title}" from your wishlist?`}
                confirmText="Remove"
                isDestructive={true}
            />
        </AppLayout>
    );
}
