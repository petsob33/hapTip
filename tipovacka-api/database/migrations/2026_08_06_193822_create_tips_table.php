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
        Schema::create('tips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uzivatel_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('zapas_id')->constrained('zapasy')->cascadeOnDelete();
            $table->unsignedTinyInteger('goly_domaci');
            $table->unsignedTinyInteger('goly_hoste');
            $table->timestamps();

            $table->unique(['uzivatel_id', 'zapas_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tips');
    }
};
