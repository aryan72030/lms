import { X, Save } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CourseUpdatePopperProps {
    course: any;
    categories: any[];
    instructors: any[];
    difficultyLevels: string[];
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (courseData: any) => void;
    loading: boolean;
    errors: any;
}

export function CourseUpdatePopper({ 
    course, 
    categories,
    instructors,
    difficultyLevels,
    isOpen, 
    onClose, 
    onUpdate, 
    loading, 
    errors 
}: CourseUpdatePopperProps) {
    const [formData, setFormData] = useState({
        title: course?.title || '',
        description: course?.description || '',
        objectives: course?.objectives || '',
        price: course?.price || '',
        duration_hours: course?.duration_hours || '',
        difficulty_level: course?.difficulty_level || '',
        instructor_id: course?.instructor?.id || course?.instructor_id || '',
        category_id: course?.category?.id || course?.category_id || '',
    });

    const popperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (course) {
            setFormData({
                title: course.title || '',
                description: course.description || '',
                objectives: course.objectives || '',
                price: course.price || '',
                duration_hours: course.duration_hours || '',
                difficulty_level: course.difficulty_level || '',
                instructor_id: course.instructor?.id || course.instructor_id || '',
                category_id: course.category?.id || course.category_id || '',
            });
        }
    }, [course]);



    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popperRef.current && !popperRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    if (!isOpen || !course) {
return null;
}

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                ref={popperRef}
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto"
            >
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Update Course</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-900">Basic Information</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="update_title">Course Title *</Label>
                                    <Input
                                        id="update_title"
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="Enter course title"
                                        className={errors.title ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title[0]}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="update_category_id">Category *</Label>
                                    <select
                                        id="update_category_id"
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                        className={`w-full border rounded-md px-3 py-2 ${errors.category_id ? 'border-red-500' : 'border-gray-300'}`}
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && <p className="text-red-600 text-sm mt-1">{errors.category_id[0]}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="update_description">Description *</Label>
                                <Textarea
                                    id="update_description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Enter course description"
                                    rows={4}
                                    className={errors.description ? 'border-red-500' : ''}
                                    required
                                />
                                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description[0]}</p>}
                            </div>

                            <div>
                                <Label htmlFor="update_objectives">Learning Objectives</Label>
                                <Textarea
                                    id="update_objectives"
                                    value={formData.objectives}
                                    onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                                    placeholder="Enter learning objectives (optional)"
                                    rows={3}
                                    className={errors.objectives ? 'border-red-500' : ''}
                                />
                                {errors.objectives && <p className="text-red-600 text-sm mt-1">{errors.objectives[0]}</p>}
                            </div>
                        </div>

                        {/* Course Details */}
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-900">Course Details</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="update_price">Price ($) *</Label>
                                    <Input
                                        id="update_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        placeholder="0.00"
                                        className={errors.price ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price[0]}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="update_duration_hours">Duration (Hours) *</Label>
                                    <Input
                                        id="update_duration_hours"
                                        type="number"
                                        min="1"
                                        value={formData.duration_hours}
                                        onChange={(e) => setFormData({...formData, duration_hours: e.target.value})}
                                        placeholder="1"
                                        className={errors.duration_hours ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.duration_hours && <p className="text-red-600 text-sm mt-1">{errors.duration_hours[0]}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="update_difficulty_level">Difficulty Level *</Label>
                                    <select
                                        id="update_difficulty_level"
                                        value={formData.difficulty_level}
                                        onChange={(e) => setFormData({...formData, difficulty_level: e.target.value})}
                                        className={`w-full border rounded-md px-3 py-2 ${errors.difficulty_level ? 'border-red-500' : 'border-gray-300'}`}
                                        required
                                    >
                                        <option value="">Select difficulty</option>
                                        {difficultyLevels.map((level) => (
                                            <option key={level} value={level}>
                                                {level}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.difficulty_level && <p className="text-red-600 text-sm mt-1">{errors.difficulty_level[0]}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Instructor Assignment */}
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-900">Instructor Assignment</h4>
                            
                            <div>
                                <Label htmlFor="update_instructor_id">Assign Instructor *</Label>
                                <select
                                    id="update_instructor_id"
                                    value={formData.instructor_id}
                                    onChange={(e) => setFormData({...formData, instructor_id: e.target.value})}
                                    className={`w-full border rounded-md px-3 py-2 ${errors.instructor_id ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                >
                                    <option value="">Select an instructor</option>
                                    {instructors.map((instructor) => (
                                        <option key={instructor.id} value={instructor.id}>
                                            {instructor.name} ({instructor.email})
                                        </option>
                                    ))}
                                </select>
                                {errors.instructor_id && <p className="text-red-600 text-sm mt-1">{errors.instructor_id[0]}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-4 p-6 border-t bg-gray-50">
                        <Button
                            type="submit"
                            variant="create"
                            disabled={loading}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Updating...' : 'Update Course'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}