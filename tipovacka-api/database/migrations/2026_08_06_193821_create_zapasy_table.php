<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('zapasy', function (Blueprint $table) {
            $table->id();
            $table->string('tym_domaci');
            $table->string('tym_hoste');
            $table->dateTime('cas_vykopu');
            $table->unsignedTinyInteger('goly_domaci')->nullable();
            $table->unsignedTinyInteger('goly_hoste')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zapasy');
    }
};
