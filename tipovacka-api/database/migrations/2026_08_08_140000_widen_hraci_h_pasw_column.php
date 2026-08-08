<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // The legacy `hraci` table stored short plain-text passwords in
        // h_pasw (varchar(30)). A bcrypt hash is always 60 characters, so
        // newly registered players need more room. This only widens the
        // column — existing rows and their values are untouched.
        Schema::table('hraci', function ($table) {
            $table->string('h_pasw', 255)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hraci', function ($table) {
            $table->string('h_pasw', 30)->nullable()->change();
        });
    }
};
