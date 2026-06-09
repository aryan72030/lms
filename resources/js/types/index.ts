export type * from './auth';
export type * from './navigation';
export type * from './ui';

export interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
    status?: string;
    email_verified_at?: string | null;
    is_admin?: boolean;
    is_instructor?: boolean;
    is_student?: boolean;
    avatar?: string;
}

export interface Course {
    id: number;
    title: string;
    slug?: string;
    description?: string;
    status?: string;
    status_label?: string;
    status_color?: string;
    price?: number;
    thumbnail?: string;
    instructor?: User;
}

export interface Lesson {
    id: number;
    title: string;
    description?: string;
    type: string;
    order: number;
    is_published: boolean;
    estimated_duration?: number;
    text_content?: string;
    video_url?: string;
    video_duration?: number;
    course_id: number;
    assignment_instructions?: string;
    assignment_max_score?: string;
    assignment_due_days?: string;
}

export interface Assignment {
    id: number;
    course_id: number;
    title: string;
    description: string;
    instructions: string;
    max_score: number;
    passing_score: number;
    due_days: number;
    is_published: boolean;
    order: number;
    created_at: string;
    updated_at: string;
    course: {
        id: number;
        title: string;
    };
    submissions_count: number;
    submitted_count: number;
    graded_count: number;
}
