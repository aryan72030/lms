<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PublicStorageController extends Controller
{
    public function show(Request $request, string $path): BinaryFileResponse
    {
        $path = ltrim($path, '/');

        if ($path === '' || str_contains($path, '..')) {
            abort(400, 'Invalid path.');
        }

        if (!Storage::disk('public')->exists($path)) {
            abort(404);
        }

        $fullPath = storage_path('app/public/' . $path);
        if (!is_file($fullPath)) {
            abort(404);
        }

        $mime = Storage::disk('public')->mimeType($path) ?? 'application/octet-stream';

        $response = response()->file($fullPath, [
            'Content-Type' => $mime,
        ]);

        // Short cache; front-end can bust with new filenames on upload.
        $response->headers->set('Cache-Control', 'public, max-age=3600');

        return $response;
    }
}

