import { Head, Link } from '@inertiajs/react';
import {
    Award,
    Download,
    ExternalLink,
    Calendar,
    User,
    Search,
    BookOpen,
    ArrowRight,
    ShieldCheck,
    MoreVertical,
} from 'lucide-react';
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

    const filteredCertificates = certificates.filter(
        (cert) =>
            cert.course_title
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            cert.instructor_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    const handleDownload = (enrollmentId: number) => {
        window.open(
            `/enrollments/${enrollmentId}/certificate/download`,
            '_blank',
        );
    };

    const handleView = (enrollmentId: number) => {
        window.open(`/enrollments/${enrollmentId}/certificate/view`, '_blank');
    };

    const handleVerify = (certificateId: string) => {
        window.open(`/verify/${certificateId}`, '_blank');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/student/dashboard' },
                { title: 'My Certificates', href: '/student/certificates' },
            ]}
        >
            <Head title="My Certificates" />

            <div className="space-y-10 pb-12">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl md:p-12">
                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl space-y-4">
                            <Badge className="border-none bg-amber-500 px-3 py-1 text-white">
                                Academic Achievements
                            </Badge>
                            <h1 className="page-title">
                                My{' '}
                                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                    Certificates
                                </span>
                            </h1>
                            <p className="max-w-md text-lg text-slate-300">
                                All your earned certificates in one place.
                                Proudly display your hard-earned skills.
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="flex h-48 w-48 rotate-12 animate-pulse items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 backdrop-blur-3xl">
                                <Award className="h-24 w-24 text-amber-400 opacity-40" />
                            </div>
                        </div>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-yellow-600/10 blur-3xl"></div>
                </div>

                {/* Search & Stats Bar */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card className="border-none bg-white/80 shadow-xl ring-1 ring-slate-200 backdrop-blur-xl md:col-span-3">
                        <CardContent className="p-4">
                            <div className="group relative">
                                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-amber-600" />
                                <Input
                                    placeholder="Search by course or instructor..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="h-12 rounded-xl border-none bg-slate-50 pl-11 text-base ring-0 focus-visible:ring-2 focus-visible:ring-amber-500"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl border-none bg-amber-500 text-white shadow-xl">
                        <CardContent className="flex h-full flex-col items-center justify-center p-4">
                            <span className="text-xs font-black tracking-widest uppercase opacity-80">
                                Total Earned
                            </span>
                            <span className="text-3xl font-black">
                                {certificates.length}
                            </span>
                        </CardContent>
                    </Card>
                </div>

                {/* Certificates Grid */}
                <div className="space-y-8">
                    {filteredCertificates.length > 0 ? (
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                            {filteredCertificates.map((cert) => (
                                <Card
                                    key={cert.id}
                                    className="group flex flex-col overflow-hidden rounded-3xl border-t-4 border-none border-amber-400 bg-white shadow-md transition-all duration-500 hover:shadow-2xl"
                                >
                                    <CardHeader className="space-y-4 pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-inner">
                                                <Award className="h-6 w-6" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-200 bg-amber-50 font-bold text-amber-700"
                                                >
                                                    Verified
                                                </Badge>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl text-slate-500 hover:bg-slate-50"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-56 rounded-2xl p-2"
                                                    >
                                                        <DropdownMenuLabel className="text-sm font-black text-slate-900">
                                                            Certificate
                                                        </DropdownMenuLabel>
                                                        <div className="px-2 pb-2 text-xs font-bold text-slate-500">
                                                            {
                                                                cert.certificate_id
                                                            }
                                                        </div>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onSelect={(e) => {
                                                                e.preventDefault();
                                                                handleView(
                                                                    cert.id,
                                                                );
                                                            }}
                                                            className="rounded-xl"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                            View (PDF)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={(e) => {
                                                                e.preventDefault();
                                                                handleDownload(
                                                                    cert.id,
                                                                );
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
                                                                handleVerify(
                                                                    cert.certificate_id,
                                                                );
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
                                        <CardTitle className="line-clamp-2 min-h-[3.5rem] text-xl font-black text-slate-800 transition-colors group-hover:text-amber-600">
                                            {cert.course_title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="flex flex-grow flex-col justify-between space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                                    {cert.instructor_name.charAt(
                                                        0,
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                                                        Instructor
                                                    </span>
                                                    <span className="text-sm font-bold">
                                                        {cert.instructor_name}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="flex flex-col">
                                                    <span className="mb-1 text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                                                        Issued On
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                        <Calendar className="h-3 w-3 text-slate-400" />
                                                        {new Date(
                                                            cert.completion_date,
                                                        ).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="mb-1 text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase">
                                                        ID
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                        <ShieldCheck className="h-3 w-3 text-amber-500" />
                                                        {cert.certificate_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-6">
                                            <Button
                                                onClick={() =>
                                                    handleDownload(cert.id)
                                                }
                                                className="h-12 rounded-xl bg-amber-500 font-black text-white shadow-lg shadow-amber-100 transition-all hover:bg-amber-600"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    handleView(cert.id)
                                                }
                                                variant="outline"
                                                className="h-12 rounded-xl border-amber-200 font-black text-amber-700 transition-all hover:bg-amber-50"
                                            >
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                View (PDF)
                                            </Button>
                                            <Link
                                                href={`/verify/${cert.certificate_id}`}
                                                className="w-full"
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className="h-10 w-full rounded-xl font-bold text-slate-500 hover:bg-slate-50"
                                                >
                                                    <ShieldCheck className="mr-2 h-3 w-3" />
                                                    Public Verification
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
                                <Award className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800">
                                No certificates yet
                            </h3>
                            <p className="mx-auto mt-2 mb-8 max-w-xs font-medium text-slate-500">
                                Complete courses to earn verified certificates
                                and showcase your expertise.
                            </p>
                            <Link href="/student/enrollments">
                                <Button className="h-12 rounded-xl bg-indigo-600 px-8 font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700">
                                    Continue Learning
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Upsell Section */}
                    <div className="relative mt-12 overflow-hidden rounded-[40px] bg-gradient-to-br from-indigo-600 to-purple-700 p-10 text-white shadow-2xl">
                        <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
                            <div className="space-y-4 text-center md:text-left">
                                <h3 className="text-3xl font-black">
                                    Ready for your next milestone?
                                </h3>
                                <p className="max-w-md font-medium text-indigo-100">
                                    Browse our latest courses and start earning
                                    more certifications to advance your career.
                                </p>
                            </div>
                            <Link href="/student/courses">
                                <Button className="h-14 rounded-2xl bg-white px-10 font-black text-indigo-600 shadow-xl transition-all hover:scale-105 hover:bg-indigo-50 active:scale-95">
                                    Browse Courses
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
