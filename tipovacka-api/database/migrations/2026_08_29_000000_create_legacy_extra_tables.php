<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * These tables mirror the legacy `extra`/`extratipy`/`rocniky` schema
     * (see d167769_haptip.sql), same as 0001_01_01_000003 does for
     * `hraci`/`muzstva`/`zapasy`/`tipy` — production seeds them directly
     * from the legacy SQL dump and never runs this migration's CREATE
     * TABLE statements.
     */
    public function up(): void
    {
        if (Schema::hasTable('extra')) {
            return;
        }

        Schema::create('extra', function (Blueprint $table) {
            $table->increments('e_id');
            $table->string('e_pril', 250);
            $table->string('e_vysledek', 250)->nullable();
            $table->integer('e_goly_d')->nullable();
            $table->integer('e_goly_h')->nullable();
            $table->string('e_zapas', 1)->default('N');
            $table->string('e_muzstva', 1);
            $table->integer('e_rocnik');
            $table->string('e_platnost', 1);
            $table->date('e_datum_pl')->nullable();
            $table->integer('e_autor')->default(0);
        });

        Schema::create('extratipy', function (Blueprint $table) {
            $table->increments('ex_id');
            $table->integer('ex_extra');
            $table->integer('ex_hrac');
            $table->string('ex_tip', 250);
            $table->integer('ex_tip_d')->nullable();
            $table->integer('ex_tip_h')->nullable();
            $table->integer('ex_body')->nullable();
            $table->date('ex_datum')->nullable();
            $table->integer('ex_rocnik');
        });

        Schema::create('rocniky', function (Blueprint $table) {
            $table->increments('r_id');
            $table->string('r_rocnik', 10)->default('');
            $table->integer('r_liga');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rocniky');
        Schema::dropIfExists('extratipy');
        Schema::dropIfExists('extra');
    }
};
