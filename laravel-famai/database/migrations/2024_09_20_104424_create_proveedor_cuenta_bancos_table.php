<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProveedorCuentaBancosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tblproveedorctasbancos_pvc', function (Blueprint $table) {
            $table->id('pvc_id');
            $table->unsignedBigInteger('prv_id');
            $table->string('pvc_numerocuenta', 20);
            $table->boolean('pvc_activo')->default(1);
            $table->string('pvc_usucreacion', 8);
            $table->dateTime('pvc_feccreacion');
            $table->string('pvc_usumodificacion', 8)->nullable();
            $table->dateTime('pvc_fecmodificacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tblproveedorctasbancos_pvc');
    }
}
