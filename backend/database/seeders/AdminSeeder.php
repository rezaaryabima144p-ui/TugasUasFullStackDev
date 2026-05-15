<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Admin::updateOrCreate(['admin_code' => 'ADM001'], [
            'admin_code' => 'ADM001',
            'name' => 'Administrator Puskesmas',
            'email' => 'admin@puskesmassekemala.com',
            'phone' => '081234567890',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        Admin::updateOrCreate(['admin_code' => 'ADM002'], [
            'admin_code' => 'ADM002',
            'name' => 'Petugas Antrian',
            'email' => 'petugas@puskesmassekemala.com',
            'phone' => '081234567891',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'active',
        ]);
    }
}
