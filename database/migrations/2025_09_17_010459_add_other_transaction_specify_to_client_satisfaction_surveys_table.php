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
        Schema::table('client_satisfaction_surveys', function (Blueprint $table) {
            $table->string('other_transaction_specify')->nullable()->after('transaction_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('client_satisfaction_surveys', function (Blueprint $table) {
            $table->dropColumn('other_transaction_specify');
        });
    }
};
