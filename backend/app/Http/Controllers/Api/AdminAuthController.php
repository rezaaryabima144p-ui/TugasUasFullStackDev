<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'admin_code' => 'nullable|string',
            'email' => 'nullable|email',
            'password' => 'required|string',
        ]);

        $login = $data['admin_code'] ?? $data['email'] ?? null;

        if (! $login) {
            return response()->json(['message' => 'Admin code or email is required.'], 422);
        }

        $admin = Admin::where('admin_code', $login)
            ->orWhere('email', $login)
            ->first();

        if (! $admin || ! Hash::check($data['password'], $admin->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $admin->update(['last_login_at' => now()]);

        return response()->json(['admin' => $admin]);
    }
}
