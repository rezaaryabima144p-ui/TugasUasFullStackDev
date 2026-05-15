<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\Room;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roomNames = [
            'Poli Umum' => ['Ruang Pendaftaran', 'Ruang Pemeriksaan Utama'],
            'Poli Gigi' => ['Ruang Gigi 1', 'Ruang Gigi 2'],
            'Poli Lansia' => ['Ruang Lansia 1', 'Ruang Lansia 2'],
            'Poli Balita' => ['Ruang Balita 1', 'Ruang Balita 2'],
        ];

        $clinics = Clinic::all();

        foreach ($clinics as $clinic) {
            $names = $roomNames[$clinic->name] ?? [
                'Ruang ' . $clinic->name . ' A',
                'Ruang ' . $clinic->name . ' B',
            ];

            foreach ($names as $name) {
                Room::updateOrCreate(['name' => $name], [
                    'clinic_id' => $clinic->id,
                    'name' => $name,
                    'status' => 'active',
                ]);
            }
        }
    }
}
