<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Http\Request;

trait HasRoleBasedAuthorization
{
    /**
     * Ensure user is admin
     */
    protected function ensureAdmin(Request $request): void
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            abort(403, 'Admin privileges required.');
        }
    }
    
    /**
     * Ensure user is instructor
     */
    protected function ensureInstructor(Request $request): void
    {
        if (!$request->user() || !$request->user()->isInstructor()) {
            abort(403, 'Instructor privileges required.');
        }
    }
    
    /**
     * Ensure user is student
     */
    protected function ensureStudent(Request $request): void
    {
        if (!$request->user() || !$request->user()->isStudent()) {
            abort(403, 'Student privileges required.');
        }
    }
    
    /**
     * Ensure user has specific role
     */
    protected function ensureRole(Request $request, string $role): void
    {
        if (!$request->user() || !$request->user()->hasRole($role)) {
            abort(403, "Access denied. {$role} role required.");
        }
    }
    
    /**
     * Ensure user has any of the specified roles
     */
    protected function ensureAnyRole(Request $request, array $roles): void
    {
        if (!$request->user()) {
            abort(403, 'Authentication required.');
        }
        
        $userRole = $request->user()->role;
        if (!in_array($userRole, $roles)) {
            $rolesString = implode(', ', $roles);
            abort(403, "Access denied. One of these roles required: {$rolesString}");
        }
    }
    
    /**
     * Check if user can access own resource or is admin
     */
    protected function ensureOwnershipOrAdmin(Request $request, int $resourceUserId): void
    {
        $user = $request->user();
        
        if (!$user) {
            abort(403, 'Authentication required.');
        }
        
        // Admin can access everything
        if ($user->isAdmin()) {
            return;
        }
        
        // User can only access their own resources
        if ($user->id !== $resourceUserId) {
            abort(403, 'You can only access your own resources.');
        }
    }
    
    /**
     * Check if instructor can access their own course or admin can access any
     */
    protected function ensureInstructorOwnershipOrAdmin(Request $request, int $courseInstructorId): void
    {
        $user = $request->user();
        
        if (!$user) {
            abort(403, 'Authentication required.');
        }
        
        // Admin can access everything
        if ($user->isAdmin()) {
            return;
        }
        
        // Must be instructor
        if (!$user->isInstructor()) {
            abort(403, 'Instructor privileges required.');
        }
        
        // Instructor can only access their own courses
        if ($user->id !== $courseInstructorId) {
            abort(403, 'You can only access your own courses.');
        }
    }
    
    /**
     * Get current user or fail
     */
    protected function getCurrentUser(Request $request): User
    {
        $user = $request->user();
        
        if (!$user) {
            abort(401, 'Authentication required.');
        }
        
        return $user;
    }
}