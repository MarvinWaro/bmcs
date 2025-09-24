<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_satisfaction_surveys', function (Blueprint $table) {
            $table->id();
            $table->date('transaction_date');

            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');

            $table->string('email');

            $table->foreignId('school_id')->nullable()
                ->constrained('schools')
                ->nullOnDelete();

            $table->string('other_school_specify')->nullable();

            $table->string('transaction_type');
            $table->string('other_transaction_specify')->nullable();

            $table->enum('satisfaction_rating', ['dissatisfied', 'satisfied']);
            $table->text('reason');

            $table->string('status')->default('submitted');

            $table->timestamps();

            // Indexes (short, explicit names to avoid the 64-char limit)
            $table->index(['transaction_date', 'satisfaction_rating', 'transaction_type', 'status'], 'css_txn_sat_type_status_idx');
            $table->index(['first_name', 'last_name'], 'css_name_idx');
            $table->index('email', 'css_email_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_satisfaction_surveys');
    }
};
