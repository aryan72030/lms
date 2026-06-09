import { Link } from '@inertiajs/react';
import {
    Image as ImageIcon,
    ListChecks,
    Plus,
    Target,
    Trash2,
    UserRound,
    X,
    ArrowLeft,
} from 'lucide-react';
import React, { useRef } from 'react';
import { useNotification } from '@/contexts/notification-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface CourseEditorCategory {
    id: number;
    name: string;
}

export interface CourseEditorInstructor {
    id: number;
    name: string;
    email: string;
}

export interface CourseEditorData {
    title: string;
    description: string;
    objectives: string;
    requirements: string[];
    target_audience: string[];
    thumbnail: File | null;
    language: string;
    price: string;
    access_duration: string;
    duration_hours: string;
    difficulty_level: string;
    category_id: string;
    instructor_id?: string;
}

interface CourseEditorFormProps {
    title: string;
    description: string;
    data: CourseEditorData;
    setData: (field: keyof CourseEditorData, value: any) => void;
    errors: Record<string, string | undefined>;
    categories: CourseEditorCategory[];
    difficultyLevels: string[];
    previewUrl: string | null;
    onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearThumbnail?: () => void;
    onSubmit: (e: React.FormEvent) => void;
    processing: boolean;
    submitLabel: string;
    submitLoadingLabel: string;
    cancelHref: string;
    showInstructorSelect?: boolean;
    instructors?: CourseEditorInstructor[];
}

export function CourseEditorForm({
    title,
    description,
    data,
    setData,
    errors,
    categories,
    difficultyLevels,
    previewUrl,
    onThumbnailChange,
    onClearThumbnail,
    onSubmit,
    processing,
    submitLabel,
    submitLoadingLabel,
    cancelHref,
    showInstructorSelect = false,
    instructors = [],
}: CourseEditorFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showError } = useNotification();

    // Fix 6 — Thumbnail file size check
    const handleThumbnailWithSizeCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showError('Image size must be less than 2MB. Please choose a smaller image.');
            e.target.value = '';
            return;
        }
        onThumbnailChange(e);
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={cancelHref}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0 shadow-sm transition-all hover:bg-slate-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="page-title text-gray-900">{title}</h1>
                        <p className="text-gray-600">{description}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* Fix 8 — same div pattern as LessonForm */}
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-sm font-semibold text-gray-900">Course Information</h2>
                    </div>
                    <div className="space-y-5 p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {showInstructorSelect && (
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="instructor_id"
                                        className="flex items-center gap-2"
                                    >
                                        <UserRound className="h-4 w-4" />
                                        Instructor{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="instructor_id"
                                        value={data.instructor_id || ''}
                                        onChange={(e) =>
                                            setData(
                                                'instructor_id',
                                                e.target.value,
                                            )
                                        }
                                        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${errors.instructor_id ? 'border-red-500' : ''}`}
                                        required
                                    >
                                        <option value="">
                                            Select Instructor
                                        </option>
                                        {instructors.map((instructor) => (
                                            <option
                                                key={instructor.id}
                                                value={instructor.id}
                                            >
                                                {instructor.name} (
                                                {instructor.email})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.instructor_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.instructor_id}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label
                                    htmlFor="category_id"
                                    className="flex items-center gap-2"
                                >
                                    <Target className="h-4 w-4" />
                                    Category{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <select
                                    id="category_id"
                                    value={data.category_id}
                                    onChange={(e) =>
                                        setData('category_id', e.target.value)
                                    }
                                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${errors.category_id ? 'border-red-500' : ''}`}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.category_id}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Course Title{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                                placeholder="e.g. Master React.js from Scratch"
                                className={errors.title ? 'border-red-500' : ''}
                                required
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="Provide a detailed description of your course..."
                                className={`min-h-[150px] ${errors.description ? 'border-red-500' : ''}`}
                                required
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="objectives"
                                className="flex items-center gap-2"
                            >
                                <ListChecks className="h-4 w-4" />
                                Objectives (Optional)
                            </Label>
                            <Textarea
                                id="objectives"
                                value={data.objectives}
                                onChange={(e) =>
                                    setData('objectives', e.target.value)
                                }
                                placeholder="List the main objectives students will achieve..."
                                className={
                                    errors.objectives ? 'border-red-500' : ''
                                }
                            />
                            {errors.objectives && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.objectives}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="language">
                                    Language{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <select
                                    id="language"
                                    value={data.language}
                                    onChange={(e) =>
                                        setData('language', e.target.value)
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                >
                                    <option value="English">English</option>
                                    <option value="Gujarati">Gujarati</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Spanish">Spanish</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="difficulty_level">
                                    Difficulty Level
                                </Label>
                                <select
                                    id="difficulty_level"
                                    value={data.difficulty_level}
                                    onChange={(e) =>
                                        setData(
                                            'difficulty_level',
                                            e.target.value,
                                        )
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                                >
                                    {difficultyLevels.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <h2 className="text-sm font-semibold text-gray-900">Requirements</h2>
                            <button type="button" onClick={handleAddRequirement} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                                <Plus className="h-3.5 w-3.5" /> Add
                            </button>
                        </div>
                        <div className="space-y-3 p-6">
                            {data.requirements.map((req, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={req}
                                        onChange={(e) =>
                                            handleRequirementChange(
                                                idx,
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. Basic JavaScript"
                                    />
                                    {data.requirements.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleRemoveRequirement(idx)
                                            }
                                            className="text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <h2 className="text-sm font-semibold text-gray-900">Target Audience</h2>
                            <button type="button" onClick={handleAddTarget} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                                <Plus className="h-3.5 w-3.5" /> Add
                            </button>
                        </div>
                        <div className="space-y-3 p-6">
                            {data.target_audience.map((target, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={target}
                                        onChange={(e) =>
                                            handleTargetChange(
                                                idx,
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. Web Developers"
                                    />
                                    {data.target_audience.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleRemoveTarget(idx)
                                            }
                                            className="text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-sm font-semibold text-gray-900">Course Thumbnail</h2>
                        </div>
                        <div className="p-6">
                            <div className="relative">
                                {previewUrl && onClearThumbnail && (
                                     <button
                                         type="button"
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             onClearThumbnail();
                                         }}
                                         className="absolute -top-3 -right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-rose-600 text-white shadow-xl transition-all hover:bg-rose-700 focus:outline-none"
                                         title="Remove Thumbnail"
                                     >
                                         <X className="h-5 w-5" strokeWidth={3} />
                                     </button>
                                 )}
                                <div
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-indigo-500"
                                >
                                    {previewUrl ? (
                                        <>
                                            <img
                                                src={previewUrl}
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                Change Image
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="mb-2 h-10 w-10 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-500">
                                                Click to upload thumbnail
                                            </p>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailWithSizeCheck}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                            {errors.thumbnail && (
                                <p className="mt-2 text-xs text-red-600">{errors.thumbnail}</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-sm font-semibold text-gray-900">Settings & Pricing</h2>
                        </div>
                        <div className="space-y-5 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="price">
                                    Course Price ($){' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={data.price}
                                    onChange={(e) =>
                                        setData('price', e.target.value)
                                    }
                                    placeholder="0.00"
                                    className={errors.price ? 'border-red-500' : ''}
                                    required
                                />
                                {errors.price && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.price}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500">
                                    Set to 0.00 for free courses
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="access_duration">
                                    Access Duration (Days)
                                </Label>
                                <Input
                                    id="access_duration"
                                    type="number"
                                    value={data.access_duration}
                                    onChange={(e) =>
                                        setData(
                                            'access_duration',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="0"
                                    className={
                                        errors.access_duration
                                            ? 'border-red-500'
                                            : ''
                                    }
                                />
                                {errors.access_duration && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.access_duration}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500">
                                    Set to 0 for lifetime access
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration_hours">
                                    Duration (Hours){' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="duration_hours"
                                    type="number"
                                    value={data.duration_hours}
                                    onChange={(e) =>
                                        setData(
                                            'duration_hours',
                                            e.target.value,
                                        )
                                    }
                                    className={
                                        errors.duration_hours
                                            ? 'border-red-500'
                                            : ''
                                    }
                                    required
                                />
                                {errors.duration_hours && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.duration_hours}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link href={cancelHref}>
                        <Button variant="outline" type="button">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" variant="create" disabled={processing}>
                        {processing ? submitLoadingLabel : submitLabel}
                    </Button>
                </div>
            </form>
        </div>
    );
}
