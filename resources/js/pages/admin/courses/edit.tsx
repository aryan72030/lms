import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Save } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useActionMessages } from '@/hooks/use-action-messages';

interface Category {
    id: number;
    name: string;
}

interface Instructor {
    id: number;
    name: string;
    email: string;
}

interface Props {
    course: any;
    categories: Category[];
    instructors: Instructor[];
    difficultyLevels: string[];
}

interface FormData {
    title: string;
    description: string;
    objectives: string;
    requirements: string[];
    target_audience: string[];
    thumbnail: File | null;
    language: string;
    price: string;
    duration_hours: string;
    difficulty_level: string;
    category_id: string;
    instructor_id: string;
    _method: string;
}

export default function AdminCourseEdit({ course, categories, instructors, difficultyLevels }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const courseMessages = useActionMessages('Course');

    const normalizeThumbnailUrl = (value?: string | null) => {
        if (!value) return null;
        if (value.startsWith('http://') || value.startsWith('https://')) return value;
        if (value.startsWith('/files/')) return value;
        if (value.startsWith('files/')) return `/${value}`;
        if (value.startsWith('/storage/')) return value;
        if (value.startsWith('storage/')) return `/${value}`;
        return `/storage/${value.replace(/^\/+/, '')}`;
    };

    const [previewUrl, setPreviewUrl] = useState<string | null>(normalizeThumbnailUrl(course.thumbnail));

    useEffect(() => {
        setPreviewUrl(normalizeThumbnailUrl(course.thumbnail));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [course.id, course.thumbnail]);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        title: course.title || '',
        description: course.description || '',
        objectives: course.objectives || '',
        requirements: course.requirements.length > 0 ? course.requirements : [''],
        target_audience: course.target_audience.length > 0 ? course.target_audience : [''],
        thumbnail: null,
        language: course.language || 'English',
        price: course.price.toString(),
        duration_hours: course.duration_hours.toString(),
        difficulty_level: course.difficulty_level,
        category_id: course.category_id.toString(),
        instructor_id: course.instructor_id.toString(),
        _method: 'PUT',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use post with _method: 'PUT' for file uploads in Laravel
        post(`/admin/courses/${course.id}`, {
            forceFormData: true,
            onSuccess: () => courseMessages.success('update'),
            onError: () => courseMessages.error('update'),
        });
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('thumbnail', file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleAddRequirement = () => {
        setData('requirements', [...data.requirements, '']);
    };

    const handleRemoveRequirement = (index: number) => {
        const newRequirements = [...data.requirements];
        newRequirements.splice(index, 1);
        setData('requirements', newRequirements);
    };

    const handleRequirementChange = (index: number, value: string) => {
        const newRequirements = [...data.requirements];
        newRequirements[index] = value;
        setData('requirements', newRequirements);
    };

    const handleAddTarget = () => {
        setData('target_audience', [...data.target_audience, '']);
    };

    const handleRemoveTarget = (index: number) => {
        const newTarget = [...data.target_audience];
        newTarget.splice(index, 1);
        setData('target_audience', newTarget);
    };

    const handleTargetChange = (index: number, value: string) => {
        const newTarget = [...data.target_audience];
        newTarget[index] = value;
        setData('target_audience', newTarget);
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/admin/dashboard' },
            { title: 'Course Management', href: '/admin/courses' },
            { title: 'Edit', href: '#' }
        ]}>
            <Head title={`Edit Course: ${course.title}`} />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
                        <p className="text-gray-600">Update course details for {course.title}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="instructor_id">Instructor *</Label>
                                    <select
                                        id="instructor_id"
                                        value={data.instructor_id}
                                        onChange={(e) => setData('instructor_id', e.target.value)}
                                        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.instructor_id ? 'border-red-500' : ''}`}
                                        required
                                    >
                                        <option value="">Select Instructor</option>
                                        {instructors.map(inst => (
                                            <option key={inst.id} value={inst.id}>{inst.name} ({inst.email})</option>
                                        ))}
                                    </select>
                                    {errors.instructor_id && <p className="text-red-600 text-sm mt-1">{errors.instructor_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category_id">Category *</Label>
                                    <select
                                        id="category_id"
                                        value={data.category_id}
                                        onChange={(e) => setData('category_id', e.target.value)}
                                        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.category_id ? 'border-red-500' : ''}`}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {errors.category_id && <p className="text-red-600 text-sm mt-1">{errors.category_id}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Course Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Master React.js from Scratch"
                                    className={errors.title ? 'border-red-500' : ''}
                                    required
                                />
                                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className={`min-h-[150px] ${errors.description ? 'border-red-500' : ''}`}
                                    placeholder="Provide a detailed description of your course..."
                                    required
                                />
                                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="language">Language *</Label>
                                    <select
                                        id="language"
                                        value={data.language}
                                        onChange={(e) => setData('language', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="English">English</option>
                                        <option value="Gujarati">Gujarati</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Spanish">Spanish</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="difficulty_level">Difficulty Level</Label>
                                    <select
                                        id="difficulty_level"
                                        value={data.difficulty_level}
                                        onChange={(e) => setData('difficulty_level', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {difficultyLevels.map(level => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Requirements</CardTitle>
                                <Button type="button" variant="ghost" size="sm" onClick={handleAddRequirement} className="h-8 w-8 p-0">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {data.requirements.map((req, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input 
                                            value={req} 
                                            onChange={(e) => handleRequirementChange(idx, e.target.value)}
                                            placeholder="e.g. Basic JavaScript"
                                        />
                                        {data.requirements.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveRequirement(idx)} className="text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Target Audience</CardTitle>
                                <Button type="button" variant="ghost" size="sm" onClick={handleAddTarget} className="h-8 w-8 p-0">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {data.target_audience.map((target, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input 
                                            value={target} 
                                            onChange={(e) => handleTargetChange(idx, e.target.value)}
                                            placeholder="e.g. Web Developers"
                                        />
                                        {data.target_audience.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTarget(idx)} className="text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Course Thumbnail</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-video rounded-md border-2 border-dashed border-gray-300 hover:border-indigo-500 bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
                                >
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">
                                                Change Image
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500 font-medium">Click to upload thumbnail</p>
                                        </>
                                    )}
                                    <input 
                                        ref={fileInputRef}
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleThumbnailChange} 
                                        className="hidden" 
                                    />
                                </div>
                                {errors.thumbnail && <p className="text-red-600 text-sm mt-1">{errors.thumbnail}</p>}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Settings & Pricing</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Course Price ($) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                    <p className="text-xs text-gray-500">Set to 0.00 for free courses</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="duration_hours">Duration (Hours) *</Label>
                                    <Input
                                        id="duration_hours"
                                        type="number"
                                        value={data.duration_hours}
                                        onChange={(e) => setData('duration_hours', e.target.value)}
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Link href="/admin/courses">
                            <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Saving...' : 'Update Course'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
