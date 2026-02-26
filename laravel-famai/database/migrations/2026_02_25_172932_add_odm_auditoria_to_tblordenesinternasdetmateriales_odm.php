<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddOdmAuditoriaToTblordenesinternasdetmaterialesOdm extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('tblordenesinternasdetmateriales_odm', function (Blueprint $table) {
            $table->text('odm_auditoria')->nullable()->after('odm_observacion');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('tblordenesinternasdetmateriales_odm', function (Blueprint $table) {
            $table->dropColumn('odm_auditoria');
        });
    }
}
