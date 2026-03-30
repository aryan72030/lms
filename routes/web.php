<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\CourseCategoryController as AdminCourseCategoryController;
use App\Http\Controllers\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Admin\EnrollmentController as AdminEnrollmentController;
use App\Http\Controllers\Admin\QuizController as AdminQuizController;
use App\Http\Controllers\Admin\AssignmentController as AdminAssignmentController;
use App\Http\Controllers\Instructor\DashboardController as InstructorDashboardController;
use App\Http\Controllers\Instructor\CourseController as InstructorCourseController;
use App\Http\Controllers\Instructor\LessonController as InstructorLessonController;
use App\Http\Controllers\Instructor\QuizController as InstructorQuizController;
use App\Http\Controllers\Instructor\EnrollmentController as InstructorEnrollmentController;
use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\Student\EnrollmentController as StudentEnrollmentController;
use App\Http\Controllers\Student\CourseController as StudentCourseController;
use App\Http\Controllers\Student\QuizController as StudentQuizController;
use App\Http\Controllers\Student\AssignmentController as StudentAssignmentController;
use App\Http\Controllers\Student\WishlistController as StudentWishlistController;
use App\Http\Controllers\Student\LessonProgressController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\PublicStorageController;
use App\Http\Controllers\PayPalController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Inertia\Inertia;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth'])->get('/dashboard', function () {
    $user = request()->user();

    return redirect()->route(match ($user?->role) {
        \App\Models\User::ROLE_ADMIN => 'admin.dashboard',
        \App\Models\User::ROLE_INSTRUCTOR => 'instructor.dashboard',
        default => 'student.dashboard',
    });
})->name('dashboard');

// Admin Routes - Full Access
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    
    // User Management
    Route::resource('users', AdminUserController::class);
    Route::patch('users/{user}/toggle-status', [AdminUserController::class, 'toggleStatus'])->name('users.toggle-status');
    
    // Course Category Management (AJAX)
    Route::get('course-categories', [AdminCourseCategoryController::class, 'index'])->name('course-categories.index');
    Route::post('course-categories', [AdminCourseCategoryController::class, 'store'])->name('course-categories.store');
    Route::put('course-categories/{courseCategory}', [AdminCourseCategoryController::class, 'update'])->name('course-categories.update');
    Route::delete('course-categories/{courseCategory}', [AdminCourseCategoryController::class, 'destroy'])->name('course-categories.destroy');
    Route::patch('course-categories/{courseCategory}/toggle-status', [AdminCourseCategoryController::class, 'toggleStatus'])->name('course-categories.toggle-status');
    
    // Course Management with Approval Workflow
    Route::resource('courses', AdminCourseController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy', 'show']);
    // Lesson Management within Course
    Route::resource('courses.lessons', AdminLessonController::class);
    Route::patch('courses/{course}/lessons/{lesson}/toggle-status', [AdminLessonController::class, 'toggleStatus'])->name('courses.lessons.toggle-status');
    
    // Course Sections
    Route::post('courses/{course}/sections', [AdminLessonController::class, 'storeSection'])->name('courses.sections.store');
    Route::put('courses/{course}/sections/{section}', [AdminLessonController::class, 'updateSection'])->name('courses.sections.update');
    Route::delete('courses/{course}/sections/{section}', [AdminLessonController::class, 'destroySection'])->name('courses.sections.destroy');
    Route::get('lessons', [AdminLessonController::class, 'allLessons'])->name('lessons.index');
    Route::get('lessons/create', [AdminLessonController::class, 'createStandalone'])->name('lessons.create');
    Route::post('lessons', [AdminLessonController::class, 'storeStandalone'])->name('lessons.store');
    Route::get('lessons/{lesson}/edit', [AdminLessonController::class, 'editStandalone'])->name('lessons.edit');
    Route::put('lessons/{lesson}', [AdminLessonController::class, 'updateStandalone'])->name('lessons.update');
    Route::delete('lessons/{lesson}', [AdminLessonController::class, 'destroyStandalone'])->name('lessons.destroy');
    Route::patch('courses/{course}/approve', [AdminCourseController::class, 'approve'])->name('courses.approve');
    Route::patch('courses/{course}/reject', [AdminCourseController::class, 'reject'])->name('courses.reject');
    Route::patch('courses/{course}/archive', [AdminCourseController::class, 'archive'])->name('courses.archive');
    Route::patch('courses/{course}/republish', [AdminCourseController::class, 'republish'])->name('courses.republish');
    Route::patch('courses/{course}/force-submit', [AdminCourseController::class, 'forceSubmit'])->name('courses.force-submit');
    
    // Quiz Management
    Route::resource('quizzes', AdminQuizController::class);
    Route::patch('quizzes/{quiz}/toggle-status', [AdminQuizController::class, 'toggleStatus'])->name('quizzes.toggle-status');
    Route::get('quizzes/{quiz}/attempts', [AdminQuizController::class, 'attempts'])->name('quizzes.attempts');
    Route::get('quiz-attempts/{attempt}/details', [AdminQuizController::class, 'attemptDetails'])->name('quiz-attempts.details');

    // Assignment Management
    Route::get('assignments', [AdminAssignmentController::class, 'index'])->name('assignments.index');
    Route::get('assignments/{lesson}', [AdminAssignmentController::class, 'show'])->name('assignments.show');
    Route::post('submissions/{submission}/grade', [AdminAssignmentController::class, 'grade'])->name('assignments.grade');
    
    // Enrollment Management
    Route::resource('enrollments', AdminEnrollmentController::class);
    Route::patch('enrollments/bulk-update', [AdminEnrollmentController::class, 'bulkUpdate'])->name('enrollments.bulk-update');
    
    // System Settings
    Route::get('settings', [App\Http\Controllers\Admin\SettingController::class, 'index'])->name('settings.index');
    Route::post('settings/payment', [App\Http\Controllers\Admin\SettingController::class, 'updatePaymentSettings'])->name('settings.payment');
    Route::post('settings/general', [App\Http\Controllers\Admin\SettingController::class, 'updateGeneralSettings'])->name('settings.general');
    Route::post('settings/course', [App\Http\Controllers\Admin\SettingController::class, 'updateCourseSettings'])->name('settings.course');
    Route::post('settings/notification', [App\Http\Controllers\Admin\SettingController::class, 'updateNotificationSettings'])->name('settings.notification');
    Route::post('settings/test-paypal', [App\Http\Controllers\Admin\SettingController::class, 'testPayPalConnection'])->name('settings.test-paypal');
    Route::post('settings/test-email', [App\Http\Controllers\Admin\SettingController::class, 'testEmailConnection'])->name('settings.test-email');
    Route::post('settings/test-slack', [App\Http\Controllers\Admin\SettingController::class, 'testSlackConnection'])->name('settings.test-slack');
    
    // Debug route
    Route::inertia('debug', 'debug-routes')->name('debug');
});

// Instructor Routes - Own Data Only
Route::middleware(['auth', 'verified', 'instructor'])->prefix('instructor')->name('instructor.')->group(function () {
    Route::get('dashboard', [InstructorDashboardController::class, 'index'])->name('dashboard');
    
    // Course Management
    Route::resource('courses', InstructorCourseController::class)->except(['show']);
    Route::patch('courses/{course}/submit-for-review', [InstructorCourseController::class, 'submitForReview'])->name('courses.submit-for-review');
    
    // Enrollment Management
    Route::get('enrollments', [InstructorEnrollmentController::class, 'index'])->name('enrollments.index');
    Route::get('enrollments/{enrollment}', [InstructorEnrollmentController::class, 'show'])->name('enrollments.show');
    
    // Quiz Management
    Route::resource('quizzes', InstructorQuizController::class);
    Route::post('quizzes/{quiz}/questions', [InstructorQuizController::class, 'storeQuestion'])->name('quizzes.questions.store');
    Route::put('quizzes/{quiz}/questions/{question}', [InstructorQuizController::class, 'updateQuestion'])->name('quizzes.questions.update');
    Route::delete('quizzes/{quiz}/questions/{question}', [InstructorQuizController::class, 'destroyQuestion'])->name('quizzes.questions.destroy');
    Route::post('quizzes/{quiz}/reorder-questions', [InstructorQuizController::class, 'reorderQuestions'])->name('quizzes.reorder-questions');
    
    // Lesson Management (nested under courses)
    Route::resource('courses.lessons', InstructorLessonController::class);
    Route::patch('courses/{course}/lessons/reorder', [InstructorLessonController::class, 'reorder'])->name('courses.lessons.reorder');
    Route::patch('courses/{course}/lessons/{lesson}/move-up', [InstructorLessonController::class, 'moveUp'])->name('courses.lessons.move-up');
    Route::patch('courses/{course}/lessons/{lesson}/move-down', [InstructorLessonController::class, 'moveDown'])->name('courses.lessons.move-down');
    
    // Standalone Lesson Management
    Route::get('lessons', [InstructorLessonController::class, 'allLessons'])->name('lessons.index');
    Route::get('lessons/create', [InstructorLessonController::class, 'createStandalone'])->name('lessons.create');
    Route::post('lessons', [InstructorLessonController::class, 'storeStandalone'])->name('lessons.store');
    Route::get('lessons/{lesson}', [InstructorLessonController::class, 'showStandalone'])->name('lessons.show');
    Route::get('lessons/{lesson}/edit', [InstructorLessonController::class, 'editStandalone'])->name('lessons.edit');
    Route::put('lessons/{lesson}', [InstructorLessonController::class, 'updateStandalone'])->name('lessons.update');
    Route::delete('lessons/{lesson}', [InstructorLessonController::class, 'destroyStandalone'])->name('lessons.destroy');

    // Assignment Management
    Route::get('assignments', [App\Http\Controllers\Instructor\AssignmentController::class, 'index'])->name('assignments.index');
    Route::get('assignments/{lesson}', [App\Http\Controllers\Instructor\AssignmentController::class, 'show'])->name('assignments.show');
    Route::post('submissions/{submission}/grade', [App\Http\Controllers\Instructor\AssignmentController::class, 'grade'])->name('assignments.grade');
});

// Student Routes - Enrolled Courses Only
Route::middleware(['auth', 'verified', 'student'])->prefix('student')->name('student.')->group(function () {
    Route::get('dashboard', [StudentDashboardController::class, 'index'])->name('dashboard');
    
    // Course Browsing
    Route::get('courses', [StudentCourseController::class, 'index'])->name('courses.index');
    Route::get('courses/{course}', [StudentCourseController::class, 'show'])->name('courses.show');
    
    // Quiz Management
    Route::get('quizzes', [StudentQuizController::class, 'index'])->name('quizzes.index');
    Route::get('quizzes/{quiz}/start', [StudentQuizController::class, 'start'])->name('quizzes.start');
    Route::match(['get', 'post'], 'quizzes/{quiz}/attempt', [StudentQuizController::class, 'attempt'])->name('quizzes.attempt');
    Route::get('quizzes/{quiz}/results', [StudentQuizController::class, 'quizResults'])->name('quizzes.results');
    Route::get('quiz-attempts/{attempt}/take', [StudentQuizController::class, 'take'])->name('quiz-attempts.take');
    Route::patch('quiz-attempts/{attempt}/answer', [StudentQuizController::class, 'answer'])->name('quiz-attempts.answer');
    Route::post('quiz-attempts/{attempt}/submit', [StudentQuizController::class, 'submit'])->name('quiz-attempts.submit');
    Route::get('quiz-attempts/{attempt}/results', [StudentQuizController::class, 'results'])->name('quiz-attempts.results');

    // Legacy quiz lesson routes (backward compatibility)
    Route::get('lessons/{lesson}/quiz', [StudentQuizController::class, 'legacyLessonQuiz'])->name('lessons.quiz.show');
    Route::post('lessons/{lesson}/quiz/attempt', [StudentQuizController::class, 'legacyLessonAttempt'])->name('lessons.quiz.attempt');
    
    // Assignment Management
    Route::get('lessons/{lesson}/assignment', [StudentAssignmentController::class, 'show'])->name('lessons.assignment.show');
    Route::post('lessons/{lesson}/assignment/submit', [StudentAssignmentController::class, 'submit'])->name('lessons.assignment.submit');
    Route::post('lessons/{lesson}/assignment/draft', [StudentAssignmentController::class, 'saveDraft'])->name('lessons.assignment.draft');
    
    // Enrollment Management
    Route::get('enrollments', [StudentEnrollmentController::class, 'index'])->name('enrollments.index');
    Route::post('enrollments', [StudentEnrollmentController::class, 'store'])->name('enrollments.store');
    Route::get('enrollments/{enrollment}', [StudentEnrollmentController::class, 'show'])->name('enrollments.show');
    Route::patch('enrollments/{enrollment}/progress', [StudentEnrollmentController::class, 'updateProgress'])->name('enrollments.update-progress');
    Route::delete('enrollments/{enrollment}/cancel', [StudentEnrollmentController::class, 'cancel'])->name('enrollments.cancel');
    Route::get('enrollment-statistics', [StudentEnrollmentController::class, 'statistics'])->name('enrollment-statistics');
    Route::post('check-enrollment', [StudentEnrollmentController::class, 'checkEnrollment'])->name('check-enrollment');
    Route::get('certificates', [StudentEnrollmentController::class, 'certificates'])->name('certificates.index');
    
    // Wishlist Management
    Route::get('wishlist', [StudentWishlistController::class, 'index'])->name('wishlist.index');
    Route::post('wishlist', [StudentWishlistController::class, 'store'])->name('wishlist.store');
    Route::post('wishlist/toggle', [StudentWishlistController::class, 'toggle'])->name('wishlist.toggle');
    Route::delete('wishlist/{wishlist}', [StudentWishlistController::class, 'destroy'])->name('wishlist.destroy');
    
    // Lesson Progress Tracking
    Route::post('lessons/{lesson}/complete', [LessonProgressController::class, 'markComplete'])->name('lessons.complete');
    Route::post('lessons/{lesson}/incomplete', [LessonProgressController::class, 'markIncomplete'])->name('lessons.incomplete');
    Route::get('courses/{courseId}/progress', [LessonProgressController::class, 'getCourseProgress'])->name('courses.progress');
    Route::get('courses/{courseId}/lesson-progress', [LessonProgressController::class, 'getLessonProgress'])->name('courses.lesson-progress');
});

// Certificate Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('enrollments/{enrollment}/certificate/generate', [CertificateController::class, 'generate'])->name('certificates.generate');
    Route::get('enrollments/{enrollment}/certificate/download', [CertificateController::class, 'download'])->name('certificates.download');
    Route::get('enrollments/{enrollment}/certificate/view', [CertificateController::class, 'view'])->name('certificates.view');
});

// Public Certificate Verification
Route::get('verify/{certificateId}', [CertificateController::class, 'verify'])->name('certificates.verify');

// Fallback storage route (helps when public/storage symlink is missing on Windows)
Route::get('storage/{path}', [PublicStorageController::class, 'show'])
    ->where('path', '.*')
    ->name('storage.fallback');

// Preferred public file route (avoids conflicts when public/storage is broken)
Route::get('files/{path}', [PublicStorageController::class, 'show'])
    ->where('path', '.*')
    ->name('files.show');

// PayPal Payment Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('paypal/create-payment', [PayPalController::class, 'createPayment'])->name('paypal.create-payment');
    Route::get('paypal/success', [PayPalController::class, 'paymentSuccess'])->name('paypal.success');
    Route::get('paypal/cancel', [PayPalController::class, 'paymentCancel'])->name('paypal.cancel');
    Route::get('paypal/payment-status', [PayPalController::class, 'getPaymentStatus'])->name('paypal.payment-status');
});

// PayPal Webhook (no auth required)
Route::post('paypal/webhook', [PayPalController::class, 'webhook'])->name('paypal.webhook');



require __DIR__.'/settings.php';
