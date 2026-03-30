<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WishlistController extends Controller
{
    /**
     * Display student's wishlist
     */
    public function index()
    {
        $wishlist = Wishlist::with(['course.instructor', 'course.category'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'course' => [
                        'id' => $item->course->id,
                        'title' => $item->course->title,
                        'description' => $item->course->description,
                        'price' => $item->course->price,
                        'thumbnail' => $item->course->thumbnail ? '/files/' . $item->course->thumbnail : null,
                        'instructor' => [
                            'name' => $item->course->instructor->name,
                        ],
                        'category' => [
                            'name' => $item->course->category->name,
                        ],
                    ],
                ];
            });

        return Inertia::render('student/wishlist/index', [
            'wishlist' => $wishlist,
        ]);
    }

    /**
     * Add course to wishlist
     */
    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
        ]);

        Wishlist::firstOrCreate([
            'user_id' => Auth::id(),
            'course_id' => $request->course_id,
        ]);

        return back()->with('success', 'Course added to your wishlist.');
    }

    /**
     * Remove course from wishlist
     */
    public function destroy(Wishlist $wishlist)
    {
        if ($wishlist->user_id !== Auth::id()) {
            abort(403);
        }

        $wishlist->delete();

        return back()->with('success', 'Course removed from your wishlist.');
    }

    /**
     * Toggle course in wishlist
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
        ]);

        $wishlist = Wishlist::where('user_id', Auth::id())
            ->where('course_id', $request->course_id)
            ->first();

        if ($wishlist) {
            $wishlist->delete();
            $message = 'Removed from wishlist.';
            $added = false;
        } else {
            Wishlist::create([
                'user_id' => Auth::id(),
                'course_id' => $request->course_id,
            ]);
            $message = 'Added to wishlist.';
            $added = true;
        }

        return back()->with('success', $message);
    }
}
