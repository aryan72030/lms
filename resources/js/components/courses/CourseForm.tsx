import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface Category {
    id: number;
    name: string;
}

interface Instructor {
    id: number;
    name: string;
    email: string;
}

interface CourseFormData {
    title: string;
    description: string;
    thumbnail: File | string | null;
    category_id: string;
    language: string;
    price: string;
    access_duration: string;
    duration_hours: string;
    difficulty_level: string;
    status?: string;
    instructor_id?: string;
}

interface CourseFormProps {
    data: CourseFormData;
    setData: (field: keyof CourseFormData, value: any) => void;
    errors: Record<string, string | undefined>;
    categories: Category[];
    difficultyLevels: string[];
    thumbnailPreview: string | null;
    handleThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    mode?: 'create' | 'edit';
    instructors?: Instructor[];
    isAdmin?: boolean;
}

export function CourseForm({
    data,
    setData,
    errors,
    categories,
    difficultyLevels,
    thumbnailPreview,
    handleThumbnailChange,
    mode = 'create',
    instructors = [],
    isAdmin = false
}: CourseFormProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const onRemoveThumbnail = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setData('thumbnail', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Link href={isAdmin ? "/admin/courses" : "/instructor/courses"}>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 rounded-full p-0 shadow-sm transition-all hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h2 className="text-xl font-bold text-gray-900">
                    {mode === 'create' ? 'Create Course' : 'Edit Course'}
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                    {isAdmin && mode === 'create' && (
                        <div className="space-y-2">
                            <Label htmlFor="instructor_id">
                                Instructor <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.instructor_id} onValueChange={(value) => setData('instructor_id', value)}>
                                <SelectTrigger className={errors.instructor_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select Instructor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {instructors.map((inst) => (
                                        <SelectItem key={inst.id} value={inst.id.toString()}>
                                            {inst.name} ({inst.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.instructor_id && <p className="text-sm text-red-500">{errors.instructor_id}</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">Course Title</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g., Complete Web Development Bootcamp"
                            className={errors.title ? 'border-red-500' : ''}
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Describe what students will learn..."
                            className={`min-h-[200px] ${errors.description ? 'border-red-500' : ''}`}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                    <h3 className="font-semibold text-gray-900">Course Thumbnail</h3>
                    <div className="space-y-4">
                        <div className="relative group">
                            {thumbnailPreview && (
                                <button
                                    type="button"
                                    onClick={onRemoveThumbnail}
                                    className="absolute -top-2 -right-2 z-20 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-all"
                                    title="Remove Thumbnail"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 transition-colors overflow-hidden">
                                {thumbnailPreview ? (
                                    <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                                        <p className="mb-2 text-sm font-semibold text-gray-700">Click to upload</p>
                                        <p className="text-xs">PNG, JPG or WEBP (Max. 2MB)</p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleThumbnailChange}
                                />
                            </label>
                        </div>
                        {errors.thumbnail && <p className="text-sm text-red-500">{errors.thumbnail}</p>}
                    </div>
                </div>
            </div>

            {/* Right Column - Settings */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                    <h3 className="font-semibold text-gray-900">Course Settings</h3>

                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={data.category_id} onValueChange={(value) => setData('category_id', value)}>
                            <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Input
                            id="language"
                            value={data.language}
                            onChange={(e) => setData('language', e.target.value)}
                            placeholder="e.g., English, Gujarati"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Difficulty Level</Label>
                        <Select value={data.difficulty_level} onValueChange={(value) => setData('difficulty_level', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent>
                                {difficultyLevels.map((level) => (
                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {mode === 'edit' && data.status && (
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Review">Review</SelectItem>
                                    <SelectItem value="Published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                    <h3 className="font-semibold text-gray-900">Pricing & Duration</h3>

                    <div className="space-y-2">
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                            id="price"
                            type="number"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500">Set to 0.00 for free courses</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="access_duration">Access Duration (Days)</Label>
                        <Input
                            id="access_duration"
                            type="number"
                            value={data.access_duration}
                            onChange={(e) => setData('access_duration', e.target.value)}
                            placeholder="0"
                        />
                        <p className="text-xs text-gray-500">Set to 0 for lifetime access</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration_hours">Estimated Duration (Hours)</Label>
                        <Input
                            id="duration_hours"
                            type="number"
                            value={data.duration_hours}
                            onChange={(e) => setData('duration_hours', e.target.value)}
                            placeholder="1"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
