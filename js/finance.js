"use strict";

    /* ======================================================================
       6. CÁLCULOS E RESUMOS FINANCEIROS
       ====================================================================== */
    function recalculateRow(row) {
      const quantity = Number(row.querySelector('[data-field="quantidade_itens"]')?.value || 0);
      const unitInput = row.querySelector('[data-field="valor_unitario"]');
      const totalInput = row.querySelector('[data-field="valor_total"]');
      if (!unitInput || !totalInput) return;
      const total = quantity * currencyValue(unitInput);
      totalInput.dataset.value = String(total);
      totalInput.value = formatBRL(total);
      const kind = row.dataset.stageKind;
      if (kind) {
        updateStageSummary(kind);
      } else {
        const courseContainer = row.closest("[data-course-expenses]");
        if (courseContainer) updateCourseSummary(courseContainer);
      }
    }

    function expenseTypeFromCatalog(row) {
      const courseTypeSelect = row.querySelector('[data-field="tipo_item_despesa"]');
      const itemId = row.querySelector('[data-field="item_despesa"]')?.value;

      if (courseTypeSelect) {
        const category = catalogs.tiposItemCurso.find(entry => entry.id === courseTypeSelect.value);
        return category?.itens.find(item => item.id === itemId)?.tipo || "";
      }

      const kind = row.dataset.stageKind;
      return catalogs[kind]?.find(item => item.id === itemId)?.tipo || "";
    }

    function formatFinancialPercentage(value) {
      return `${new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value)}%`;
    }

    function calculateParticipantUnitCost(totalWorkload, totalParticipants, managementFinalisticTotal) {
      return managementFinalisticTotal > 0
        ? roundCurrencyValue(totalWorkload * totalParticipants / managementFinalisticTotal)
        : 0;
    }

    function updateFinancialPercentage(kind, percentage, subtotal, compliant, successMessage, dangerMessage) {
      const container = document.getElementById(`financial-${kind}-compliance`);
      const output = document.getElementById(`financial-${kind}-percent`);
      const bar = document.getElementById(`financial-${kind}-bar`);
      const message = document.getElementById(`financial-${kind}-message`);
      const progress = bar.closest('[role="progressbar"]');
      const visualPercentage = Math.min(100, Math.max(0, percentage));

      output.textContent = formatFinancialPercentage(percentage);
      bar.style.width = `${visualPercentage}%`;
      progress.setAttribute("aria-valuenow", String(Number(percentage.toFixed(2))));
      container.classList.remove("is-success", "is-danger");

      if (subtotal <= 0) {
        message.textContent = "Aguardando despesas.";
        return;
      }

      container.classList.add(compliant ? "is-success" : "is-danger");
      message.textContent = compliant ? successMessage : dangerMessage;
    }

    function updateParticipantUnitCostCompliance(value, totalWorkload, totalParticipants, subtotal) {
      const container = document.getElementById("financial-participant-unit-cost-compliance");
      const message = document.getElementById("financial-participant-unit-cost-message");
      const hasSufficientData = totalWorkload > 0 && totalParticipants > 0 && subtotal > 0;
      container.classList.remove("is-success", "is-danger");

      if (!hasSufficientData) {
        message.textContent = "Aguardando dados para o cálculo.";
        return;
      }

      const withinLimit = value <= 25;
      container.classList.add(withinLimit ? "is-success" : "is-danger");
      message.textContent = withinLimit
        ? "Dentro do limite de R$ 25,00."
        : "Alerta: custo acima de R$ 25,00.";
    }

    function updateFinancialDashboard() {
      const informedTotal = currencyValue(document.getElementById("custo_total_projeto"));
      const subtotal = valorTotalGestaoFinalistica;
      const managementPercentage = subtotal > 0 ? (valorTotalGestao / subtotal) * 100 : 0;
      const finalisticPercentage = subtotal > 0 ? (valorTotalFinalistica / subtotal) * 100 : 0;
      const totalParticipants = totalCourseParticipantsFromForm();
      const totalWorkload = [...document.querySelectorAll(
        '.course-card [data-field="carga_horaria_total"]'
      )].reduce((total, input) => total + (Number(input.value) || 0), 0);
      const participantUnitCost = calculateParticipantUnitCost(
        totalWorkload,
        totalParticipants,
        subtotal
      );
      const rawRemaining = informedTotal - valorTotalProjetoCalculado;
      const remaining = Math.abs(rawRemaining) < 0.005 ? 0 : rawRemaining;

      document.getElementById("financial-informed").textContent = formatBRL(informedTotal);
      document.getElementById("financial-finalistic").textContent = formatBRL(valorTotalFinalistica);
      document.getElementById("financial-management").textContent = formatBRL(valorTotalGestao);
      document.getElementById("financial-subtotal").textContent = formatBRL(subtotal);
      document.getElementById("financial-participant-unit-cost").textContent =
        formatBRL(participantUnitCost);
      updateParticipantUnitCostCompliance(
        participantUnitCost,
        totalWorkload,
        totalParticipants,
        subtotal
      );
      document.getElementById("financial-structuring").textContent = formatBRL(valorTotalEstruturacao);
      document.getElementById("financial-kits").textContent = formatBRL(valorTotalKit);
      document.getElementById("financial-kits-row").hidden = !possuiDespesasKit;
      document.getElementById("financial-calculated").textContent = formatBRL(valorTotalProjetoCalculado);
      document.getElementById("financial-remaining").textContent = formatBRL(remaining);

      updateFinancialPercentage(
        "management",
        managementPercentage,
        subtotal,
        managementPercentage <= 40,
        "Dentro do limite de 40%.",
        "Alerta: Gestão acima de 40%."
      );
      updateFinancialPercentage(
        "finalistic",
        finalisticPercentage,
        subtotal,
        finalisticPercentage >= 60,
        "Atende ao mínimo de 60%.",
        "Alerta: Finalísticas abaixo de 60%."
      );

      const remainingContainer = document.getElementById("financial-remaining-compliance");
      const remainingMessage = document.getElementById("financial-remaining-message");
      remainingContainer.classList.remove("is-success", "is-danger", "is-info");

      if (remaining > 0) {
        remainingContainer.classList.add("is-success");
        remainingMessage.textContent = "Saldo disponível.";
      } else if (remaining < 0) {
        remainingContainer.classList.add("is-danger");
        remainingMessage.textContent = "Orçamento ultrapassado.";
      } else if (informedTotal > 0 || valorTotalProjetoCalculado > 0) {
        remainingContainer.classList.add("is-info");
        remainingMessage.textContent = "Projeto totalmente detalhado.";
      } else {
        remainingMessage.textContent = "Informe o orçamento do projeto.";
      }
    }

    function updateExpenseTotalsByType() {
      const totals = {
        Gestao: 0,
        Finalistica: 0,
        Estruturacao: 0,
        Kit: 0
      };
      const totalsByFundingSource = {
        SISEC: 0,
        Contrapartida: 0
      };
      let hasKitExpenses = false;

      document.querySelectorAll("[data-course-expenses] tbody tr").forEach(row => {
        const type = expenseTypeFromCatalog(row);
        const total = Number(row.querySelector('[data-field="valor_total"]')?.dataset.value || 0);
        if (type in totals) totals[type] += total;
        if (type === "Kit") hasKitExpenses = true;
        totalsByFundingSource.SISEC += total;
      });

      document.querySelectorAll("#stage11-table tbody tr, #stage12-table tbody tr, #assistance-table tbody tr, #event-table tbody tr").forEach(row => {
        const type = expenseTypeFromCatalog(row);
        const fundingSource = row.querySelector('[data-field="fonte_recurso"]')?.value;
        const total = Number(row.querySelector('[data-field="valor_total"]')?.dataset.value || 0);
        if (type in totals) totals[type] += total;
        if (type === "Kit") hasKitExpenses = true;
        if (fundingSource in totalsByFundingSource) totalsByFundingSource[fundingSource] += total;
      });

      valorTotalGestao = totals.Gestao;
      valorTotalFinalistica = totals.Finalistica;
      valorTotalEstruturacao = totals.Estruturacao;
      valorTotalKit = totals.Kit;
      valorTotalGestaoFinalistica = valorTotalGestao + valorTotalFinalistica;
      valorTotalProjetoCalculado = valorTotalGestao + valorTotalFinalistica + valorTotalEstruturacao + valorTotalKit;
      valorTotalSISEC = totalsByFundingSource.SISEC;
      valorTotalContrapartida = totalsByFundingSource.Contrapartida;
      possuiDespesasKit = hasKitExpenses;
      updateFinancialDashboard();
    }

    /* =========================================================
       RESUMO FINANCEIRO DAS DESPESAS DE CADA CURSO
       - Total de itens: quantidade de linhas de despesa.
       - Valor total: soma dos valores totais dessas linhas.
       - Valor Kit Participante por Aluno: sempre exibido.
       - Valores por aluno de EPI, Insumos Gerais e Kit Trabalho:
         exibidos somente quando existir ao menos uma linha do tipo.
       ========================================================= */
    function updateCourseSummary(container) {
      const card = container.closest(".course-card");
      if (!card) return;

      const rows = [...container.querySelectorAll("tbody tr")];
      const total = rows.reduce(
        (sum, row) => sum + Number(row.querySelector('[data-field="valor_total"]')?.dataset.value || 0),
        0
      );

      const totalsByType = rows.reduce((totals, row) => {
        const expenseType = row.querySelector('[data-field="tipo_item_despesa"]')?.value;
        if (!expenseType) return totals;

        const rowTotal = Number(
          row.querySelector('[data-field="valor_total"]')?.dataset.value || 0
        );
        totals[expenseType] = (totals[expenseType] || 0) + rowTotal;
        return totals;
      }, {});

      const participantInput = card.querySelector('[data-field="quantidade_participantes"]');
      const participantCount = Number(participantInput?.value || 0);
      const valuePerStudent = typeId => participantCount > 0
        ? (totalsByType[typeId] || 0) / participantCount
        : 0;

      const countOutput = card.querySelector("[data-course-count]");
      const totalOutput = card.querySelector("[data-course-total]");
      const kitPerStudentOutput = card.querySelector("[data-course-kit-per-student]");

      if (countOutput) countOutput.textContent = String(rows.length);
      if (totalOutput) totalOutput.textContent = formatBRL(total);
      if (kitPerStudentOutput) {
        kitPerStudentOutput.textContent = formatBRL(valuePerStudent("kit_participante"));
      }

      const conditionalCards = [
        {
          typeId: "epi",
          cardSelector: '[data-course-type-card="epi"]',
          outputSelector: "[data-course-epi-per-student]"
        },
        {
          typeId: "insumos_gerais",
          cardSelector: '[data-course-type-card="insumos_gerais"]',
          outputSelector: "[data-course-insumos-per-student]"
        },
        {
          typeId: "kit_trabalho",
          cardSelector: '[data-course-type-card="kit_trabalho"]',
          outputSelector: "[data-course-kit-trabalho-per-student]"
        }
      ];

      conditionalCards.forEach(({ typeId, cardSelector, outputSelector }) => {
        const typeCard = card.querySelector(cardSelector);
        const output = card.querySelector(outputSelector);
        const hasType = rows.some(
          row => row.querySelector('[data-field="tipo_item_despesa"]')?.value === typeId
        );

        if (typeCard) typeCard.hidden = !hasType;
        if (output) output.textContent = formatBRL(valuePerStudent(typeId));
      });

      updateExpenseTotalsByType();
    }

    function updateStageSummary(kind) {
      const container = document.getElementById(`${kind}-table`);
      const rows = [...container.querySelectorAll("tbody tr")];
      const total = rows.reduce((sum, row) => sum + Number(row.querySelector('[data-field="valor_total"]')?.dataset.value || 0), 0);
      document.getElementById(`${kind}-count`).textContent = String(rows.length);
      document.getElementById(`${kind}-total`).textContent = formatBRL(total);
      updateExpenseTotalsByType();
    }

