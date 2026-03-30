import { Head, Link } from '@inertiajs/react';
import { Award, Download, ExternalLink, Calendar, User, Search, BookOpen, ArrowRight, ShieldCheck, MoreVertical } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

interface Certificate {
    id: number;
    course_title: string;
    instructor_name: string;
    completion_date: string;
    certificate_id: string;
}

interface Props {
    certificates: Certificate[];
}

export default function CertificateIndex({ certificates }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCertificates = certificates.filter(cert => 
        cert.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = (enrollmentId: number) => {
        window.open(`/enrollments/${enrollmentId}/certificate/download`, '_blank');
    };

    const handleView = (enrollmentId: number) => {
        window.open(`/enrollments/${enrollmentId}/certificate/view`, '_blank');
    };

    const handleVerify = (certificateId: string) => {
        window.open(`/verify/${certificateId}`, '_blank');
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/student/dashboard' },
            { title: 'My Certificates', href: '/student/certificates' }
        ]}>
            <Head title="My Certificates" />

            <div className="space-y-10 pb-12">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white md:p-12 shadow-2xl">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl space-y-4">
                            <Badge className="bg-amber-500 text-white border-none px-3 py-1">
                                Academic Achievements
                            </Badge>
                            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">Achievements</span>
                            </h1>
                            <p className="text-lg text-slate-300 max-w-md">
                                All your earned certificates in one place. Proudly display your hard-earned skills.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="h-48 w-48 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 backdrop-blur-3xl border border-white/10 flex items-center justify-center rotate-12 animate-pulse">
                                <Award className="h-24 w-24 text-amber-400 opacity-40" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-yellow-600/10 blur-3xl"></div>
                </div>

                {/* Search & Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="md:col-span-3 border-none shadow-xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-200">
                        <CardContent className="p-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                                <Input
                                    placeholder="Search by course or instructor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 h-12 bg-slate-50 border-none ring-0 focus-visible:ring-2 focus-visible:ring-amber-500 text-base rounded-xl"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl bg-amber-500 text-white rounded-2xl">
                        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                            <span className="text-xs font-black uppercase tracking-widest opacity-80">Total Earned</span>
                            <span className="text-3xl font-black">{certificates.length}</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Certificates Grid */}
                <div className="space-y-8">
                    {filteredCertificates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredCertificates.map((cert) => (
                                <Card key={cert.id} className="group border-none shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white rounded-3xl flex flex-col border-t-4 border-amber-400">
                                    <CardHeader className="pb-3 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner">
                                                <Award className="h-6 w-6" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 font-bold">
                                                    Verified
                                                </Badge>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl text-slate-500 hover:bg-slate-50"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl">
                                                        <DropdownMenuLabel className="text-sm font-black text-slate-900">
                                                            Certificate
                                                        </DropdownMenuLabel>
                                                        <div className="px-2 pb-2 text-xs font-bold text-slate-500">{cert.certificate_id}</div>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onSelect={(e) => {
                                                                e.preventDefault();
                                                                handleView(cert.id);
                                                            }}
                                                            className="rounded-xl"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                            View (PDF)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={(e) => {
                                                                e.preventDefault();
                                                                handleDownload(cert.id);
                                                            }}
                                                            className="rounded-xl"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onSelect={(e) => {
                                                                e.preventDefault();
                                                                handleVerify(cert.certificate_id);
                                                            }}
                                                            className="rounded-xl"
                                                        >
                                                            <ShieldCheck className="h-4 w-4" />
                                                            Public Verification
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl font-black text-slate-800 line-clamp-2 min-h-[3.5rem] group-hover:text-amber-600 transition-colors">
                                            {cert.course_title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                    {cert.instructor_name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">Instructor</span>
                                                    <span className="text-sm font-bold">{cert.instructor_name}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Issued On</span>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                        <Calendar className="h-3 w-3 text-slate-400" />
                                                        {new Date(cert.completion_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">ID</span>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                        <ShieldCheck className="h-3 w-3 text-amber-500" />
                                                        {cert.certificate_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 flex flex-col gap-3">
                                            <Button
                                                onClick={() => handleDownload(cert.id)}
                                                className="h-12 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg shadow-amber-100 transition-all"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download
                                            </Button>
                                            <Button
                                                onClick={() => handleView(cert.id)}
                                                variant="outline"
                                                className="h-12 border-amber-200 text-amber-700 hover:bg-amber-50 font-black rounded-xl transition-all"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                View (PDF)
                                            </Button>
                                            <Link href={`/verify/${cert.certificate_id}`} className="w-full">
                                                <Button variant="ghost" className="w-full h-10 text-slate-500 font-bold rounded-xl hover:bg-slate-50">
                                                    <ShieldCheck className="h-3 w-3 mr-2" />
                                                    Public Verification
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
                                <Award className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">No certificates yet</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2 mb-8 font-medium">
                                Complete courses to earn verified certificates and showcase your expertise.
                            </p>
                            <Link href="/student/enrollments">
                                <Button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">
                                    Continue Learning
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Upsell Section */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-10 text-white overflow-hidden relative mt-12 shadow-2xl">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="space-y-4 text-center md:text-left">
                                <h3 className="text-3xl font-black">Ready for your next milestone?</h3>
                                <p className="text-indigo-100 font-medium max-w-md">
                                    Browse our latest courses and start earning more certifications to advance your career.
                                </p>
                            </div>
                            <Link href="/student/courses">
                                <Button className="h-14 px-10 bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                                    Browse Course Catalog
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </Button>
                            </Link>
                        </div>
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
