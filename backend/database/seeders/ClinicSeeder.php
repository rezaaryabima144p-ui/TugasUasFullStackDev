<?php

namespace Database\Seeders;

use App\Models\Clinic;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClinicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Clinic::updateOrCreate(['name' => 'Poli Umum'], [
            'name' => 'Poli Umum',
            'code_prefix' => 'U',
            'open_time' => '08:00',
            'close_time' => '12:00',
            'status' => 'active',
        ]);

        Clinic::updateOrCreate(['name' => 'Poli Gigi'], [
            'name' => 'Poli Gigi',
            'code_prefix' => 'G',
            'open_time' => '09:00',
            'close_time' => '12:00',
            'status' => 'active',
        ]);

        Clinic::updateOrCreate(['name' => 'Poli Lansia'], [
            'name' => 'Poli Lansia',
            'code_prefix' => 'L',
            'open_time' => '09:00',
            'close_time' => '12:00',
            'status' => 'active',
        ]);

        Clinic::updateOrCreate(['name' => 'Poli Balita'], [
            'name' => 'Poli Balita',
            'code_prefix' => 'B',
            'open_time' => '08:30',
            'close_time' => '11:30',
            'status' => 'active',
        ]);
    }
}
