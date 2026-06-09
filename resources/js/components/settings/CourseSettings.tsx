import { router } from '@inertiajs/react';
import { BookOpen, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Props {
    settings: Record<string, any>;
}

export default function CourseSettings({ settings }: Props) {
    const [formData, setFormData] = useState({
        // Basic Course Settings
        require_course_description: settings.require_course_description ?? true,
        require_course_thumbnail: settings.require_course_thumbnail ?? true,

        // File Upload Settings
        max_file_upload_size: settings.max_file_upload_size || 10,
        allowed_file_types:
            settings.allowed_file_types || 'jpg,jpeg,png,pdf,doc,docx,mp4,mp3',

        // Approval Settings
        auto_approve_courses: settings.auto_approve_courses ?? false,
        require_admin_approval: settings.require_admin_approval ?? true,

        // Quiz & Completion Settings
        require_final_quiz: settings.require_final_quiz ?? true,
        min_quiz_passing_score: settings.min_quiz_passing_score || 70,

        // Certificate Settings
        enable_certificates: settings.enable_certificates ?? true,
        auto_email_certificates: settings.auto_email_certificates ?? true,

        // Enrollment Settings
        allow_free_courses: settings.allow_free_courses ?? true,
        max_students_per_course: settings.max_students_per_course || 0,
    });

    const [isLoading, setIsLoading] = useState(false);
    const settingsMessages = useActionMessages('Course settings');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        router.post('/admin/settings/course', formData, {
            preserveScroll: true,
            onSuccess: () => {
            },
            onError: () => {
                settingsMessages.error('save');
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => {
            const newFormData = { ...prev, [field]: value };

            // Logic for auto_approve_courses and require_admin_approval
            if (field === 'auto_approve_courses' && value === true) {
                newFormData.require_admin_approval = false;
            }
            if (field === 'require_admin_approval' && value === true) {
                newFormData.auto_approve_courses = false;
            }

            return newFormData;
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Settings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Course Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                            Basic Course Settings
                        </h3>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="require_course_description">
                                Require Course Description
                            </Label>
                            <Switch
                                checked={formData.require_course_description}
                                onCheckedChange={(checked) =>
                                    handleInputChange(
                                        'require_course_description',
                                        checked,
                                    )
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="require_course_thumbnail">
                                Require Course Thumbnail
                            </Label>
                            <Switch
                                checked={formData.require_course_thumbnail}
                                onCheckedChange={(checked) =>
                                    handleInputChange(
                                        'require_course_thumbnail',
                                        checked,
                                    )
                                }
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* File Upload Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                            File Upload Settings
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="max_file_upload_size">
                                    Max File Upload Size (MB)
                                </Label>
                                <Input
                                    id="max_file_upload_size"
                                    type="number"
                                    min="1"
                                    value={formData.max_file_upload_size}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'max_file_upload_size',
                                            parseInt(e.target.value),
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="allowed_file_types">
                                Allowed File Types (comma-separated)
                            </Label>
                            <Input
                                id="allowed_file_types"
                                value={formData.allowed_file_types}
                                onChange={(e) =>
                                    handleInputChange(
                                        'allowed_file_types',
                                        e.target.value,
                                    )
                                }
                                placeholder="jpg,jpeg,png,pdf,doc,docx,mp4,mp3"
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Approval Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Course Approval</h3>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="auto_approve_courses">
                                Auto-Approve Courses
                            </Label>
                            <Switch
                                checked={formData.auto_approve_courses}
                                onCheckedChange={(checked) =>
                                    handleInputChange(
                                        'auto_approve_courses',
                                        checked,
                                    )
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="require_admin_approval">
                                Require Admin Approval
                            </Label>
                            <Switch
                                checked={formData.require_admin_approval}
                                onCheckedChange={(checked) =>
                                    handleInputChange(
                                        'require_admin_approval',
                                        checked,
                                    )
                                }
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Quiz & Completion Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                            Quiz & Completion Settings
                        </h3>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="require_final_quiz">
                                Require Final Quiz
                            </Label>
                            <Switch
                                checked={formData.require_final_quiz}
                                onCheckedChange={(checked) =>
                                    handleInputChange(
                                        'require_final_quiz',
                                        checked,
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="min_quiz_passing_score">
                                Minimum Passing Score (%)
                            </Label>
                            <Input
                                id="min_quiz_passing_score"
                                type="number"
                                min="1"
                                max="100"
                                value={formData.min_quiz_passing_score}
                                onChange={(e) =>
                                    handleInputChange(
                                        'min_quiz_passing_score',
                                        parseInt(e.target.value),
                                    )
                                }
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Certificate Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Certificates</h3>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="enable_certificates">
                                Enable Certificates
                            </Label>
                            <Switch
                                checked={formData.enable_certificates}
                                onCheckedChange={(checked) =>
                                    handleInputChange(
                                        'enable_certificates',
                                        checked,
                                    )
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="auto_email_certificates">
                                Auto-Email Certificates
                            </Label>
                            <Switch
                                checked={formData.auto_email_certificates}
                                onCheckedChange={(checked) =>
                                    handleInputChange(
                                        'auto_email_certificates',
                                        checked,
                                    )
                                }
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Enrollment Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                            Enrollment Settings
                        </h3>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="allow_free_courses">
                                Allow Free Courses
                            </Label>
                            <Switch
                                checked={formData.allow_free_courses}
                                onCheckedChange={(checked) =>
                                    handleInputChange(
                                        'allow_free_courses',
                                        checked,
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="max_students_per_course">
                                Max Students Per Course (0 = Unlimited)
                            </Label>
                            <Input
                                id="max_students_per_course"
                                type="number"
                                min="0"
                                value={formData.max_students_per_course}
                                onChange={(e) =>
                                    handleInputChange(
                                        'max_students_per_course',
                                        parseInt(e.target.value),
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
