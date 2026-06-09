<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\HasRoleBasedAuthorization;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseCategory;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CourseCategoryController extends Controller
{
    use HasRoleBasedAuthorization;

    /**
     * Display a listing of course categories
     */
    public function index(Request $request): Response
    {
        $this->ensureAdmin($request);

        $query = CourseCategory::query();

        if ($request->filled('search')) {
            $search = $request->get('search');

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $categories = $query
            ->orderBy('created_at', 'desc')
            ->paginate((int) Setting::get('pagination_limit', 10))
            ->withQueryString()
            ->through(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'status' => $category->status,
                    'status_label' => $category->status_label,
                    'created_at' => $category->created_at->format('M d, Y'),
                    'updated_at' => $category->updated_at->format('M d, Y'),
                    'deleted_at' => $category->deleted_at,
                    'is_deleted' => $category->trashed(),
                ];
            });

        return Inertia::render('admin/course-categories/index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created category
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $this->ensureAdmin($request);

        $rules = [
            'name' => ['required', 'string', 'max:255', 'unique:course_categories,name'],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['boolean'],
        ];

        if (! $request->expectsJson()) {
            $validated = $request->validate($rules);

            try {
                $category = CourseCategory::create([
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'status' => $validated['status'] ?? true,
                ]);

                return redirect()
                    ->route('admin.course-categories.index')
                    ->with('success', "Category '{$category->name}' created successfully.");
            } catch (\Exception $e) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', 'Failed to create category. Please try again.');
            }
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $category = CourseCategory::create([
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status ?? true,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Category '{$category->name}' created successfully.",
                'category' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description,
                    'status' => $category->status,
                    'status_label' => $category->status_label,
                    'created_at' => $category->created_at->format('M d, Y'),
                    'updated_at' => $category->updated_at->format('M d, Y'),
                    'deleted_at' => null,
                    'is_deleted' => false,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create category. Please try again.',
            ], 500);
        }
    }

    /**
     * Update the specified category
     */
    public function update(Request $request, CourseCategory $courseCategory): JsonResponse|RedirectResponse
    {
        $this->ensureAdmin($request);

        $rules = [
            'name' => ['required', 'string', 'max:255', Rule::unique('course_categories')->ignore($courseCategory->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['boolean'],
        ];

        if (! $request->expectsJson()) {
            $validated = $request->validate($rules);

            try {
                $courseCategory->update([
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'status' => $validated['status'] ?? $courseCategory->status,
                ]);

                return redirect()
                    ->route('admin.course-categories.index')
                    ->with('success', "Category '{$courseCategory->name}' updated successfully.");
            } catch (\Exception $e) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', 'Failed to update category. Please try again.');
            }
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $courseCategory->update([
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status ?? $courseCategory->status,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Category '{$courseCategory->name}' updated successfully.",
                'category' => [
                    'id' => $courseCategory->id,
                    'name' => $courseCategory->name,
                    'description' => $courseCategory->description,
                    'status' => $courseCategory->status,
                    'status_label' => $courseCategory->status_label,
                    'created_at' => $courseCategory->created_at->format('M d, Y'),
                    'updated_at' => $courseCategory->updated_at->format('M d, Y'),
                    'deleted_at' => $courseCategory->deleted_at,
                    'is_deleted' => $courseCategory->trashed(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update category. Please try again.',
            ], 500);
        }
    }

    /**
     * Remove the specified category
     */
    public function destroy(Request $request, CourseCategory $courseCategory): JsonResponse|RedirectResponse
    {
        $this->ensureAdmin($request);

        try {
            $activeCoursesCount = $courseCategory->courses()
                ->where('status', '!=', Course::STATUS_ARCHIVED)
                ->count();

            if ($activeCoursesCount > 0) {
                if (! $request->expectsJson()) {
                    return redirect()
                        ->route('admin.course-categories.index')
                        ->with('error', "Cannot delete category '{$courseCategory->name}' because it still has {$activeCoursesCount} active course(s). Archive or move those courses first.");
                }

                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete category '{$courseCategory->name}' because it still has {$activeCoursesCount} active course(s). Archive or move those courses first.",
                ], 422);
            }
            
            $categoryName = $courseCategory->name;
            $courseCategory->delete();

            if (! $request->expectsJson()) {
                return redirect()
                    ->route('admin.course-categories.index')
                    ->with('success', "Category '{$categoryName}' deleted successfully.");
            }

            return response()->json([
                'success' => true,
                'message' => "Category '{$categoryName}' deleted successfully.",
            ]);
        } catch (\Exception $e) {
            if (! $request->expectsJson()) {
                return redirect()
                    ->route('admin.course-categories.index')
                    ->with('error', 'Failed to delete category. Please try again.');
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete category. Please try again.',
            ], 500);
        }
    }

    /**
     * Toggle category status
     */
    public function toggleStatus(Request $request, CourseCategory $courseCategory): JsonResponse|RedirectResponse
    {
        $this->ensureAdmin($request);

        try {
            // If trying to deactivate and category has active courses
            if ($courseCategory->status && $courseCategory->courses()->count() > 0) {
                if (! $request->expectsJson()) {
                    return redirect()
                        ->back()
                        ->with('error', "Category '{$courseCategory->name}' cannot be deactivated because it has active courses. Please unassign or archive courses first.");
                }

                return response()->json([
                    'success' => false,
                    'message' => "Category '{$courseCategory->name}' cannot be deactivated because it has active courses. Please unassign or archive courses first.",
                ], 422);
            }

            $courseCategory->update([
                'status' => ! $courseCategory->status,
            ]);

            $statusText = $courseCategory->status ? 'activated' : 'deactivated';

            if (! $request->expectsJson()) {
                return redirect()
                    ->route('admin.course-categories.index')
                    ->with('success', "Category '{$courseCategory->name}' {$statusText} successfully.");
            }

            return response()->json([
                'success' => true,
                'message' => "Category '{$courseCategory->name}' {$statusText} successfully.",
                'category' => [
                    'id' => $courseCategory->id,
                    'name' => $courseCategory->name,
                    'description' => $courseCategory->description,
                    'status' => $courseCategory->status,
                    'status_label' => $courseCategory->status_label,
                    'created_at' => $courseCategory->created_at->format('M d, Y'),
                    'updated_at' => $courseCategory->updated_at->format('M d, Y'),
                    'deleted_at' => $courseCategory->deleted_at,
                    'is_deleted' => $courseCategory->trashed(),
                ],
            ]);
        } catch (\Exception $e) {
            if (! $request->expectsJson()) {
                return redirect()
                    ->back()
                    ->with('error', 'Failed to toggle category status. Please try again.');
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle category status. Please try again.',
            ], 500);
        }
    }
}
