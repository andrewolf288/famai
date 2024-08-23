<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddProductosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('tblproductos_pro', function (Blueprint $table) {
            $table->text('pro_codigomarca')->nullable()->after('uni_codigomayor');
            $table->text('pro_medidas')->nullable()->after('pro_codigomarca');
            $table->text('pro_modelomaquina')->nullable()->after('pro_medidas');
            $table->text('pro_observacion')->nullable()->after('pro_modelomaquina');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('tblproductos_pro', function (Blueprint $table) {
            $table->dropColumn([
                'pro_codigomarca',
                'pro_medidas',
                'pro_modelomaquina',
                'pro_observacion',
            ]);
        });
    }
}
