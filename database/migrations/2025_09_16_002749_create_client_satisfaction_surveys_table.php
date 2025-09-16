<?php
// database/migrations/2024_01_01_000000_create_client_satisfaction_surveys_table.php

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
        Schema::create('client_satisfaction_surveys', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->date('transaction_date');
            $table->string('client_name');
            $table->string('email')->nullable();
            $table->string('school_hei');
            $table->string('transaction_type');
            $table->enum('satisfaction_rating', ['dissatisfied', 'neutral', 'satisfied']);
            $table->text('reason');
            $table->timestamps();

            // Add indexes for common queries
            $table->index('transaction_date');
            $table->index('satisfaction_rating');
            $table->index('transaction_type');
            $table->index('school_hei');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_satisfaction_surveys');
    }
};
