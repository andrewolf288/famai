<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        // Se ejecuta cada vez que Laravel abre una conexión
        try {
            DB::connection()->getPdo()->exec("SET LANGUAGE us_english");
            DB::connection()->getPdo()->exec("SET DATEFORMAT ymd");
        } catch (\Exception $e) {
            // La conexión aún no está establecida, se ignorará el error
            // Los comandos se ejecutarán cuando se use la conexión por primera vez
        }
    }
}
