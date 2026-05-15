<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\ClinicController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\PatientTicketController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

Route::post('admin/login', [AdminAuthController::class, 'login']);

Route::get('clinics', [ClinicController::class, 'index']);
Route::get('doctors', [DoctorController::class, 'index']);
Route::get('rooms', [RoomController::class, 'index']);

Route::get('tickets', [TicketController::class, 'index']);
Route::post('tickets', [TicketController::class, 'store']);
Route::put('tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
Route::patch('tickets/{ticket}/service-note', [TicketController::class, 'updateServiceNote']);
Route::post('tickets/{ticket}/notify', [TicketController::class, 'notify']);

Route::post('tickets/{ticket}/cancel-by-patient', [PatientTicketController::class, 'cancelByPatient']);
Route::post('patient/check-ticket', [PatientTicketController::class, 'checkTicket']);
