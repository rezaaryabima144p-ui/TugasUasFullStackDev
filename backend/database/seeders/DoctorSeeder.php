<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\Doctor;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DoctorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $doctorNames = [
            'Poli Umum' => ['Dr. Andi Wijaya','Dr. Yani Surani', 'Dr. Siti Nurhaliza'],
            'Poli Gigi' => ['Dr. Dwi Prasetyo', 'Dr. Laila Ramadhani'],
            'Poli Lansia' => ['Dr. Bambang Suryanto', 'Dr. Nita Wijaya'],
            'Poli Balita' => ['Dr. Intan Permata', 'Dr. Yoga Santoso'],
        ];

        $clinics = Clinic::all();

        foreach ($clinics as $clinic) {
            $names = $doctorNames[$clinic->name] ?? [
                'Dr. ' . $clinic->name . ' A',
                'Dr. ' . $clinic->name . ' B',
            ];

            foreach ($names as $name) {
                Doctor::updateOrCreate([
                    'clinic_id' => $clinic->id,
                    'name' => $name,
                ], [
                    'clinic_id' => $clinic->id,
                    'name' => $name,
                    'specialization' => $clinic->name,
                    'status' => 'active',
                ]);
            }
        }
    }
}
