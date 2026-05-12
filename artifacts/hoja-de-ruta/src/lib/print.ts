export const printShift = (title: string, dateStr: string, orders: any[]) => {
  const content = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Hoja de Ruta - ${title} - ${dateStr}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; font-size: 14px; color: #111; }
        h1 { font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 20px; }
        table { w-full; border-collapse: collapse; margin-bottom: 20px; width: 100%; }
        th, td { border: 1px solid #999; padding: 8px 12px; text-align: left; }
        th { background-color: #eee; font-weight: bold; }
        .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-right: 4px; }
        .pink { background-color: #fce7f3; color: #be185d; }
        .orange { background-color: #fef3c7; color: #b45309; }
        .green { background-color: #dcfce7; color: #15803d; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <h1>Hoja de Ruta: ${title} (${dateStr})</h1>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>Cliente</th>
            <th>Dirección</th>
            <th>Productos</th>
            <th>Garrafa</th>
            <th>Repartidor</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((o, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${o.nombre}</strong></td>
              <td>${o.dir || '-'}</td>
              <td>
                ${o.items.map((i: any) => `<div>${i.cant}x ${i.prod}</div>`).join('')}
              </td>
              <td>
                ${o.tieneGarrafa ? `<span class="tag ${o.garrafaEstado === 'paga' ? 'green' : 'orange'}">${o.garrafaEstado === 'paga' ? 'Pagada' : 'Pendiente'}</span>` : '-'}
              </td>
              <td>${o.rep}</td>
              <td>${o.tienePedido ? `<span class="tag pink">Especial</span> ${o.nota || ''}` : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <script>
        window.onload = () => { window.print(); window.close(); }
      </script>
    </body>
    </html>
  `;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(content);
    win.document.close();
  }
};
