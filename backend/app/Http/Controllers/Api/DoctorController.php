<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function index(Request $request)
    {
        $query = Doctor::with('clinic');

        if ($request->filled('clinic_id')) {
            $query->where('clinic_id', $request->input('clinic_id'));
        }

        return response()->json($query->orderBy('name')->get());
    }
}
