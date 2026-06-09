import { Head } from '@inertiajs/react';
import {
    CheckCircle,
    XCircle,
    Award,
    User,
    BookOpen,
    Calendar,
    Shield,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

interface Verification {
    valid: boolean;
    student_name: string;
    course_title: string;
    instructor_name: string;
    completion_date: string;
    certificate_id: string;
}

interface Props {
    certificate_id: string;
    verification: Verification | null;
}

export default function CertificateVerify({
    certificate_id,
    verification,
}: Props) {
    return (
        <AppLayout>
            <Head title={`Certificate Verification - ${certificate_id}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="page-title mb-2 text-gray-900">
                        Certificate Verification
                    </h1>
                    <p className="text-gray-600">
                        Verify the authenticity of learning certificates
                    </p>
                </div>

                {/* Certificate ID */}
                <Card>
                    <CardContent className="py-6 text-center">
                        <div className="mb-2 flex items-center justify-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600">
                                Certificate ID
                            </span>
                        </div>
                        <div className="font-mono text-2xl font-bold text-gray-900">
                            {certificate_id}
                        </div>
                    </CardContent>
                </Card>

                {/* Verification Result */}
                {verification ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <span className="text-green-900">
                                    Certificate Verified
                                </span>
                                <Badge className="ml-auto bg-green-100 text-green-800">
                                    Valid
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center">
                                <Award className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
                                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                                    Certificate of Completion
                                </h2>
                                <p className="text-gray-600">
                                    This certificate has been verified as
                                    authentic and valid.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <User className="mt-0.5 h-5 w-5 text-gray-500" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">
                                                Student Name
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {verification.student_name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <BookOpen className="mt-0.5 h-5 w-5 text-gray-500" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">
                                                Course Title
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {verification.course_title}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <User className="mt-0.5 h-5 w-5 text-gray-500" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">
                                                Instructor
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {verification.instructor_name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Calendar className="mt-0.5 h-5 w-5 text-gray-500" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">
                                                Completion Date
                                            </div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {verification.completion_date}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <div className="rounded-lg bg-green-50 p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="font-medium text-green-900">
                                            Verification Status
                                        </span>
                                    </div>
                                    <p className="text-sm text-green-800">
                                        This certificate is authentic and was
                                        issued by our learning management
                                        system. The student has successfully
                                        completed all course requirements.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <XCircle className="h-6 w-6 text-red-600" />
                                <span className="text-red-900">
                                    Certificate Not Found
                                </span>
                                <Badge className="ml-auto bg-red-100 text-red-800">
                                    Invalid
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="py-8 text-center">
                            <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
                            <h2 className="mb-2 text-xl font-semibold text-red-900">
                                Certificate Not Verified
                            </h2>
                            <p className="mb-4 text-red-700">
                                The certificate ID "{certificate_id}" could not
                                be verified. This may indicate:
                            </p>
                            <ul className="mx-auto max-w-md space-y-1 text-left text-sm text-red-700">
                                <li>
                                    • The certificate ID is incorrect or invalid
                                </li>
                                <li>• The certificate has been revoked</li>
                                <li>
                                    • The certificate was not issued by this
                                    system
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Verification Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            About Certificate Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-600">
                            Our certificate verification system ensures the
                            authenticity of all learning certificates issued
                            through our platform. Each certificate contains a
                            unique ID that can be verified against our secure
                            database.
                        </p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-lg bg-blue-50 p-4">
                                <h4 className="mb-2 font-medium text-blue-900">
                                    Secure Verification
                                </h4>
                                <p className="text-sm text-blue-800">
                                    All certificates are cryptographically
                                    secured and stored in our tamper-proof
                                    database.
                                </p>
                            </div>

                            <div className="rounded-lg bg-green-50 p-4">
                                <h4 className="mb-2 font-medium text-green-900">
                                    Instant Results
                                </h4>
                                <p className="text-sm text-green-800">
                                    Verification results are provided instantly
                                    and include complete certificate details.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
