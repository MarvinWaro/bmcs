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
        Schema::create('client_satisfaction_surveys', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->date('transaction_date');

            // Separate name fields instead of single client_name
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');

            $table->string('email');
            $table->string('school_hei');
            $table->string('other_school_specify')->nullable();
            $table->string('transaction_type');
            $table->string('other_transaction_specify')->nullable();
            $table->enum('satisfaction_rating', ['dissatisfied', 'neutral', 'satisfied']);
            $table->text('reason');

            // Admin fields
            $table->string('status')->default('submitted');
            $table->text('admin_notes')->nullable();

            $table->timestamps();

            // Add indexes for common queries
            $table->index('transaction_date');
            $table->index('first_name');
            $table->index('last_name');
            $table->index('satisfaction_rating');
            $table->index('transaction_type');
            $table->index('school_hei');
            $table->index('status');
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
