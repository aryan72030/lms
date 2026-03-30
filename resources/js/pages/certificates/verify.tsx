import { Head } from '@inertiajs/react';
import { CheckCircle, XCircle, Award, User, BookOpen, Calendar, Shield } from 'lucide-react';
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

export default function CertificateVerify({ certificate_id, verification }: Props) {
    return (
        <AppLayout>
            <Head title={`Certificate Verification - ${certificate_id}`} />
            
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
                    <p className="text-gray-600">Verify the authenticity of learning certificates</p>
                </div>

                {/* Certificate ID */}
                <Card>
                    <CardContent className="text-center py-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600">Certificate ID</span>
                        </div>
                        <div className="text-2xl font-mono font-bold text-gray-900">
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
                                <span className="text-green-900">Certificate Verified</span>
                                <Badge className="bg-green-100 text-green-800 ml-auto">
                                    Valid
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center">
                                <Award className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Certificate of Completion
                                </h2>
                                <p className="text-gray-600">
                                    This certificate has been verified as authentic and valid.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Student Name</div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {verification.student_name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <BookOpen className="h-5 w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Course Title</div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {verification.course_title}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Instructor</div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {verification.instructor_name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-600">Completion Date</div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {verification.completion_date}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="font-medium text-green-900">Verification Status</span>
                                    </div>
                                    <p className="text-green-800 text-sm">
                                        This certificate is authentic and was issued by our learning management system. 
                                        The student has successfully completed all course requirements.
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
                                <span className="text-red-900">Certificate Not Found</span>
                                <Badge className="bg-red-100 text-red-800 ml-auto">
                                    Invalid
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center py-8">
                            <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                            <h2 className="text-xl font-semibold text-red-900 mb-2">
                                Certificate Not Verified
                            </h2>
                            <p className="text-red-700 mb-4">
                                The certificate ID "{certificate_id}" could not be verified. This may indicate:
                            </p>
                            <ul className="text-left text-red-700 text-sm space-y-1 max-w-md mx-auto">
                                <li>• The certificate ID is incorrect or invalid</li>
                                <li>• The certificate has been revoked</li>
                                <li>• The certificate was not issued by this system</li>
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
                            Our certificate verification system ensures the authenticity of all learning certificates 
                            issued through our platform. Each certificate contains a unique ID that can be verified 
                            against our secure database.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 mb-2">Secure Verification</h4>
                                <p className="text-blue-800 text-sm">
                                    All certificates are cryptographically secured and stored in our tamper-proof database.
                                </p>
                            </div>
                            
                            <div className="bg-green-50 rounded-lg p-4">
                                <h4 className="font-medium text-green-900 mb-2">Instant Results</h4>
                                <p className="text-green-800 text-sm">
                                    Verification results are provided instantly and include complete certificate details.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}