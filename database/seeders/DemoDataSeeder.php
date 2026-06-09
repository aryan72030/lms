<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\CourseCategory;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create demo users
        $admin = User::firstOrCreate(
            ['email' => 'admin@lms.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADMIN,
                'status' => User::STATUS_ACTIVE,
                'email_verified_at' => now(),
            ]
        );

        $instructor = User::firstOrCreate(
            ['email' => 'instructor@lms.com'],
            [
                'name' => 'John Instructor',
                'password' => Hash::make('password'),
                'role' => User::ROLE_INSTRUCTOR,
                'status' => User::STATUS_ACTIVE,
                'email_verified_at' => now(),
            ]
        );

        $student = User::firstOrCreate(
            ['email' => 'student@lms.com'],
            [
                'name' => 'Jane Student',
                'password' => Hash::make('password'),
                'role' => User::ROLE_STUDENT,
                'status' => User::STATUS_ACTIVE,
                'email_verified_at' => now(),
            ]
        );

        // Create course categories
        $webDevCategory = CourseCategory::firstOrCreate(
            ['name' => 'Web Development'],
            [
                'description' => 'Learn modern web development technologies',
                'status' => CourseCategory::STATUS_ACTIVE,
            ]
        );

        $programmingCategory = CourseCategory::firstOrCreate(
            ['name' => 'Programming'],
            [
                'description' => 'Master programming languages and concepts',
                'status' => CourseCategory::STATUS_ACTIVE,
            ]
        );

        // Create demo courses
        $laravelCourse = Course::firstOrCreate(
            ['slug' => 'laravel-fundamentals'],
            [
                'title' => 'Laravel Fundamentals',
                'description' => 'Learn the basics of Laravel framework',
                'objectives' => ['Understand MVC architecture', 'Build web applications', 'Work with databases'],
                'requirements' => ['Basic PHP knowledge', 'HTML/CSS understanding'],
                'target_audience' => ['Beginner developers', 'PHP enthusiasts'],
                'price' => 99.99,
                'duration_hours' => 40,
                'difficulty_level' => Course::DIFFICULTY_BEGINNER,
                'status' => Course::STATUS_PUBLISHED,
                'instructor_id' => $instructor->id,
                'category_id' => $webDevCategory->id,
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'published_at' => now(),
            ]
        );

        $reactCourse = Course::firstOrCreate(
            ['slug' => 'react-for-beginners'],
            [
                'title' => 'React for Beginners',
                'description' => 'Master React.js from scratch',
                'objectives' => ['Understand React components', 'State management', 'Build interactive UIs'],
                'requirements' => ['JavaScript knowledge', 'HTML/CSS basics'],
                'target_audience' => ['Frontend developers', 'JavaScript developers'],
                'price' => 79.99,
                'duration_hours' => 30,
                'difficulty_level' => Course::DIFFICULTY_BEGINNER,
                'status' => Course::STATUS_PUBLISHED,
                'instructor_id' => $instructor->id,
                'category_id' => $webDevCategory->id,
                'approved_by' => $admin->id,
                'approved_at' => now(),
                'published_at' => now(),
            ]
        );

        // Create lessons for Laravel course
        $lessons = [
            [
                'title' => 'Introduction to Laravel',
                'description' => 'Overview of Laravel framework and its features',
                'type' => 'Video',
                'text_content' => 'Laravel is a powerful PHP framework that makes web development enjoyable and creative.',
                'video_url' => 'https://example.com/video1',
                'video_duration' => 2700, // 45 minutes in seconds
                'estimated_duration' => 45,
                'order' => 1,
                'is_published' => true,
            ],
            [
                'title' => 'Setting up Laravel Environment',
                'description' => 'Install and configure Laravel development environment',
                'type' => 'Video',
                'text_content' => 'In this lesson, we will set up Laravel development environment step by step.',
                'video_url' => 'https://example.com/video2',
                'video_duration' => 1800, // 30 minutes in seconds
                'estimated_duration' => 30,
                'order' => 2,
                'is_published' => true,
            ],
            [
                'title' => 'Understanding MVC Architecture',
                'description' => 'Learn about Model-View-Controller pattern in Laravel',
                'type' => 'Text',
                'text_content' => 'MVC is a design pattern that separates application logic into three interconnected components: Model, View, and Controller.',
                'estimated_duration' => 60,
                'order' => 3,
                'is_published' => true,
            ],
        ];

        foreach ($lessons as $lessonData) {
            Lesson::firstOrCreate(
                [
                    'course_id' => $laravelCourse->id,
                    'title' => $lessonData['title']
                ],
                array_merge($lessonData, [
                    'course_id' => $laravelCourse->id,
                ])
            );
        }

        // Create assignments
        CourseAssignment::firstOrCreate(
            [
                'course_id' => $laravelCourse->id,
                'title' => 'Build a Simple Blog'
            ],
            [
                'instructions' => "Build a simple blog application with the following features:\n\n1. User authentication\n2. Create, read, update, delete posts\n3. Comment system\n4. Basic styling with Bootstrap\n\nSubmit your code via GitHub repository link.",
                'max_score' => 100,
                'passing_score' => 70,
                'due_days' => 7,
                'is_published' => true,
                'order' => 1,
            ]
        );

        CourseAssignment::firstOrCreate(
            [
                'course_id' => $reactCourse->id,
                'title' => 'Todo App with React'
            ],
            [
                'instructions' => "Create a todo application with these features:\n\n1. Add new todos\n2. Mark todos as complete\n3. Delete todos\n4. Filter todos (all, active, completed)\n5. Local storage persistence\n\nSubmit your project as a zip file or GitHub link.",
                'max_score' => 100,
                'passing_score' => 70,
                'due_days' => 5,
                'is_published' => true,
                'order' => 1,
            ]
        );

        // Create quizzes
        $laravelQuiz = Quiz::firstOrCreate(
            [
                'course_id' => $laravelCourse->id,
                'title' => 'Laravel Basics Quiz'
            ],
            [
                'description' => 'Test your knowledge of Laravel fundamentals. Answer all questions to complete the quiz.',
                'time_limit' => 30,
                'total_marks' => 30,
                'max_attempts' => 3,
                'passing_score' => 70.00,
                'is_active' => true,
                'is_final_quiz' => true,
                'order' => 1,
            ]
        );

        // Create quiz questions
        $questions = [
            [
                'question_text' => 'What does MVC stand for?',
                'question_type' => 'multiple_choice',
                'options' => [
                    'Model-View-Controller',
                    'Model-View-Component',
                    'Module-View-Controller',
                    'Model-Virtual-Controller'
                ],
                'correct_answer' => 'Model-View-Controller',
                'points' => 10,
                'order' => 1,
                'is_active' => true,
            ],
            [
                'question_text' => 'Which command is used to create a new Laravel project?',
                'question_type' => 'multiple_choice',
                'options' => [
                    'laravel new project-name',
                    'composer create-project laravel/laravel project-name',
                    'php artisan new project-name',
                    'npm create laravel project-name'
                ],
                'correct_answer' => 'composer create-project laravel/laravel project-name',
                'points' => 10,
                'order' => 2,
                'is_active' => true,
            ],
            [
                'question_text' => 'What is Eloquent in Laravel?',
                'question_type' => 'multiple_choice',
                'options' => [
                    'A templating engine',
                    'An ORM (Object-Relational Mapping)',
                    'A routing system',
                    'A testing framework'
                ],
                'correct_answer' => 'An ORM (Object-Relational Mapping)',
                'points' => 10,
                'order' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($questions as $questionData) {
            QuizQuestion::firstOrCreate(
                [
                    'quiz_id' => $laravelQuiz->id,
                    'question_text' => $questionData['question_text']
                ],
                array_merge($questionData, [
                    'quiz_id' => $laravelQuiz->id,
                ])
            );
        }

        // Create enrollment for student
        Enrollment::firstOrCreate(
            [
                'student_id' => $student->id,
                'course_id' => $laravelCourse->id,
            ],
            [
                'enrollment_date' => now(),
                'payment_status' => Enrollment::PAYMENT_STATUS_COMPLETED,
                'payment_method' => Enrollment::METHOD_FREE,
                'status' => Enrollment::STATUS_ACTIVE,
                'progress' => 25.0,
                'amount_paid' => 0.00,
            ]
        );

        // Create system settings
        $settings = [
            ['key' => 'site_name', 'value' => 'LMS Academy'],
            ['key' => 'site_description', 'value' => 'Learn and grow with our comprehensive courses'],
            ['key' => 'require_final_quiz', 'value' => 'true'],
            ['key' => 'auto_approve_courses', 'value' => 'false'],
            ['key' => 'paypal_mode', 'value' => 'sandbox'],
            ['key' => 'paypal_client_id', 'value' => 'your-paypal-client-id'],
            ['key' => 'paypal_client_secret', 'value' => 'your-paypal-client-secret'],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('Demo data seeded successfully!');
        $this->command->info('Login credentials:');
        $this->command->info('Admin: admin@lms.com / password');
        $this->command->info('Instructor: instructor@lms.com / password');
        $this->command->info('Student: student@lms.com / password');
    }
}