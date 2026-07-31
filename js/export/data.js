"use strict";

    /* ======================================================================
       8. COLETA, GERAÇÃO E EXPORTAÇÃO DO RESULTADO
       ====================================================================== */
    function selectedText(select) {
      return select?.selectedOptions?.[0]?.textContent || "";
    }

    function detailedItemLabel(itemLabel, itemDetail) {
      const detail = String(itemDetail || "").trim();
      return detail ? `${itemLabel} (${detail})` : itemLabel;
    }

    function collectCourseExpenses(card) {
      return [...card.querySelectorAll("[data-course-expenses] tbody tr")].map(row => {
        const typeSelect = row.querySelector('[data-field="tipo_item_despesa"]');
        const itemSelect = row.querySelector('[data-field="item_despesa"]');
        const itemDetail = row.querySelector('[data-field="detalhamento_item"]').value.trim();
        return {
          tipo_item_id: typeSelect.value,
          tipo_item_label: selectedText(typeSelect),
          item_id: itemSelect.value,
          item_label: detailedItemLabel(selectedText(itemSelect), itemDetail),
          detalhamento_item: itemDetail,
          codigo_elemento_despesa: row.querySelector('[data-field="codigo_elemento_despesa"]').value,
          unidade: row.querySelector('[data-field="unidade"]').value,
          quantidade_itens: Number(row.querySelector('[data-field="quantidade_itens"]').value),
          valor_unitario: currencyValue(row.querySelector('[data-field="valor_unitario"]')),
          valor_total: Number(row.querySelector('[data-field="valor_total"]').dataset.value || 0),
          fonte_recurso: "SISEC"
        };
      });
    }

    function collectCourses() {
      return [...document.querySelectorAll(".course-card")].map(card => {
        const value = field => card.querySelector(`[data-field="${field}"]`).value;
        return {
          dados_gerais: {
            nome_curso: value("nome_curso").trim(),
            inicio_curso: value("inicio_curso"),
            fim_curso: value("fim_curso"),
            carga_horaria: Number(value("carga_horaria_total")),
            quantidade_participantes: Number(value("quantidade_participantes")),
            margem_reserva: Number(value("margem_reserva")),
            carga_horaria_diaria: Number(value("carga_horaria_diaria")),
            quantidade_encontros_semanais: Number(value("quantidade_encontros_semanais")),
            quantidade_turmas: Number(value("quantidade_turmas")),
            participantes_por_turma: Number(value("participantes_por_turma")),
            distribuicao_turmas: calculateClassDistribution(Number(value("quantidade_participantes")))
          },
          despesas: collectCourseExpenses(card)
        };
      });
    }

    function collectStagePeriod(kind) {
      const period = document.querySelector(`[data-stage-period="${kind}"]`);
      return {
        inicio: period?.querySelector('[data-field="inicio_etapa"]')?.value || "",
        fim: period?.querySelector('[data-field="fim_etapa"]')?.value || ""
      };
    }

    function collectStage(kind) {
      const period = collectStagePeriod(kind);
      return [...document.querySelectorAll(`#${kind}-table tbody tr`)].map(row => {
        const itemSelect = row.querySelector('[data-field="item_despesa"]');
        const catalogItem = catalogs[kind].find(item => item.id === itemSelect.value);
        const itemDetail = row.querySelector('[data-field="detalhamento_item"]').value.trim();
        return {
          item_id: itemSelect.value,
          item_label: detailedItemLabel(selectedText(itemSelect), itemDetail),
          detalhamento_item: itemDetail,
          codigo_elemento_despesa: row.querySelector('[data-field="codigo_elemento_despesa"]').value,
          unidade: row.querySelector('[data-field="unidade"]').value,
          quantidade_itens: Number(row.querySelector('[data-field="quantidade_itens"]').value),
          valor_unitario: currencyValue(row.querySelector('[data-field="valor_unitario"]')),
          valor_total: Number(row.querySelector('[data-field="valor_total"]').dataset.value || 0),
          fonte_recurso: row.querySelector('[data-field="fonte_recurso"]').value,
          inicio_etapa: period.inicio,
          fim_etapa: period.fim,
          tipo_despesa: catalogItem?.tipo || ""
        };
      });
    }

    const groupedCourseExpenseTypes = new Set([
      "kit_participante",
      "insumos_gerais",
      "epi",
      "kit_trabalho"
    ]);

    const courseSummaryLabels = {
      kit_participante: "Kit participante (memória de cálculo anexa)",
      insumos_gerais: "Insumos para as aulas práticas (memória de cálculo anexa)",
      epi: "EPIs (memória de cálculo anexa)",
      kit_trabalho: "Kit Trabalho (memória de cálculo anexa)"
    };

    const courseSummaryUnits = {
      kit_participante: "unid.",
      insumos_gerais: "unid.",
      epi: "unid.",
      kit_trabalho: "kit"
    };

    function roundCurrencyValue(value) {
      return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
    }

    function sumExpenseValues(expenses) {
      return roundCurrencyValue(
        expenses.reduce((total, expense) => total + Number(expense.valor_total || 0), 0)
      );
    }

    function uniqueNonEmptyValues(values) {
      return [...new Set(values.filter(value => value != null && value !== ""))];
    }

    function courseSummaryQuantity(typeId, generalData) {
      const participants = Number(generalData.quantidade_participantes || 0);
      const reserveMargin = Number(generalData.margem_reserva || 0);

      if (["kit_participante", "epi"].includes(typeId)) {
        return calculateParticipantCountWithReserve(participants, reserveMargin);
      }
      if (typeId === "kit_trabalho") return participants;
      return 1;
    }

    function buildCourseSummary(course) {
      const generalData = course.dados_gerais || {};
      const detailedExpenses = course.despesas_detalhadas || course.despesas || [];
      const expensesByType = detailedExpenses.reduce((groups, expense) => {
        const typeId = expense.tipo_item_id;
        if (!groups.has(typeId)) groups.set(typeId, []);
        groups.get(typeId).push(expense);
        return groups;
      }, new Map());
      const insertedGroups = new Set();
      const lines = [];

      detailedExpenses.forEach(expense => {
        const typeId = expense.tipo_item_id;
        if (!groupedCourseExpenseTypes.has(typeId)) {
          lines.push({ ...expense, agrupado: false });
          return;
        }
        if (insertedGroups.has(typeId)) return;

        insertedGroups.add(typeId);
        const groupedExpenses = expensesByType.get(typeId) || [];
        const category = catalogs.tiposItemCurso.find(item => item.id === typeId);
        const quantity = courseSummaryQuantity(typeId, generalData);
        const total = sumExpenseValues(groupedExpenses);
        const expenseCodes = uniqueNonEmptyValues(
          groupedExpenses.map(item => item.codigo_elemento_despesa)
        );
        const fundingSources = uniqueNonEmptyValues(
          groupedExpenses.map(item => item.fonte_recurso)
        );
        const expenseTypes = uniqueNonEmptyValues(
          groupedExpenses.map(item => item.tipo_despesa)
        );

        lines.push({
          agrupado: true,
          tipo_item_id: typeId,
          tipo_item_label: category?.label || expense.tipo_item_label,
          item_id: `resumo_${typeId}`,
          item_label: courseSummaryLabels[typeId] || category?.label || expense.tipo_item_label,
          codigo_elemento_despesa: expenseCodes.join(", "),
          codigos_elemento_despesa: expenseCodes,
          unidade: courseSummaryUnits[typeId] || "unid.",
          quantidade_itens: quantity,
          valor_unitario: quantity > 0 ? total / quantity : 0,
          valor_total: total,
          fonte_recurso: fundingSources.length === 1 ? fundingSources[0] : "Múltiplas",
          inicio_etapa: generalData.inicio_curso || "",
          fim_etapa: generalData.fim_curso || "",
          tipo_despesa: expenseTypes[0] || "",
          itens_origem: groupedExpenses.map(item => item.item_id)
        });
      });

      const totalsByItemType = Object.fromEntries(
        [...expensesByType].map(([typeId, expenses]) => [typeId, sumExpenseValues(expenses)])
      );

      return {
        linhas: lines,
        totais_por_tipo_item: totalsByItemType,
        valor_total: sumExpenseValues(detailedExpenses)
      };
    }

    function buildStageData(stageNumber, expenses) {
      return {
        numero_etapa: stageNumber,
        despesas: expenses,
        valor_total: sumExpenseValues(expenses)
      };
    }

    function buildAssistanceStageData(stageNumber, expenses, totalParticipants) {
      const period = collectStagePeriod("assistance");
      return {
        numero_etapa: stageNumber,
        dados_gerais: {
          quantidade_participantes: totalParticipants,
          tematica_assistencia: assistanceThemeInput.value.trim(),
          inicio_etapa: period.inicio,
          fim_etapa: period.fim
        },
        despesas: expenses,
        valor_total: sumExpenseValues(expenses)
      };
    }

    function collectSpecificObjectives() {
      return [...document.querySelectorAll("[data-specific-objective]")]
        .filter(container => !container.hidden)
        .map(container => {
          const input = container.querySelector("textarea");
          return {
            numero: Number(container.dataset.objectiveNumber),
            texto: input?.value.trim() || ""
          };
        })
        .filter(objective => objective.texto);
    }

    function buildExportData() {
      const collectedCourses = collectCourses();
      const courses = collectedCourses.map((course, index) => {
        const stageNumber = `1.${index + 3}`;
        const detailedExpenses = course.despesas.map(expense => {
          const category = catalogs.tiposItemCurso.find(item => item.id === expense.tipo_item_id);
          const catalogItem = category?.itens.find(item => item.id === expense.item_id);
          return {
            ...expense,
            inicio_etapa: course.dados_gerais.inicio_curso,
            fim_etapa: course.dados_gerais.fim_curso,
            tipo_despesa: catalogItem?.tipo || ""
          };
        });
        const normalizedCourse = {
          numero_etapa: stageNumber,
          dados_gerais: course.dados_gerais,
          despesas_detalhadas: detailedExpenses
        };
        const summary = buildCourseSummary(normalizedCourse);

        return {
          ...normalizedCourse,
          despesas_resumidas: summary.linhas,
          resumo_financeiro: {
            totais_por_tipo_item: summary.totais_por_tipo_item,
            valor_total: summary.valor_total
          }
        };
      });

      const stage11Expenses = collectStage("stage11");
      const stage12Expenses = collectStage("stage12");
      const assistanceExpenses = assistanceCheckbox.checked ? collectStage("assistance") : [];
      const eventExpenses = eventCheckbox.checked ? collectStage("event") : [];
      const allExpenses = [
        ...stage11Expenses,
        ...stage12Expenses,
        ...courses.flatMap(course => course.despesas_detalhadas),
        ...assistanceExpenses,
        ...eventExpenses
      ];
      const totalsByExpenseType = allExpenses.reduce((totals, expense) => {
        const type = expense.tipo_despesa;
        if (type) {
          totals[type] = roundCurrencyValue(
            (totals[type] || 0) + Number(expense.valor_total || 0)
          );
        }
        return totals;
      }, {});
      const totalsByFundingSource = allExpenses.reduce((totals, expense) => {
        const source = expense.fonte_recurso;
        if (source) {
          totals[source] = roundCurrencyValue(
            (totals[source] || 0) + Number(expense.valor_total || 0)
          );
        }
        return totals;
      }, {});
      const totalParticipants = courses.reduce(
        (total, course) => total + Number(course.dados_gerais.quantidade_participantes || 0),
        0
      );
      const totalWorkload = courses.reduce(
        (total, course) => total + Number(course.dados_gerais.carga_horaria || 0),
        0
      );
      const managementTotal = totalsByExpenseType.Gestao || 0;
      const finalisticTotal = totalsByExpenseType.Finalistica || 0;
      const structuringTotal = totalsByExpenseType.Estruturacao || 0;
      const kitTotal = totalsByExpenseType.Kit || 0;
      const calculatedProjectTotal = sumExpenseValues(allExpenses);
      const managementFinalisticTotal = roundCurrencyValue(managementTotal + finalisticTotal);
      const participantUnitCost = calculateParticipantUnitCost(
        totalWorkload,
        totalParticipants,
        managementFinalisticTotal
      );
      const assistanceStageNumber = `1.${courses.length + 3}`;
      const eventStageNumber = `1.${courses.length + (assistanceCheckbox.checked ? 4 : 3)}`;

      return {
        projeto: {
          custo_total_informado: currencyValue(document.getElementById("custo_total_projeto")),
          custo_total_calculado: calculatedProjectTotal,
          quantidade_cursos: courses.length,
          total_participantes: totalParticipants,
          total_carga_horaria: totalWorkload,
          objetivo_geral: document.getElementById("objetivo_geral_projeto").value.trim(),
          objetivos_especificos: collectSpecificObjectives(),
          possui_assistencia_tecnica_gerencial: assistanceCheckbox.checked,
          possui_evento_final: eventCheckbox.checked
        },
        resumo_financeiro: {
          gestao: managementTotal,
          finalistica: finalisticTotal,
          gestao_finalistica: managementFinalisticTotal,
          estruturacao: structuringTotal,
          kit_trabalho: kitTotal,
          total_projeto: calculatedProjectTotal,
          custo_unitario_por_participante: participantUnitCost,
          sisec: totalsByFundingSource.SISEC || 0,
          contrapartida: totalsByFundingSource.Contrapartida || 0
        },
        etapas: {
          etapa_1_1: buildStageData("1.1", stage11Expenses),
          etapa_1_2: buildStageData("1.2", stage12Expenses),
          assistencia_tecnica_gerencial: assistanceCheckbox.checked
            ? buildAssistanceStageData(assistanceStageNumber, assistanceExpenses, totalParticipants)
            : null,
          etapa_final: eventCheckbox.checked
            ? buildStageData(eventStageNumber, eventExpenses)
            : null
        },
        cursos: courses
      };
    }

    function buildJson() {
      return buildExportData();
    }

