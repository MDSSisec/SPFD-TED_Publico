"use strict";

    const spreadsheetTemplateUrl = "./templates/template_exportacao.xlsx";
    const spreadsheetMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    function ensureExcelJsAvailable() {
      if (typeof ExcelJS === "undefined" || typeof ExcelJS.Workbook !== "function") {
        throw new Error("A biblioteca ExcelJS nao foi carregada corretamente.");
      }
    }

    function validateSpreadsheetTemplate(workbook) {
      const summarySheet = workbook.getWorksheet("Resumo do projeto");
      const modelsSheet = workbook.getWorksheet("_MODELOS");

      if (!summarySheet || !modelsSheet) {
        throw new Error("O template XLSX nao possui as abas obrigatorias.");
      }
      if (modelsSheet.state !== "hidden" && modelsSheet.state !== "veryHidden") {
        throw new Error("A aba _MODELOS precisa permanecer oculta.");
      }

      return { summarySheet, modelsSheet };
    }

    async function loadSpreadsheetTemplate(templateUrl = spreadsheetTemplateUrl) {
      ensureExcelJsAvailable();

      const response = await fetch(templateUrl, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Nao foi possivel carregar o template XLSX (${response.status}).`);
      }

      const templateBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateBuffer);
      validateSpreadsheetTemplate(workbook);
      return workbook;
    }

    async function serializeSpreadsheet(workbook) {
      ensureExcelJsAvailable();
      validateSpreadsheetTemplate(workbook);
      workbook.calcProperties.fullCalcOnLoad = true;
      workbook.calcProperties.forceFullCalc = true;
      return workbook.xlsx.writeBuffer();
    }

    function downloadSpreadsheetBuffer(buffer, filename = "projeto_qualificacao.xlsx") {
      const blob = new Blob([buffer], { type: spreadsheetMimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }

    function cloneSpreadsheetObject(value) {
      return value == null ? value : JSON.parse(JSON.stringify(value));
    }

    function captureRowPrototype(worksheet, rowNumber, firstColumn, lastColumn) {
      const row = worksheet.getRow(rowNumber);
      const cells = [];
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        cells.push({ style: cloneSpreadsheetObject(row.getCell(column).style) || {} });
      }
      return {
        firstColumn,
        lastColumn,
        height: row.height,
        cells
      };
    }

    function applyRowPrototype(worksheet, rowNumber, prototype) {
      const row = worksheet.getRow(rowNumber);
      row.height = prototype.height;
      prototype.cells.forEach((cellPrototype, index) => {
        const cell = row.getCell(prototype.firstColumn + index);
        cell.value = null;
        cell.style = cloneSpreadsheetObject(cellPrototype.style) || {};
      });
      return row;
    }

    function unmergeAllCells(worksheet) {
      Object.values(worksheet._merges || {}).forEach(merge => {
        worksheet.unMergeCells(merge.range);
      });
    }

    function monthYearToSpreadsheetDate(value) {
      const match = /^(0[1-9]|1[0-2])\/(\d{4})$/.exec(value || "");
      return match ? new Date(Number(match[2]), Number(match[1]) - 1, 1) : null;
    }

    function setSpreadsheetPeriodCell(cell, value) {
      const date = monthYearToSpreadsheetDate(value);
      cell.value = date || value || "";
      if (date) cell.numFmt = "mm/yyyy";
    }

    function replaceSpreadsheetMarkers(text, values) {
      return Object.entries(values).reduce(
        (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value ?? "")),
        String(text || "")
      );
    }

    function projectMetaFromTemplate(template, project) {
      const meta = replaceSpreadsheetMarkers(template, {
        TOTAL_PARTICIPANTES: project.total_participantes
      });
      if (project.possui_assistencia_tecnica_gerencial) return meta;

      return meta
        .replace(/,\s*e\s+assist[eê]ncia\s+t[eé]cnica\s+e\s+gerencial/gi, "")
        .replace(/\s+([.,;:!?])/g, "$1");
    }

    function fillSummaryExpenseRow(worksheet, rowNumber, expense, stageNumber, itemIndex) {
      const cells = worksheet.getRow(rowNumber);
      if (!expense) {
        for (let column = 3; column <= 12; column += 1) cells.getCell(column).value = null;
        return;
      }

      cells.getCell(3).value = `${stageNumber}.${itemIndex + 1} - ${expense.item_label || ""}`;
      cells.getCell(4).value = expense.codigo_elemento_despesa || "";
      cells.getCell(5).value = expense.unidade || "";
      cells.getCell(6).value = Number(expense.quantidade_itens || 0);
      cells.getCell(7).value = Number(expense.valor_unitario || 0);
      cells.getCell(8).value = {
        formula: `F${rowNumber}*G${rowNumber}`,
        result: Number(expense.valor_total || 0)
      };
      cells.getCell(9).value = expense.fonte_recurso || "";
      setSpreadsheetPeriodCell(cells.getCell(10), expense.inicio_etapa);
      setSpreadsheetPeriodCell(cells.getCell(11), expense.fim_etapa);
      cells.getCell(12).value = expense.tipo_despesa || "";
      cells.getCell(7).numFmt = 'R$ #,##0.00';
      cells.getCell(8).numFmt = 'R$ #,##0.00';
    }

    function courseDescriptionFromTemplate(templateText, course) {
      const generalData = course.dados_gerais;
      return replaceSpreadsheetMarkers(templateText, {
        NUMERO_ETAPA: course.numero_etapa,
        NOME_CURSO: generalData.nome_curso,
        CARGA_HORARIA: generalData.carga_horaria,
        QUANTIDADE_PARTICIPANTES: generalData.quantidade_participantes,
        MARGEM_RESERVA: generalData.margem_reserva,
        QUANTIDADE_TURMAS: generalData.quantidade_turmas
      });
    }

    const assistanceSpreadsheetDescription = `Etapa {{NUMERO_ETAPA}} - Realizar Assistência Técnica e Gerencial para {{QUANTIDADE_PARTICIPANTES}} empreendedoras/es, nas seguintes temáticas:

{{TEMATICA_ASSISTENCIA}}

Produto {{NUMERO_ETAPA}} - Assistência Técnica e Gerencial realizada, comprovados por meio de Relatórios, sendo a comprovação conforme previsto no item 24 do TRP.`;

    function assistanceDescription(assistance) {
      return replaceSpreadsheetMarkers(assistanceSpreadsheetDescription, {
        NUMERO_ETAPA: assistance.numero_etapa,
        QUANTIDADE_PARTICIPANTES: assistance.dados_gerais.quantidade_participantes,
        TEMATICA_ASSISTENCIA: assistance.dados_gerais.tematica_assistencia
      });
    }

    function projectPeriod(expenses) {
      const validStarts = expenses
        .map(expense => expense.inicio_etapa)
        .filter(value => monthYearToComparable(value) != null)
        .sort((a, b) => monthYearToComparable(a) - monthYearToComparable(b));
      const validEnds = expenses
        .map(expense => expense.fim_etapa)
        .filter(value => monthYearToComparable(value) != null)
        .sort((a, b) => monthYearToComparable(a) - monthYearToComparable(b));
      return {
        inicio: validStarts[0] || "",
        fim: validEnds.at(-1) || ""
      };
    }

    function buildMainWorksheet(workbook, exportData) {
      const worksheet = workbook.getWorksheet("Resumo do projeto");
      const fixedTexts = {
        meta: worksheet.getCell("A2").value,
        stage11: worksheet.getCell("B2").value,
        stage12: worksheet.getCell("B4").value,
        course: worksheet.getCell("B6").value,
        event: worksheet.getCell("B8").value
      };
      const prototypes = {
        stage11Item: captureRowPrototype(worksheet, 2, 1, 12),
        stage11Total: captureRowPrototype(worksheet, 3, 1, 12),
        stage12Item: captureRowPrototype(worksheet, 4, 1, 12),
        stage12Total: captureRowPrototype(worksheet, 5, 1, 12),
        courseItem: captureRowPrototype(worksheet, 6, 1, 12),
        courseTotal: captureRowPrototype(worksheet, 7, 1, 12),
        eventItem: captureRowPrototype(worksheet, 8, 1, 12),
        eventTotal: captureRowPrototype(worksheet, 9, 1, 12),
        projectTotal: captureRowPrototype(worksheet, 10, 1, 12)
      };

      unmergeAllCells(worksheet);
      if (worksheet.rowCount > 1) worksheet.spliceRows(2, worksheet.rowCount - 1);

      let nextRow = 2;
      const subtotalRows = [];
      const allDetailedExpenses = [];

      const appendBlock = ({
        stageNumber,
        description,
        expenses,
        itemPrototype,
        totalPrototype,
        period = null
      }) => {
        const rowsToWrite = expenses.length ? expenses : [null];
        const firstExpenseRow = nextRow;

        rowsToWrite.forEach((expense, index) => {
          applyRowPrototype(worksheet, nextRow, itemPrototype);
          worksheet.getCell(`B${nextRow}`).value = index === 0 ? description : null;
          fillSummaryExpenseRow(worksheet, nextRow, expense, stageNumber, index);
          if (!expense && period) {
            setSpreadsheetPeriodCell(worksheet.getCell(`J${nextRow}`), period.inicio);
            setSpreadsheetPeriodCell(worksheet.getCell(`K${nextRow}`), period.fim);
          }
          nextRow += 1;
        });

        const lastExpenseRow = nextRow - 1;
        if (lastExpenseRow > firstExpenseRow) {
          worksheet.mergeCells(`B${firstExpenseRow}:B${lastExpenseRow}`);
        }

        applyRowPrototype(worksheet, nextRow, totalPrototype);
        worksheet.getCell(`B${nextRow}`).value = `TOTAL ETAPA ${stageNumber}`;
        worksheet.mergeCells(`B${nextRow}:G${nextRow}`);
        const blockTotal = sumExpenseValues(expenses);
        worksheet.getCell(`H${nextRow}`).value = {
          formula: `SUM(H${firstExpenseRow}:H${lastExpenseRow})`,
          result: blockTotal
        };
        worksheet.getCell(`H${nextRow}`).numFmt = 'R$ #,##0.00';
        subtotalRows.push(nextRow);
        allDetailedExpenses.push(...expenses);
        nextRow += 1;
      };

      appendBlock({
        stageNumber: "1.1",
        description: fixedTexts.stage11,
        expenses: exportData.etapas.etapa_1_1.despesas,
        itemPrototype: prototypes.stage11Item,
        totalPrototype: prototypes.stage11Total
      });
      appendBlock({
        stageNumber: "1.2",
        description: fixedTexts.stage12,
        expenses: exportData.etapas.etapa_1_2.despesas,
        itemPrototype: prototypes.stage12Item,
        totalPrototype: prototypes.stage12Total
      });

      exportData.cursos.forEach(course => {
        appendBlock({
          stageNumber: course.numero_etapa,
          description: courseDescriptionFromTemplate(fixedTexts.course, course),
          expenses: course.despesas_resumidas,
          itemPrototype: prototypes.courseItem,
          totalPrototype: prototypes.courseTotal
        });
        allDetailedExpenses.push(...course.despesas_detalhadas);
      });

      if (exportData.etapas.assistencia_tecnica_gerencial) {
        const assistance = exportData.etapas.assistencia_tecnica_gerencial;
        appendBlock({
          stageNumber: assistance.numero_etapa,
          description: assistanceDescription(assistance),
          expenses: assistance.despesas,
          itemPrototype: prototypes.eventItem,
          totalPrototype: prototypes.eventTotal,
          period: {
            inicio: assistance.dados_gerais.inicio_etapa,
            fim: assistance.dados_gerais.fim_etapa
          }
        });
      }

      if (exportData.etapas.etapa_final) {
        appendBlock({
          stageNumber: exportData.etapas.etapa_final.numero_etapa,
          description: replaceSpreadsheetMarkers(fixedTexts.event, {
            NUMERO_ETAPA_FINAL: exportData.etapas.etapa_final.numero_etapa
          }),
          expenses: exportData.etapas.etapa_final.despesas,
          itemPrototype: prototypes.eventItem,
          totalPrototype: prototypes.eventTotal
        });
      }

      const lastStageRow = nextRow - 1;
      worksheet.getCell("A2").value = projectMetaFromTemplate(
        fixedTexts.meta,
        exportData.projeto
      );
      if (lastStageRow > 2) worksheet.mergeCells(`A2:A${lastStageRow}`);

      applyRowPrototype(worksheet, nextRow, prototypes.projectTotal);
      worksheet.getCell(`A${nextRow}`).value = "TOTAL DO PROJETO";
      worksheet.mergeCells(`A${nextRow}:G${nextRow}`);
      worksheet.getCell(`H${nextRow}`).value = {
        formula: `SUM(${subtotalRows.map(row => `H${row}`).join(",")})`,
        result: exportData.resumo_financeiro.total_projeto
      };
      worksheet.getCell(`H${nextRow}`).numFmt = 'R$ #,##0.00';
      const period = projectPeriod(allDetailedExpenses);
      setSpreadsheetPeriodCell(worksheet.getCell(`J${nextRow}`), period.inicio);
      setSpreadsheetPeriodCell(worksheet.getCell(`K${nextRow}`), period.fim);
      worksheet.getCell(`L${nextRow}`).value = "-";
      worksheet.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];

      return { worksheet, projectTotalRow: nextRow, subtotalRows };
    }

    const detailedCourseTypeOrder = [
      "kit_participante",
      "insumos_gerais",
      "epi",
      "kit_trabalho"
    ];

    const detailedCourseTypeTitles = {
      kit_participante: "KIT PARTICIPANTE",
      insumos_gerais: "INSUMOS PARA AS AULAS PRATICAS",
      epi: "EPI",
      kit_trabalho: "KIT TRABALHO"
    };

    function copyDetailedSheetSettings(modelsSheet, targetSheet) {
      for (let column = 1; column <= 7; column += 1) {
        targetSheet.getColumn(column).width = modelsSheet.getColumn(column).width;
      }
      targetSheet.properties.defaultRowHeight = modelsSheet.properties.defaultRowHeight;
      targetSheet.pageSetup = cloneSpreadsheetObject(modelsSheet.pageSetup);
      targetSheet.views = [{ state: "frozen", ySplit: 0, activeCell: "A1" }];
    }

    function createCourseDetailWorksheet(workbook, modelsSheet, course) {
      const worksheet = workbook.addWorksheet(`Despesas Etapa ${course.numero_etapa}`);
      copyDetailedSheetSettings(modelsSheet, worksheet);
      const prototypes = {
        title: captureRowPrototype(modelsSheet, 1, 1, 7),
        header: captureRowPrototype(modelsSheet, 2, 1, 7),
        item: captureRowPrototype(modelsSheet, 3, 1, 7),
        total: captureRowPrototype(modelsSheet, 4, 1, 7),
        perParticipant: captureRowPrototype(modelsSheet, 5, 1, 7)
      };
      const expensesByType = course.despesas_detalhadas.reduce((groups, expense) => {
        if (!groups.has(expense.tipo_item_id)) groups.set(expense.tipo_item_id, []);
        groups.get(expense.tipo_item_id).push(expense);
        return groups;
      }, new Map());
      let nextRow = 1;

      detailedCourseTypeOrder.forEach(typeId => {
        const expenses = expensesByType.get(typeId) || [];
        if (!expenses.length) return;
        const title = detailedCourseTypeTitles[typeId];

        applyRowPrototype(worksheet, nextRow, prototypes.title);
        worksheet.getCell(`A${nextRow}`).value = title;
        worksheet.mergeCells(`A${nextRow}:G${nextRow}`);
        nextRow += 1;

        applyRowPrototype(worksheet, nextRow, prototypes.header);
        [
          "Tipo do item",
          "Item de despesa",
          "Codigo do Elemento de Despesa",
          "Unidade",
          "Quantidade de Itens de Despesa",
          "Valor Unitario (R$)",
          "Valor Total (R$)"
        ].forEach((label, index) => {
          worksheet.getRow(nextRow).getCell(index + 1).value = label;
        });
        nextRow += 1;
        const firstItemRow = nextRow;

        expenses.forEach(expense => {
          applyRowPrototype(worksheet, nextRow, prototypes.item);
          const row = worksheet.getRow(nextRow);
          row.getCell(1).value = expense.tipo_item_label;
          row.getCell(2).value = expense.item_label;
          row.getCell(3).value = expense.codigo_elemento_despesa;
          row.getCell(4).value = expense.unidade;
          row.getCell(5).value = Number(expense.quantidade_itens || 0);
          row.getCell(6).value = Number(expense.valor_unitario || 0);
          row.getCell(7).value = {
            formula: `E${nextRow}*F${nextRow}`,
            result: Number(expense.valor_total || 0)
          };
          row.getCell(6).numFmt = 'R$ #,##0.00';
          row.getCell(7).numFmt = 'R$ #,##0.00';
          nextRow += 1;
        });

        const lastItemRow = nextRow - 1;
        const typeTotal = sumExpenseValues(expenses);
        applyRowPrototype(worksheet, nextRow, prototypes.total);
        worksheet.getCell(`A${nextRow}`).value = `TOTAL ${title}`;
        worksheet.mergeCells(`A${nextRow}:F${nextRow}`);
        worksheet.getCell(`G${nextRow}`).value = {
          formula: `SUM(G${firstItemRow}:G${lastItemRow})`,
          result: typeTotal
        };
        worksheet.getCell(`G${nextRow}`).numFmt = 'R$ #,##0.00';
        const totalRow = nextRow;
        nextRow += 1;

        applyRowPrototype(worksheet, nextRow, prototypes.perParticipant);
        const participants = Number(course.dados_gerais.quantidade_participantes || 0);
        worksheet.getCell(`A${nextRow}`).value = `Total por participante (n=${participants})`;
        worksheet.mergeCells(`A${nextRow}:F${nextRow}`);
        worksheet.getCell(`G${nextRow}`).value = {
          formula: participants > 0 ? `G${totalRow}/${participants}` : "0",
          result: participants > 0 ? typeTotal / participants : 0
        };
        worksheet.getCell(`G${nextRow}`).numFmt = 'R$ #,##0.00';
        nextRow += 2;
      });

      if (nextRow === 1) {
        applyRowPrototype(worksheet, 1, prototypes.title);
        worksheet.getCell("A1").value = "SEM DESPESAS DETALHADAS PARA ESTE CURSO";
        worksheet.mergeCells("A1:G1");
      }

      return worksheet;
    }

    function buildCourseDetailWorksheets(workbook, exportData) {
      const modelsSheet = workbook.getWorksheet("_MODELOS");
      workbook.worksheets
        .filter(sheet => sheet.name.startsWith("Despesas Etapa "))
        .forEach(sheet => workbook.removeWorksheet(sheet.id));
      return exportData.cursos.map(course =>
        createCourseDetailWorksheet(workbook, modelsSheet, course)
      );
    }

    const generalTableBorder = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } }
    };

    function applyGeneralTableStyle(cell, options = {}) {
      cell.font = {
        name: "Aptos Narrow",
        family: 2,
        size: 11,
        bold: Boolean(options.bold),
        color: options.fontColor ? { argb: options.fontColor } : { theme: 1 }
      };
      cell.border = cloneSpreadsheetObject(generalTableBorder);
      cell.alignment = {
        vertical: "middle",
        horizontal: options.horizontal || "left",
        wrapText: true
      };
      cell.fill = options.fillColor
        ? {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: options.fillColor },
            bgColor: { argb: options.fillColor }
          }
        : { type: "pattern", pattern: "none" };
    }

    function removeWorksheetIfPresent(workbook, sheetName) {
      const existing = workbook.getWorksheet(sheetName);
      if (existing) workbook.removeWorksheet(existing.id);
    }

    function courseDistributionText(generalData) {
      const distribution = Array.isArray(generalData.distribuicao_turmas)
        ? generalData.distribuicao_turmas
        : [];
      if (!distribution.length) return "";
      const total = distribution.reduce((sum, value) => sum + Number(value || 0), 0);
      return `Distribuicao: ${distribution.join(" + ")} = ${total} participantes.`;
    }

    function buildGeneralCoursesWorksheet(workbook, exportData) {
      const sheetName = "Dados gerais cursos";
      removeWorksheetIfPresent(workbook, sheetName);
      const worksheet = workbook.addWorksheet(sheetName);
      [35, 20, 22, 18, 23, 15, 38].forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });

      worksheet.mergeCells("A1:G1");
      worksheet.getCell("A1").value = "Tabela de dados gerais dos cursos";
      applyGeneralTableStyle(worksheet.getCell("A1"), {
        bold: true,
        horizontal: "center"
      });

      const headers = [
        "Curso",
        "Carga horaria total do curso",
        "Qtd. Participantes do curso",
        "Carga horaria diaria",
        "Qtd. encontros semanais",
        "Qtd. Turmas",
        "Qtd. Participantes por Turma"
      ];
      headers.forEach((header, index) => {
        const cell = worksheet.getRow(2).getCell(index + 1);
        cell.value = header;
        applyGeneralTableStyle(cell, { bold: true, horizontal: "center" });
      });

      exportData.cursos.forEach((course, index) => {
        const rowNumber = index + 3;
        const generalData = course.dados_gerais;
        const values = [
          generalData.nome_curso,
          Number(generalData.carga_horaria || 0),
          Number(generalData.quantidade_participantes || 0),
          Number(generalData.carga_horaria_diaria || 0),
          Number(generalData.quantidade_encontros_semanais || 0),
          Number(generalData.quantidade_turmas || 0),
          courseDistributionText(generalData)
        ];
        values.forEach((value, columnIndex) => {
          const cell = worksheet.getRow(rowNumber).getCell(columnIndex + 1);
          cell.value = value;
          applyGeneralTableStyle(cell, {
            horizontal: columnIndex === 0 || columnIndex === 6 ? "left" : "center"
          });
        });
      });

      const firstCourseRow = 3;
      const lastCourseRow = Math.max(firstCourseRow, exportData.cursos.length + 2);
      const totalRow = exportData.cursos.length + 3;
      worksheet.getCell(`A${totalRow}`).value = "Total";
      worksheet.getCell(`B${totalRow}`).value = {
        formula: `SUM(B${firstCourseRow}:B${lastCourseRow})`,
        result: exportData.projeto.total_carga_horaria
      };
      worksheet.getCell(`C${totalRow}`).value = {
        formula: `SUM(C${firstCourseRow}:C${lastCourseRow})`,
        result: exportData.projeto.total_participantes
      };
      for (let column = 1; column <= 7; column += 1) {
        applyGeneralTableStyle(worksheet.getRow(totalRow).getCell(column), {
          bold: true,
          horizontal: column === 1 ? "left" : "center"
        });
      }
      worksheet.views = [{ state: "frozen", ySplit: 2, activeCell: "A3" }];
      worksheet.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.2, footer: 0.2 }
      };
      return { worksheet, totalRow };
    }

    function buildGeneralProjectWorksheet(workbook, exportData, coursesTotalRow) {
      const sheetName = "Dados gerais do projeto";
      removeWorksheetIfPresent(workbook, sheetName);
      const worksheet = workbook.addWorksheet(sheetName);
      worksheet.getColumn(1).width = 78;
      worksheet.getColumn(2).width = 24;
      worksheet.mergeCells("A1:B1");
      worksheet.getCell("A1").value = "Tabela: Detalhamento de custos do projeto";
      applyGeneralTableStyle(worksheet.getCell("A1"), {
        bold: true,
        horizontal: "center"
      });

      const financial = exportData.resumo_financeiro;
      const rows = [
        ["Gestao do Projeto", financial.gestao],
        ["Despesas Finalisticas das Acoes", financial.finalistica],
        ["Total do Projeto (descontando estruturacao e kits, se houver)", {
          formula: "B2+B3",
          result: financial.gestao_finalistica
        }],
        ["Despesa com Estruturacao de Espaco", financial.estruturacao],
        ["Aquisicao de Kits de Trabalho (se houver)", financial.kit_trabalho],
        ["TOTAL DO PROJETO CALCULADO", {
          formula: "SUM(B2,B3,B5,B6)",
          result: financial.total_projeto
        }],
        ["TOTAL DO PROJETO INFORMADO", exportData.projeto.custo_total_informado],
        ["Custo participante/hora médio", {
          formula: `IF(B4=0,0,'Dados gerais cursos'!B${coursesTotalRow}*'Dados gerais cursos'!C${coursesTotalRow}/B4)`,
          result: financial.custo_unitario_por_participante
        }]
      ];

      rows.forEach(([label, value], index) => {
        const rowNumber = index + 2;
        const highlighted = rowNumber >= 7;
        const labelCell = worksheet.getCell(`A${rowNumber}`);
        const valueCell = worksheet.getCell(`B${rowNumber}`);
        labelCell.value = label;
        valueCell.value = value;
        applyGeneralTableStyle(labelCell, {
          bold: true,
          fontColor: highlighted ? undefined : "FF0070C0",
          fillColor: highlighted ? "FF92D050" : undefined
        });
        applyGeneralTableStyle(valueCell, {
          bold: true,
          fontColor: highlighted ? undefined : "FF0070C0",
          fillColor: highlighted ? "FF92D050" : undefined,
          horizontal: "right"
        });
        valueCell.numFmt = 'R$ #,##0.00';
      });
      worksheet.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];
      worksheet.pageSetup = {
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.2, footer: 0.2 }
      };
      return worksheet;
    }

    function buildObjectivesWorksheet(workbook, exportData) {
      const sheetName = "Objetivo geral e específicos";
      removeWorksheetIfPresent(workbook, sheetName);
      const worksheet = workbook.addWorksheet(sheetName);
      worksheet.getColumn(1).width = 28;
      worksheet.getColumn(2).width = 105;

      worksheet.mergeCells("A1:B1");
      worksheet.getCell("A1").value = sheetName;
      applyGeneralTableStyle(worksheet.getCell("A1"), {
        bold: true,
        horizontal: "center"
      });
      worksheet.getRow(1).height = 24;

      const rows = [
        ["Objetivo geral", exportData.projeto.objetivo_geral || ""],
        ...(exportData.projeto.objetivos_especificos || []).map(objective => [
          `Objetivo específico ${objective.numero}`,
          objective.texto
        ])
      ];

      rows.forEach(([label, text], index) => {
        const rowNumber = index + 2;
        const labelCell = worksheet.getCell(`A${rowNumber}`);
        const textCell = worksheet.getCell(`B${rowNumber}`);
        labelCell.value = label;
        textCell.value = text;
        applyGeneralTableStyle(labelCell, {
          bold: true,
          fillColor: "FFD9EAF7"
        });
        applyGeneralTableStyle(textCell);
        worksheet.getRow(rowNumber).height = Math.max(42, Math.ceil(String(text).length / 95) * 17);
      });

      worksheet.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];
      worksheet.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.2, footer: 0.2 }
      };
      return worksheet;
    }

    function buildGeneralDataWorksheets(workbook, exportData) {
      const coursesSheet = buildGeneralCoursesWorksheet(workbook, exportData);
      const projectSheet = buildGeneralProjectWorksheet(
        workbook,
        exportData,
        coursesSheet.totalRow
      );
      const objectivesSheet = buildObjectivesWorksheet(workbook, exportData);
      return { coursesSheet: coursesSheet.worksheet, projectSheet, objectivesSheet };
    }

    async function createSpreadsheetWorkbook(exportData = buildExportData()) {
      const workbook = await loadSpreadsheetTemplate();
      workbook.creator = "Sistema SPFD/TED";
      workbook.lastModifiedBy = "Sistema SPFD/TED";
      workbook.created = new Date();
      workbook.modified = new Date();

      buildMainWorksheet(workbook, exportData);
      buildGeneralDataWorksheets(workbook, exportData);
      buildCourseDetailWorksheets(workbook, exportData);

      return { workbook, exportData };
    }

    async function downloadSpreadsheet() {
      const button = document.getElementById("download-xlsx");
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Gerando planilha...";
      setStatus("Gerando a planilha. Aguarde...", "success");

      try {
        const exportData = state.json || buildExportData();
        const { workbook } = await createSpreadsheetWorkbook(exportData);
        const buffer = await serializeSpreadsheet(workbook);
        downloadSpreadsheetBuffer(buffer);
        setStatus("Planilha gerada com sucesso.", "success");
      } catch (error) {
        console.error(error);
        setStatus(`Nao foi possivel gerar a planilha: ${error.message}`, "error");
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    }

