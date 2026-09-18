<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * These tables mirror the legacy `hraci`/`muzstva`/`zapasy`/`tipy` schema
     * (see d167769_haptip.sql) that production is seeded from directly. The
     * app never creates them via migrations in production, but the test
     * suite needs them to exist against the sqlite connection.
     */
    public function up(): void
    {
        if (Schema::hasTable('hraci')) {
            // Production seeds these tables directly from the legacy SQL
            // dump (d167769_haptip.sql) and never runs this migration's
            // CREATE TABLE statements — only a fresh test database is
            // missing them and needs this migration to actually run.
            return;
        }

        Schema::create('hraci', function (Blueprint $table) {
            $table->increments('h_id');
            $table->string('h_login', 30)->nullable();
            $table->string('h_pasw', 30)->nullable();
            $table->string('h_jmeno', 30)->nullable();
            $table->string('h_prijmeni', 30)->nullable();
            $table->string('h_nick', 30)->nullable();
            $table->string('h_email', 100)->nullable();
            $table->string('h_foto', 100)->nullable();
            $table->string('h_admin', 1)->default('N');
            $table->string('h_platnost', 1)->default('A');
        });

        Schema::create('muzstva', function (Blueprint $table) {
            $table->increments('m_id');
            $table->string('m_nazev', 100)->default('');
            $table->string('m_kratky', 50)->nullable();
            $table->string('m_mesto', 100)->default('');
            $table->string('m_znak', 100)->nullable();
            $table->string('m_platnost', 1)->default('A');
            $table->integer('m_liga');
        });

        Schema::create('zapasy', function (Blueprint $table) {
            $table->increments('z_id');
            $table->integer('z_domaci')->default(0);
            $table->integer('z_hoste')->default(0);
            $table->date('z_datum');
            $table->integer('z_goly_d')->nullable();
            $table->integer('z_goly_h')->nullable();
            $table->integer('z_kolo')->default(0);
            $table->integer('z_rocnik')->nullable()->default(0);
        });

        Schema::create('tipy', function (Blueprint $table) {
            $table->increments('t_id');
            $table->integer('t_zapas')->default(0);
            $table->integer('t_hrac')->default(0);
            $table->integer('t_tip_d')->default(0);
            $table->integer('t_tip_h')->default(0);
            $table->integer('t_body')->nullable();
            $table->date('t_datum');
            $table->integer('t_rocnik');
            $table->integer('t_joker')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tipy');
        Schema::dropIfExists('zapasy');
        Schema::dropIfExists('muzstva');
        Schema::dropIfExists('hraci');
    }
};
