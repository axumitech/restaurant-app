import ExcelJS from 'exceljs';

function saveWorkbook(buffer, filename) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function applyBorder(cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  };
}

function buildWorksheet(workbook, { name, title, subtitle, summaryRows, columns, rows }) {
  const worksheet = workbook.addWorksheet(name || 'Commandes', {
    views: [{ state: 'frozen', ySplit: summaryRows.length + 5 }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  worksheet.columns = columns.map((column) => ({
    key: column.key,
    width: column.width || 18,
    style: column.numeric
      ? { numFmt: '#,##0', alignment: { horizontal: 'right' } }
      : { alignment: { horizontal: 'left' } },
  }));

  worksheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 18, color: { argb: 'FFFFD000' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells(2, 1, 2, columns.length);
  const subtitleCell = worksheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = { size: 11, color: { argb: 'FF374151' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  subtitleCell.alignment = { horizontal: 'center' };

  let currentRow = 4;
  summaryRows.forEach(([label, value]) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = label;
    row.getCell(2).value = value;
    row.getCell(1).font = { bold: true };
    row.getCell(2).font = { bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    row.getCell(2).alignment = { horizontal: 'right' };
    applyBorder(row.getCell(1));
    applyBorder(row.getCell(2));
    currentRow += 1;
  });

  currentRow += 1;
  const headerRow = worksheet.getRow(currentRow);
  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.label;
    cell.font = { bold: true, color: { argb: 'FF111111' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD000' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyBorder(cell);
  });
  headerRow.height = 22;

  rows.forEach((rowData) => {
    const row = worksheet.addRow(rowData);
    row.eachCell((cell) => {
      applyBorder(cell);
      cell.alignment = {
        horizontal: typeof cell.value === 'number' ? 'right' : 'left',
        vertical: 'middle',
      };
    });
  });

  worksheet.autoFilter = {
    from: { row: currentRow, column: 1 },
    to: { row: currentRow, column: columns.length },
  };
}

export async function exportStyledExcel({
  filename,
  title,
  subtitle,
  summaryRows,
  columns,
  rows,
  worksheets,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Premium Délice';
  workbook.created = new Date();

  if (Array.isArray(worksheets) && worksheets.length > 0) {
    worksheets.forEach((worksheetConfig) => {
      buildWorksheet(workbook, {
        name: worksheetConfig.name,
        title: worksheetConfig.title || title,
        subtitle: worksheetConfig.subtitle || subtitle,
        summaryRows,
        columns: worksheetConfig.columns,
        rows: worksheetConfig.rows,
      });
    });
  } else {
    buildWorksheet(workbook, {
      name: 'Commandes',
      title,
      subtitle,
      summaryRows,
      columns,
      rows,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveWorkbook(buffer, filename);
}
