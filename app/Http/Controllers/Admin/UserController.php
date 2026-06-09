<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\HasRoleBasedAuthorization;
use App\Http\Controllers\Controller;
use App\Mail\UserCreated;
use App\Models\Course;
use App\Models\Setting;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    use HasRoleBasedAuthorization;

    /**
     * Display a listing of users
     */
    public function index(Request $request): Response
    {
        $this->ensureAdmin($request);

        $query = User::query()->where('role', '!=', User::ROLE_ADMIN);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->filled('role')) {
            $query->where('role', $request->get('role'));
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $users = $query->latest()
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'date_of_birth' => $user->date_of_birth ? $user->date_of_birth->format('Y-m-d') : null,
                'status' => $user->status ?? 'Active',
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at->format('M d, Y'),
                'created_at_human' => $user->created_at->diffForHumans(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status']),
            'roles' => [
                User::ROLE_INSTRUCTOR,
                User::ROLE_STUDENT,
            ],
            'statuses' => ['Active', 'Inactive'],
        ]);
    }

    /**
     * Show the form for creating a new user
     */
    public function create(Request $request): Response
    {
        $this->ensureAdmin($request);

        return Inertia::render('admin/users/create', [
            'roles' => [
                User::ROLE_ADMIN,
                User::ROLE_INSTRUCTOR,
                User::ROLE_STUDENT,
            ],
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $user = null;

        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
                'password' => ['required', 'string', 'min:8', 'confirmed'],
                'role' => [
                    'required',
                    'string',
                    Rule::in([User::ROLE_INSTRUCTOR, User::ROLE_STUDENT]),
                ],
                'phone' => ['nullable', 'string', 'max:20'],
                'date_of_birth' => ['nullable', 'date', 'before:today'],
                'status' => ['required', 'string', Rule::in(['Active', 'Inactive'])],
            ]);
        } catch (ValidationException $e) {
            // Handle AJAX validation errors
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        }

        try {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'phone' => $validated['phone'],
                'date_of_birth' => $validated['date_of_birth'],
                'status' => $validated['status'],
                'email_verified_at' => $validated['status'] === 'Active' ? now() : null,
            ]);

            // Send welcome email
            try {
                $emailSettings = Setting::getEmailSettings();
                $emailEnabled = (bool) ($emailSettings['enabled'] ?? false);
                $registrationEnabled = (bool) ($emailSettings['types']['user_registration'] ?? false);

                if ($emailEnabled && $registrationEnabled) {
                    // Check SMTP is configured before attempting
                    $smtpHost = $emailSettings['smtp_host'] ?? null;
                    if ($smtpHost) {
                        try {
                            Mail::to($user->email)->send(new UserCreated($user, $validated['password']));
                        } catch (\Throwable $mailException) {
                            Log::error('Failed to send welcome email to user: ' . $user->email, [
                                'error' => $mailException->getMessage(),
                                'user_id' => $user->id,
                            ]);
                        }
                    }
                }
            } catch (\Throwable $settingsException) {
                Log::error('Failed to load email settings during user creation', [
                    'error' => $settingsException->getMessage(),
                    'user_id' => $user->id,
                ]);
            }

            // Send Slack notification
            try {
                $notificationService = new NotificationService();
                $notificationService->notifyUserRegistration([
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role
                ]);
            } catch (\Throwable $slackException) {
                Log::error('Failed to send Slack notification for user registration', [
                    'error' => $slackException->getMessage(),
                    'user_id' => $user->id
                ]);
            }

            // Handle AJAX requests (from modal)
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "User '{$user->name}' created successfully.",
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'status' => $user->status,
                    ]
                ]);
            }

            // Handle regular form submissions
            return redirect()->route('admin.users.index')
                ->with('success', "User '{$user->name}' created successfully.");
                
        } catch (\Throwable $e) {
            Log::error('User creation flow failed', [
                'error' => $e->getMessage(),
                'user_id' => $user?->id,
            ]);

            // If the user was created but a later step failed, don't show a false failure.
            if ($user && $user->exists) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => true,
                        'message' => "User '{$user->name}' created successfully (with warnings).",
                        'user' => [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'role' => $user->role,
                            'status' => $user->status,
                        ],
                    ]);
                }

                return redirect()->route('admin.users.index')
                    ->with('success', "User '{$user->name}' created successfully (with warnings).");
            }

            // Handle AJAX errors
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create user. Please try again.'
                ], 500);
            }
            
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to create user. Please try again.');
        }
    }

    /**
     * Display the specified user
     */
    public function show(Request $request, User $user): Response
    {
        $this->ensureAdmin($request);

        return Inertia::render('admin/users/show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'date_of_birth' => $user->date_of_birth ? $user->date_of_birth->format('Y-m-d') : null,
                'status' => $user->status ?? 'Active',
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at->format('M d, Y H:i'),
                'updated_at' => $user->updated_at->format('M d, Y H:i'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified user
     */
    public function edit(Request $request, User $user): Response
    {
        $this->ensureAdmin($request);

        return Inertia::render('admin/users/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'date_of_birth' => $user->date_of_birth ? $user->date_of_birth->format('Y-m-d') : null,
                'status' => $user->status ?? 'Active',
            ],
            'roles' => [
                User::ROLE_ADMIN,
                User::ROLE_INSTRUCTOR,
                User::ROLE_STUDENT,
            ],
        ]);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
                'password' => ['nullable', 'string', 'min:8', 'confirmed'],
                'role' => ['required', 'string', Rule::in([User::ROLE_ADMIN, User::ROLE_INSTRUCTOR, User::ROLE_STUDENT])],
                'phone' => ['nullable', 'string', 'max:20'],
                'date_of_birth' => ['nullable', 'date', 'before:today'],
                'status' => ['required', 'string', Rule::in(['Active', 'Inactive'])],
            ]);
        } catch (ValidationException $e) {
            // Handle AJAX validation errors
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        }

        try {
            $updateData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role' => $validated['role'],
                'phone' => $validated['phone'],
                'date_of_birth' => $validated['date_of_birth'],
                'status' => $validated['status'],
            ];

            // Only update password if provided
            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            // Handle email verification based on status
            if ($validated['status'] === 'Active' && !$user->email_verified_at) {
                $updateData['email_verified_at'] = now();
            } elseif ($validated['status'] === 'Inactive') {
                $updateData['email_verified_at'] = null;
            }

            $user->update($updateData);

            // Handle AJAX requests (from popper)
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "User '{$user->name}' updated successfully.",
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'status' => $user->status,
                    ]
                ]);
            }

            // Handle regular form submissions
            return redirect()->route('admin.users.index')
                ->with('success', "User '{$user->name}' updated successfully.");
                
        } catch (\Exception $e) {
            // Handle AJAX errors
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update user. Please try again.'
                ], 500);
            }
            
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update user. Please try again.');
        }
    }

    /**
     * Remove the specified user
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->ensureAdmin($request);

        // Prevent deleting own account
        if ($user->id === $request->user()->id) {
            return redirect()->route('admin.users.index')
                ->with('error', 'You cannot delete your own account.');
        }

        $activeCoursesCount = $user->courses()
            ->where('status', '!=', Course::STATUS_ARCHIVED)
            ->count();

        if ($activeCoursesCount > 0) {
            return redirect()->route('admin.users.index')
                ->with('error', "Cannot delete user '{$user->name}' because they still own {$activeCoursesCount} active course(s).");
        }

        $enrollmentsCount = $user->enrollments()->count();

        if ($enrollmentsCount > 0) {
            return redirect()->route('admin.users.index')
                ->with('error', "Cannot delete user '{$user->name}' because they still have {$enrollmentsCount} enrollment record(s).");
        }

        $userName = $user->name;
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', "User '{$userName}' deleted successfully.");
    }

    /**
     * Toggle user status (Active/Inactive)
     */
    public function toggleStatus(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        // Prevent deactivating own account
        if ($user->id === $request->user()->id) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot deactivate your own account.'
                ], 400);
            }
            
            return redirect()->route('admin.users.index')
                ->with('error', 'You cannot deactivate your own account.');
        }

        try {
            $validated = $request->validate([
                'status' => ['required', 'string', Rule::in(['Active', 'Inactive'])],
            ]);
        } catch (ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid status value',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        }

        try {
            $oldStatus = $user->status;
            $newStatus = $validated['status'];
            
            $user->update([
                'status' => $newStatus,
                // Clear email verification if deactivating
                'email_verified_at' => $newStatus === 'Inactive' ? null : ($user->email_verified_at ?: now()),
            ]);

            $action = $newStatus === 'Active' ? 'activated' : 'deactivated';
            $message = "User '{$user->name}' has been {$action} successfully.";

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'status' => $user->status,
                    ]
                ]);
            }

            return redirect()->route('admin.users.index')
                ->with('success', $message);
                
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update user status. Please try again.'
                ], 500);
            }
            
            return redirect()->back()
                ->with('error', 'Failed to update user status. Please try again.');
        }
    }
}
