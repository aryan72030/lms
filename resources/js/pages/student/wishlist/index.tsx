import { Head, Link, router } from '@inertiajs/react';
import { Heart, Trash2, BookOpen, Clock, User, ArrowRight, Search, ShoppingBag, Filter, Star } from 'lucide-react';
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

    const filteredWishlist = wishlist.filter(item => 
        item.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRemove = () => {
        if (!itemToRemove) return;

        router.delete(`/student/wishlist/${itemToRemove.id}`, {
            onFinish: () => setItemToRemove(null),
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/student/dashboard' },
            { title: 'Wishlist', href: '/student/wishlist' }
        ]}>
            <Head title="My Wishlist" />

            <div className="space-y-10 pb-12">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white md:p-12 shadow-2xl">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl space-y-4">
                            <Badge className="bg-rose-500 text-white border-none px-3 py-1">
                                Saved for Later
                            </Badge>
                            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400">Wishlist</span>
                            </h1>
                            <p className="text-lg text-slate-300 max-w-md">
                                Keep track of courses you're interested in and enroll when you're ready.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="h-48 w-48 rounded-3xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-3xl border border-white/10 flex items-center justify-center -rotate-12 animate-pulse">
                                <Heart className="h-24 w-24 text-rose-400 opacity-40 fill-current" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-rose-600/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-pink-600/10 blur-3xl"></div>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="md:col-span-3 border-none shadow-xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-200">
                        <CardContent className="p-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-rose-600 transition-colors" />
                                <Input
                                    placeholder="Search your wishlist..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 h-12 bg-slate-50 border-none ring-0 focus-visible:ring-2 focus-visible:ring-rose-500 text-base rounded-xl"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl bg-rose-500 text-white rounded-2xl">
                        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                            <span className="text-xs font-black uppercase tracking-widest opacity-80">Saved Items</span>
                            <span className="text-3xl font-black">{wishlist.length}</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Wishlist Grid */}
                <div className="space-y-8">
                    {filteredWishlist.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredWishlist.map((item) => (
                                <Card key={item.id} className="group border-none shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white rounded-3xl flex flex-col">
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                                        {item.course.thumbnail ? (
                                            <img
                                                src={item.course.thumbnail}
                                                alt={item.course.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
                                                <BookOpen className="h-16 w-16" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 z-10">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => setItemToRemove(item)}
                                                className="h-10 w-10 rounded-full shadow-lg bg-white text-rose-600 hover:bg-rose-50 border-none transition-transform hover:scale-110"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                            <Link href={`/student/courses/${item.course.id}`} className="w-full">
                                                <Button className="w-full bg-white text-slate-900 hover:bg-white/90 font-bold rounded-xl shadow-xl">
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    <CardHeader className="pb-3 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-bold text-[10px] uppercase tracking-wider">
                                                {item.course.category.name}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl font-bold text-slate-800 line-clamp-2 min-h-[3.5rem] group-hover:text-rose-600 transition-colors">
                                            {item.course.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-3 pt-1">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                {item.course.instructor.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600">
                                                {item.course.instructor.name}
                                            </span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                            {item.course.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Price</span>
                                                <span className="text-2xl font-black text-slate-900">
                                                    {Number(item.course.price) > 0 ? `$${Number(item.course.price).toFixed(2)}` : 'Free'}
                                                </span>
                                            </div>
                                            <Link href={`/student/courses/${item.course.id}`}>
                                                <Button className="h-12 px-8 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-lg shadow-rose-100 transition-all hover:scale-105 active:scale-95">
                                                    Enroll Now
                                                    <ArrowRight className="h-5 w-5 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-100">
                            <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                                <Heart className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">Your wishlist is empty</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-8 font-medium">
                                Find courses you love and save them here for later.
                            </p>
                            <Link href="/student/courses">
                                <Button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">
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
