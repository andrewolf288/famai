<?php

namespace App\Http\Controllers;

use App\Reporte;
use DateTime;
use Illuminate\Http\Request;
use mPDF;

class ReporteController extends Controller
{
	private $varRuta;
	private $varRutaStringPrincipal;
	private $varRutaStringSecundario;
	private $varRutaStringSecundarioSoloMateriales;
	private $varRutaStringSecundarioSoloProcesos;
	private $varRutaStringFinal;

	private $varProcCampos = ["{varNumFil}", "{varProcesoParte}", "{varCodigo}", "{varDescripcion}", "{varProObservacion}"];
	private $varMatCampos = ["{varItem}", "{varDescripcionMat}", "{varCantidad}", "{varMatObservacion}"];

	private $varTab = "&nbsp;";
	private $fechaHoraActual;
	private $storagepath = 'app/mpdf_tmp';
	
	private function initializePaths()
	{
		$this->varRuta = resource_path("views/reporte/PlanOrdenTrabajo.php");
		$this->varRutaStringPrincipal = resource_path("views/reporte/StringPrincipal.php");
		$this->varRutaStringSecundario = resource_path("views/reporte/StringSecundario.php");
		$this->varRutaStringSecundarioSoloMateriales = resource_path("views/reporte/StringSecundarioSoloMateriales.php");
		$this->varRutaStringSecundarioSoloProcesos = resource_path("views/reporte/StringSecundarioSoloProcesos.php");
		$this->varRutaStringFinal = resource_path("views/reporte/StringFinal.php");

	}

	public function generarReporteOrdenTrabajo(Request $request)
	{
		$this->initializePaths();
		$this->fechaHoraActual = date('Y-m-d H:i:s');
		$varTempDir = storage_path($this->storagepath);

		if (!is_dir($varTempDir)) {
			mkdir($varTempDir, 0777, true);
		}

		$validated = $request->validate([
			'oic_id' => 'required|string',
		]);

		$varOIC = $validated['oic_id'];

		$reporte = new Reporte();
		$varData = file_get_contents($this->varRuta);
		$htmlStringPrincipal = file_get_contents($this->varRutaStringPrincipal);
		$htmlStringSecundario = file_get_contents($this->varRutaStringSecundario);
		$htmlStringSecundarioSoloMateriales = file_get_contents($this->varRutaStringSecundarioSoloMateriales);
		$htmlStringSecundarioSoloProcesos = file_get_contents($this->varRutaStringSecundarioSoloProcesos);
		
		$finalHtmlString = file_get_contents($this->varRutaStringFinal);
		//Obtenemos el registro cabecera
		$result = $reporte->metobtenerCabecera($varOIC);
		if ($result && is_array($result)) {
			foreach ($result as $dato) {
				//Llenamos las variables para la cabecera (cliente, descripcion del equipo y OT)
				$varClienteNombre = isset($dato['nombre_del_cliente']) ? $dato['nombre_del_cliente'] : $this->varTab;
				$varDescripcionEquipo = isset($dato['descripcion_equipo']) ? $dato['descripcion_equipo'] : $this->varTab;
				$varFecha = isset($dato['oic_fecha']) ? $dato['oic_fecha'] : $this->varTab;
				$varOT = isset($dato['odt_numero']) ? $dato['odt_numero'] : $this->varTab;
				//Llenamos las variables para la cabecera (Los 3 Trabajadores responsables)
				$varTraNombreOrigen = isset($dato['tra_nombreorigen']) ? $dato['tra_nombreorigen'] : $this->varTab;
				$varTraNombreMaestro = isset($dato['tra_nombremaestro']) ? $dato['tra_nombremaestro'] : $this->varTab;
				$varTraNombreAlmacen = isset($dato['tra_nombrealmacen']) ? $dato['tra_nombrealmacen'] : $this->varTab;
				//Llenamos las variables de seguimiento
				$varUsuCreacion = isset($dato['oic_usucreacion']) ? $dato['oic_usucreacion'] : $this->varTab;
				$varFecCreacion = isset($dato['oic_feccreacion']) ? $dato['oic_feccreacion'] : $this->varTab;
				$varUsuModificacion = isset($dato['oic_usumodificacion']) ? $dato['oic_usumodificacion'] : $this->varTab;
				$varFecModificacion = isset($dato['oic_fecmodificacion']) ? $dato['oic_fecmodificacion']  : $this->varTab;
			}
			//Obtenemos el registro de las partes
			$varPartes = $reporte->metobtenerPartes($varOIC);
			$htmlFilasTotal = "";
			//Recorremos cada Parte
			if ($varPartes && is_array($varPartes)) {
				foreach ($varPartes as $varParte) {
					$htmlFilas = "";
					$varParteNombre = isset($varParte['oip_descripcion']) ? $varParte['oip_descripcion'] : $this->varTab;
					$varParteID = isset($varParte['oip_id']) ? $varParte['oip_id'] : $this->varTab;
					$varResultProcesos = $reporte->metobtenerProcesos($varOIC, $varParteID);
					$varResultMateriales = $reporte->metobtenerMateriales($varOIC, $varParteID);
					//Esquivamos el proceso si no existe materiales y procesos
					if (empty($varResultMateriales) && empty($varResultProcesos)){
						continue;
					}
					//Obtenemos las filas restantes
					$varNumProcesos = count($varResultProcesos);
					$varNumMateriales = count($varResultMateriales);
					//Calculamos las filas que se van a añadir para el rowspan
					$varFilasRowSpan = max(0, $varNumMateriales - $varNumProcesos);
					//Calculamos el numero total de filas por parte
					$varFilasTotales = max($varNumProcesos, $varNumMateriales);
					//Obtenemos el numero de filas restantes
					$varfilasRestantes = abs($varNumMateriales - $varNumProcesos);
					//Obtenemos las filas que tienen procesos y materiales en la misma cantidad
					$varFilasComunes = $varFilasTotales - $varfilasRestantes;
					//variable para el indice de los materiales / procesos restantes
					$nuevoindice = 0;
					//Procesamos en funcion a las filas comunes (distinguimos entre partes con puros materiales o puros procesos)
					if ($varFilasComunes == 0){
						//Esta es la parte donde se hace la asignación de variables
						//procesos
						$varProcesoParte = $varParteNombre;
						$varCodigoProceso = isset($varResultProcesos[0]['opp_codigo']) ? $varResultProcesos[0]['opp_codigo'] : $this->varTab;
						$varDescripcionProceso = isset($varResultProcesos[0]['opp_descripcion']) ? $varResultProcesos[0]['opp_descripcion'] : $this->varTab;
						$varObservacionProceso = isset($varResultProcesos[0]['odp_observacion']) ? $varResultProcesos[0]['odp_observacion'] : $this->varTab;
						//materiales
						$varItem = isset($varResultMateriales[0]['odm_item']) ? $varResultMateriales[0]['odm_item'] : $this->varTab;
						$varProDescripcion = isset($varResultMateriales[0]['odm_descripcion']) ? $varResultMateriales[0]['odm_descripcion'] : $this->varTab;
						$varCantidad = isset($varResultMateriales[0]['odm_cantidad']) ? $varResultMateriales[0]['odm_cantidad'] : $this->varTab;
						$varProObservaciones = isset($varResultMateriales[0]['odm_observacion']) ? $varResultMateriales[0]['odm_observacion'] : $this->varTab;
						$htmlFila = "";
						//Esta es la parte donde se hace el reemplazo de las variables de las plantillas
						//verificamos si es el primer elemento de los procesos
						$htmlFila = str_replace(
							[
								'{varNumFil}', //se refiere al valor de rowspan
								'{varProcesoParte}', //la parte que contiene a los procesos
								'{varCodigo}', //codigo del proceso
								'{varDescripcion}',//nombre del proceso
								'{varProObservacion}',//observacion en el proceso
								'{varItem}',//nro item producto
								'{varDescripcionMat}',//nombre del material
								'{varCantidad}',//cantidad del material
								'{varMatObservacion}'//observacion en el material
							],
							[
								$varNumProcesos + $varFilasRowSpan,
								$varProcesoParte,
								is_numeric($varCodigoProceso) ? sprintf("%04d", $varCodigoProceso) : $varCodigoProceso,
								$varDescripcionProceso,
								$varObservacionProceso,
								$varItem,
								$varProDescripcion,
								$varCantidad,
								$varProObservaciones
							],
							$htmlStringPrincipal
						);
						//completamos los rowspan que faltan, si es que hay mas procesos que materiales
						if ($varNumProcesos > $varNumMateriales) {
							$htmlFila = str_replace(
								[	'{rowSpanItm}', 
									'{rowSpanDmt}', 
									'{rowSpanCan}', 
									'{rowSpanObm}'
								],
								[	'rowspan=' . ($varfilasRestantes ), 
									'rowspan=' . ($varfilasRestantes ), 
									'rowspan=' . ($varfilasRestantes ), 
									'rowspan=' . ($varfilasRestantes )
								],
								$htmlFila
							);
						//completamos los rowspan que faltan, si es que hay mas materiales que procesos
						} elseif ($varNumProcesos < $varNumMateriales) {
							$htmlFila = str_replace(
								[	'{rowSpanCod}', 
									'{rowSpanDes}', 
									'{rowSpanObs}'
								],
								[	'rowspan=' . ($varFilasRowSpan ), 
									'rowspan=' . ($varFilasRowSpan ), 
									'rowspan=' . ($varFilasRowSpan )
								],
								$htmlFila
							);
						}
						//adjuntamos la fila procesada
						$htmlFilas .= "\n".$htmlFila;
						//asignamos el valor del indice para los nuevos elementos
						$nuevoindice = 0;
					}
					else 
					{
						for ($i = 0; $i < $varFilasComunes; $i++) {
							//Esta es la parte donde se hace la asignación de variables
							//procesos
							$varProcesoParte = $varParteNombre;
							$varCodigoProceso = isset($varResultProcesos[$i]['opp_codigo']) ? $varResultProcesos[$i]['opp_codigo'] : $this->varTab;
							$varDescripcionProceso = isset($varResultProcesos[$i]['opp_descripcion']) ? $varResultProcesos[$i]['opp_descripcion'] : $this->varTab;
							$varObservacionProceso = isset($varResultProcesos[$i]['odp_observacion']) ? $varResultProcesos[$i]['odp_observacion'] : $this->varTab;
							//materiales
							$varItem = isset($varResultMateriales[$i]['odm_item']) ? $varResultMateriales[$i]['odm_item'] : $this->varTab;
							$varProDescripcion = isset($varResultMateriales[$i]['odm_descripcion']) ? $varResultMateriales[$i]['odm_descripcion'] : $this->varTab;
							$varCantidad = isset($varResultMateriales[$i]['odm_cantidad']) ? $varResultMateriales[$i]['odm_cantidad'] : $this->varTab;
							$varProObservaciones = isset($varResultMateriales[$i]['odm_observacion']) ? $varResultMateriales[$i]['odm_observacion'] : $this->varTab;
							$htmlFila = "";
							//Esta es la parte donde se hace el reemplazo de las variables de las plantillas
							//verificamos si es el primer elemento de los procesos
							if ($i == 0) {
								$htmlFila = str_replace(
									[
										'{varNumFil}', //se refiere al valor de rowspan
										'{varProcesoParte}', //la parte que contiene a los procesos
										'{varCodigo}', //codigo del proceso
										'{varDescripcion}',//nombre del proceso
										'{varProObservacion}',//observacion en el proceso
										'{varItem}',//nro item producto
										'{varDescripcionMat}',//nombre del material
										'{varCantidad}',//cantidad del material
										'{varMatObservacion}'//observacion en el material
									],
									[
										$varNumProcesos + $varFilasRowSpan,
										$varProcesoParte,
										is_numeric($varCodigoProceso) ? sprintf("%04d", $varCodigoProceso) : $varCodigoProceso,
										$varDescripcionProceso,
										$varObservacionProceso,
										$varItem,
										$varProDescripcion,
										$varCantidad,
										$varProObservaciones
									],
									$htmlStringPrincipal
								);
							} //si no es el primer elemento de los procesos, no le pondra '{varNumFil}', por lo tanto tampoco tendra rowspan
							else {
								$htmlFila = str_replace(
									[
										'{varProcesoParte}', //la parte que contiene a los procesos
										'{varCodigo}', //codigo del proceso
										'{varDescripcion}',//nombre del proceso
										'{varProObservacion}',//observacion en el proceso
										'{varItem}',//nro item producto
										'{varDescripcionMat}',//nombre del material
										'{varCantidad}',//cantidad del material
										'{varMatObservacion}'//observacion en el material
									],
									[
										$varProcesoParte,
										sprintf("%04d", $varCodigoProceso),
										$varDescripcionProceso,
										$varObservacionProceso,
										$varItem,
										$varProDescripcion,
										$varCantidad,
										$varProObservaciones
									],
									$htmlStringSecundario
								);
							}
							//Si llegamos al ultimo bucle 
							if ($i == ($varFilasComunes - 1)) {
								//completamos los rowspan que faltan, si es que hay mas procesos que materiales
								if ($varNumProcesos > $varNumMateriales) {
									$htmlFila = str_replace(
										[	'{rowSpanItm}', 
											'{rowSpanDmt}', 
											'{rowSpanCan}', 
											'{rowSpanObm}'
										],
										[	'rowspan=' . ($varfilasRestantes + 1), 
											'rowspan=' . ($varfilasRestantes + 1), 
											'rowspan=' . ($varfilasRestantes + 1), 
											'rowspan=' . ($varfilasRestantes + 1)
										],
										$htmlFila
									);
								//completamos los rowspan que faltan, si es que hay mas materiales que procesos
								} elseif ($varNumProcesos < $varNumMateriales) {
									$htmlFila = str_replace(
										[	'{rowSpanCod}', 
											'{rowSpanDes}', 
											'{rowSpanObs}'
										],
										[	'rowspan=' . ($varFilasRowSpan + 1), 
											'rowspan=' . ($varFilasRowSpan + 1), 
											'rowspan=' . ($varFilasRowSpan + 1)
										],
										$htmlFila
									);
								}
							}
							//adjuntamos la fila procesada
							$htmlFilas .= "\n".$htmlFila;
							//asignamos el valor del indice para los nuevos elementos
							$nuevoindice = $i;
						}
					}
					
					//Añadimos 1 al nuevo indice
					$nuevoindice ++;
					//ahora adjuntamos los materiales / procesos restantes
					for ($i = 0; $i < $varfilasRestantes; $i++) {
						if ($varNumProcesos > $varNumMateriales) {
							//procesos
							$varProcesoParte = isset($varResultProcesos[$i + $nuevoindice]['oip_descripcion']) ? $varResultProcesos[$i + $nuevoindice]['oip_descripcion'] : $this->varTab;
							$varCodigoProceso = isset($varResultProcesos[$i + $nuevoindice]['opp_codigo']) ? $varResultProcesos[$i + $nuevoindice]['opp_codigo'] : $this->varTab;
							$varDescripcionProceso = isset($varResultProcesos[$i + $nuevoindice]['opp_descripcion']) ? $varResultProcesos[$i + $nuevoindice]['opp_descripcion'] : $this->varTab;
							$varObservacionProceso = isset($varResultProcesos[$i + $nuevoindice]['odp_observacion']) ? $varResultProcesos[$i + $nuevoindice]['odp_observacion'] : $this->varTab;
							$htmlFila = "";


						} elseif ($varNumProcesos < $varNumMateriales) {
							//si estamos trabajando sin procesos, descontamos el material final que se generara vacío
							if ($varFilasComunes == 0 && ($i == ($varfilasRestantes -1)) ){
								continue;
							}
							//materiales
							$varItem = isset($varResultMateriales[$i + $nuevoindice]['odm_item']) ? $varResultMateriales[$i + $nuevoindice]['odm_item'] : $this->varTab;
							$varProDescripcion = isset($varResultMateriales[$i + $nuevoindice]['odm_descripcion']) ? $varResultMateriales[$i + $nuevoindice]['odm_descripcion'] : $this->varTab;
							$varCantidad = isset($varResultMateriales[$i + $nuevoindice]['odm_cantidad']) ? $varResultMateriales[$i + $nuevoindice]['odm_cantidad'] : $this->varTab;
							$varProObservaciones = isset($varResultMateriales[$i + $nuevoindice]['odm_observacion']) ? $varResultMateriales[$i + $nuevoindice]['odm_observacion'] : $this->varTab;
							$htmlFila = "";
							$htmlFila = str_replace(
							[	'{varItem}', 
								'{varDescripcionMat}', 	
								'{varCantidad}', 
								'{varMatObservacion}'
							],
							[	$varItem, 
								$varProDescripcion, 
								$varCantidad, 
								$varProObservaciones
							],
								$htmlStringSecundarioSoloMateriales
							);
						}
						$htmlFilas .= $htmlFila;
					}
					$htmlFilas = str_replace(
						[
							'{rowSpanCod}',
							'{rowSpanDes}',
							'{rowSpanObs}',
							'{rowSpanItm}',
							'{rowSpanDmt}',
							'{rowSpanCan}',
							'{rowSpanObm}'
						],
						[	' ', ' ', ' ', ' ', ' ', ' ', ' '	],
						$htmlFilas
					);
					$htmlFilasTotal .= $htmlFilas;
				}

				$varData = str_replace("{varClientenombre}", $varClienteNombre, $varData);
				$varData = str_replace("{varEquipoDescripcion}", $varDescripcionEquipo, $varData);
				$varData = str_replace("{varFecha}", $varFecha, $varData);
				$varData = str_replace("{varOrdenTrabajo}", $varOT, $varData);
				$varData = str_replace("{varTraNombreOrigen}", $varTraNombreOrigen, $varData);
				$varData = str_replace("{varTraNombreMaestro}", $varTraNombreMaestro, $varData);
				$varData = str_replace("{varTraNombreAlmacen}", $varTraNombreAlmacen, $varData);
				$varData .= $htmlFilasTotal . $finalHtmlString;
				$varData = str_replace($this->varProcCampos, $this->varTab, $varData);
				$varData = str_replace($this->varMatCampos, $this->varTab, $varData);
				//Activar las dos lineas siguientes solo para depuracion
				//$varFilename = 'generated.html';
				//file_put_contents($varTempDir."/".$varFilename, $varData, LOCK_EX);

				$varMpdf = new \Mpdf\Mpdf(['orientation' => 'L', 'tempDir' => $varTempDir]);
				$varMpdf->SetDisplayMode('fullpage');
				$varMpdf->SetHeader($this->fechaHoraActual);
				$varMpdf->WriteHTML($varData);
				$varMpdf->SetFooter('Usuario Creacion: ' . $varUsuCreacion . ' Fecha: ' . $varFecCreacion . ' <br> Usuario Modifica: ' . $varUsuModificacion . ' Fecha: ' . $varFecModificacion . ' | | Pag. {PAGENO}/{nbpg}');
				return response()->streamDownload(
					function () use ($varMpdf) {
						echo $varMpdf->Output('', 'S');
					},
					'reporte.pdf',
					[
						'Content-Type' => 'application/pdf',
						'Content-Disposition' => 'attachment; filename="reporte.pdf"'
					]
				);
			} else {
				return response()->json([
					"error" => "Error al obtener el array de partes"
				], 500);
			}
		} else {
			return response()->json([
				"error" => "Error al obtener el array de cabecera"
			], 500);
		}
	}
}
