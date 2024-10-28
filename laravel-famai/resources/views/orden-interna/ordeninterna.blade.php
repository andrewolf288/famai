<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Reporte</title>
    <style>
        body {
            font-family: Arial, sans-serif;
        }

        .content {
            margin: 0 20px;
        }

        /* Configuración del pie de página */
        .footer {
            position: fixed;
            bottom: -30px;
            left: 0;
            right: 0;
            height: 50px;
            text-align: right;
            font-size: 12px;
            color: #555;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>

<body>
    <div class="content">
        <h1>Mi Reporte</h1>
        <p>Contenido del reporte aquí...</p>
        <table>
            <thead>
                <th>Encabezado</th>
            </thead>
            <tbody>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
                <tr>
                    <td>tr 1</td>
                </tr>
            </tbody>
        </table>
        {{-- <div class="page-break"></div>
        <h2>Segunda sección</h2> --}}
    </div>

    <script type="text/php">
        if ( isset($pdf) ) {
            $x = $pdf->get_width() - 72;
            $y = $pdf->get_height() - 72;
            $text = "{PAGE_NUM} de {PAGE_COUNT}";
            $font = $fontMetrics->get_font("helvetica", "bold");
            $size = 12;
            $color = array(255,0,0);
            $word_space = 0.0;  //  default
            $char_space = 0.0;  //  default
            $angle = 0.0;   //  default
            $pdf->page_text($x, $y, $text, $font, $size, $color, $word_space, $char_space, $angle);
        }
    </script>
</body>

</html>
