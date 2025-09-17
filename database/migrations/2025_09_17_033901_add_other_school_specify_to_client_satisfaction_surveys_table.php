<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('client_satisfaction_surveys', function (Blueprint $table) {
            $table->string('other_school_specify')->nullable()->after('school_hei');
        });
    }

    public function down()
    {
        Schema::table('client_satisfaction_surveys', function (Blueprint $table) {
            $table->dropColumn('other_school_specify');
        });
    }
};
