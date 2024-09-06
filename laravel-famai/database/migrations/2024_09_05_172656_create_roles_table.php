<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRolesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tblroles_rol', function (Blueprint $table) {
            $table->id('rol_id');
            $table->string('rol_descripcion', 100);
            $table->string('rol_usucreacion', 8);
            $table->dateTime('rol_feccreacion');
            $table->string('rol_usumodificacion', 8)->nullable();
            $table->dateTime('rol_fecmodificacion')->nullable();
            $table->boolean('rol_activo')->default(1);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('roles');
    }
}
