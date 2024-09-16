<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
  <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  </head>
  <style>
    .maintable {
        width: 100%;
        font-family: serif;
        border-collapse: collapse;
    }
    .maintable tr {
      padding: 0px;
    }
    .maintable td {
        border: 0.5mm solid #888888;
        
        text-align: center;
        font-size: 14pt;
        padding: 0px;
        margin: 0px;
    }
    .maintable th {
        border: 0.5mm solid #888888;
        text-align: center;
        font-size: 14pt;
        padding: 0px;
        margin: 0px;
    }
    .maintable .lefty-align {
        text-align: left;
    }

    .generaltable {
        width: 100%;
        font-family: serif;
        border-collapse: collapse;
    }
    .generaltable tr {
      padding: 0px;
    }
    .generaltable td {
        border: 0.5mm solid #888888;
        
        text-align: center;
        font-size: 8pt;
        padding: 0px;
        margin: 0px;
    }
    .generaltable th {
        border: 0.5mm solid #888888;
        text-align: center;
        font-size: 8pt;
        padding: 0px;
        margin: 0px;
    }
    .generaltable .lefty-align {
        text-align: left;
    }
    .secondarytable {
        width: 100%;
        font-family: serif;
        border-collapse: collapse;
    }
    .secondarytable tr {
        padding: 0px;
    }
    .secondarytable td {
        border: 0.5mm solid #888888;
        font-size: 8pt;
        padding: 0px;
        margin: 0px;
    }
    .secondarytable th {
        border: 0.5mm solid #888888;
        text-align: center;
        font-size: 8pt;
        padding: 0px;
        margin: 0px;
    }
    .secondarytable .sub-header {
        text-align: center;
        font-weight: bold;
    }
    .secondarytable .sub-header-numeric {
        text-align: center;
    }
    .generaltable tr td > table {
        height: 100%;
    }
</style>

<body>
    <table class="maintable">
        <tbody>
            <tr>
                <td width="30%"><img src="{varLogo}" alt="Famai" style="max-width: 61mm; max-height: 34mm;"></td>
                <td width="50%"><strong>ORDEN INTERNA</strong></td>
                <td width="20%">
                    <table class="secondarytable" >
                      <thead>
                        <tr>
                          <th>PR-F-04</th>
                      </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="lefty-align">Versión   : 01</td>
                        </tr>
                        <tr>
                            <td class="lefty-align">Fecha       : 15/07/19</td>
                        </tr>
                        <tr>
                            <td class="lefty-align">Revisado: JPR</td>
                        </tr>
                        <tr>
                            <td class="lefty-align">Aprobado: CSGC</td>
                        </tr>
                      </tbody>
                    </table>
                </td>
            </tr>
            <tr>
              <td  colspan="3">
                
              </td>
              
            </tr>
            <tr>
              
            </tr>
        </tbody>
    </table>
    &nbsp;
      <table class="generaltable">
        <tr>
          <td class="lefty-align" width="40%"><strong>CLIENTE:</strong>&nbsp; {varClientenombre}</td>
        </tr>
        <tr>
          <td class="lefty-align"><strong>EQUIPO:</strong>&nbsp; {varEquipoDescripcion}</td>
        </tr>
        <tr>
          <td class="lefty-align" width="50%"><strong>FECHA:</strong>&nbsp;&nbsp;&nbsp; {varFecha}</td>
        </tr>
        <tr>
          <td class="lefty-align"><strong>OT:</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {varOrdenTrabajo}</td>
        </tr>
      </table>
      &nbsp;
      <table class="generaltable">
        <tr>
          <th colspan="6">{varArea}</th> <!--HIDRAULICA-->
        </tr>
        <tr>
          <td width="10%"><strong>Respon. ORIGEN</strong></td>
          <td width="23%">{varTraNombreOrigen}</td>
          <td width="10%"><strong>Respon. MAES</strong></td>
          <td width="23%">{varTraNombreMaestro}</td>
          <td width="10%"><strong>Respon. ALMA</strong></td>
          <td >{varTraNombreAlmacen}</td>
        </tr>
      </table>
      &nbsp;
    <table class="secondarytable">
      <tr>
          <th rowspan="2" width="6%"></th>
          <th colspan="3">ORDEN INTERNA DE TRABAJO</th>
          <th colspan="4">ORDEN DE PEDIDO DE MATERIALES</th>
      </tr>
      <tr>
        <td width="4%" class="sub-header">COD.</td>
        <td width="15%" class="sub-header">PROCESOS</td>
        <td width="20%" class="sub-header">OBSERVACIONES</td>
        <td width="4%" class="sub-header">ITEM</td>
        <td width="25%" class="sub-header">DESCRIPCION</td>
        <td width="5%" class="sub-header">CANT.</td>
        <td class="sub-header">OBSERVACION</td>
      </tr>
  <!--<tr>
        <td rowspan="{varOIPdescCantidad}"  class="sub-header">{varProcesoParte}</td>
        <td class="sub-header-numeric">{varCodigo}</td>
        <td class="lefty-align">{varDescripcion}</td>
        <td>{varObservaciones}</td>
        <td class="sub-header-numeric">{varItem}</td>
        <td>{varDescripcionMat}</td>
        <td>{varCantidad}</td>
        <td>{varObservacion}</td>       
      </tr>
      
  </table>
  </body>
</html>-->

