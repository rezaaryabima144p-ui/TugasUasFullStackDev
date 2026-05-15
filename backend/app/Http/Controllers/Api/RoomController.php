<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $query = Room::with('clinic');

        if ($request->filled('clinic_id')) {
            $query->where('clinic_id', $request->input('clinic_id'));
        }

        return response()->json($query->orderBy('name')->get());
    }
}
