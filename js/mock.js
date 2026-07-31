"use strict";

    function setMockInputValue(control, value, options = {}) {
      if (!control) throw new Error("Campo do mock não encontrado.");
      control.value = String(value);
      control.dispatchEvent(new Event("input", { bubbles: true }));
      if (options.change) control.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function getMockField(id) {
      const control = document.getElementById(id);
      if (!control) throw new Error(`Campo "${id}" do mock não encontrado.`);
      return control;
    }

    function setMockCurrency(control, value) {
      setMockInputValue(control, Math.round(Number(value) * 100));
    }

    function setMockCheckbox(control, checked) {
      control.checked = Boolean(checked);
      control.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function findMockCatalogItem(items, preferredLabels = [], fallbackIndex = 0) {
      const preferredIds = preferredLabels.map(catalogId);
      const preferred = items.find(item => preferredIds.includes(item.id));
      if (preferred) return preferred;
      if (!items.length) throw new Error("Não há itens disponíveis na categoria necessária ao mock.");
      return items[fallbackIndex % items.length];
    }

    function resetFormForMock() {
      form.reset();
      state.json = null;
      state.rowCounter = 0;
      state.completedSteps.clear();
      state.currentStep = "dados_gerais_projeto";

      form.querySelectorAll(".currency-input").forEach(input => {
        delete input.dataset.value;
      });
      form.querySelectorAll(".is-invalid").forEach(control => clearError(control));

      document.getElementById("courses-container").replaceChildren();
      ["stage11", "stage12", "assistance", "event"].forEach(kind => {
        document.getElementById(`${kind}-table`).replaceChildren();
        renderStageTable(kind);
      });

      document.querySelectorAll('[data-objective-number="3"], [data-objective-number="4"]').forEach(card => {
        card.hidden = false;
        const input = card.querySelector("textarea");
        if (input) input.disabled = false;
      });
      document.querySelectorAll("[data-restore-objective]").forEach(button => {
        button.hidden = true;
      });
    }

    function fillMockCourseGeneralData(card, course) {
      const field = name => card.querySelector(`[data-field="${name}"]`);
      setMockInputValue(field("nome_curso"), course.name);
      setMockInputValue(field("inicio_curso"), course.start);
      setMockInputValue(field("fim_curso"), course.end);
      setMockInputValue(field("carga_horaria_total"), course.totalWorkload);
      setMockInputValue(field("quantidade_participantes"), course.participants);
      setMockInputValue(field("margem_reserva"), course.reserveMargin);
      setMockInputValue(field("carga_horaria_diaria"), course.dailyWorkload);
      setMockInputValue(field("quantidade_encontros_semanais"), course.weeklyMeetings);
    }

    function addMockCourseExpense(courseIndex, expense, fallbackIndex = 0) {
      const container = document.querySelector(`[data-course-expenses="${courseIndex}"]`);
      const category = catalogs.tiposItemCurso.find(item => item.id === expense.typeId);
      if (!category) throw new Error(`Categoria ${expense.typeId} não encontrada para o mock.`);
      const item = findMockCatalogItem(category.itens, expense.items, fallbackIndex);
      let row = [...container.querySelectorAll("tbody tr")].find(candidate =>
        candidate.querySelector('[data-field="tipo_item_despesa"]')?.value === category.id &&
        candidate.querySelector('[data-field="item_despesa"]')?.value === item.id
      );
      if (!row) {
        row = [...container.querySelectorAll("tbody tr")].find(candidate =>
          candidate.querySelector('[data-field="tipo_item_despesa"]')?.value === category.id &&
          !candidate.querySelector('[data-field="item_despesa"]')?.value
        );
      }

      if (!row) {
        addCourseExpense(courseIndex);
        row = [...container.querySelectorAll("tbody tr")].at(-1);
        const typeSelect = row.querySelector('[data-field="tipo_item_despesa"]');
        typeSelect.value = category.id;
        typeSelect.dispatchEvent(new Event("change", { bubbles: true }));

        const itemSelect = row.querySelector('[data-field="item_despesa"]');
        chooseComboboxOption(itemSelect.closest(".searchable-combobox"), item.id);
      } else if (!row.querySelector('[data-field="item_despesa"]').value) {
        const itemSelect = row.querySelector('[data-field="item_despesa"]');
        chooseComboboxOption(itemSelect.closest(".searchable-combobox"), item.id);
      }

      const detailInput = row.querySelector('[data-field="detalhamento_item"]');
      if (!detailInput.readOnly) setMockInputValue(detailInput, expense.detail);
      setMockInputValue(row.querySelector('[data-field="codigo_elemento_despesa"]'), expense.code);

      const quantityInput = row.querySelector('[data-field="quantidade_itens"]');
      if (!quantityInput.readOnly) setMockInputValue(quantityInput, expense.quantity);
      setMockCurrency(row.querySelector('[data-field="valor_unitario"]'), expense.unitPrice);
    }

    function setMockStagePeriod(kind, start, end) {
      const period = document.querySelector(`[data-stage-period="${kind}"]`);
      setMockInputValue(period.querySelector('[data-field="inicio_etapa"]'), start);
      setMockInputValue(period.querySelector('[data-field="fim_etapa"]'), end);
    }

    function addMockStageExpense(kind, expense, fallbackIndex = 0) {
      addStageRow(kind);
      const row = [...document.querySelectorAll(`#${kind}-table tbody tr`)].at(-1);
      const item = findMockCatalogItem(catalogs[kind], expense.items, fallbackIndex);
      const itemSelect = row.querySelector('[data-field="item_despesa"]');
      chooseComboboxOption(itemSelect.closest(".searchable-combobox"), item.id);

      setMockInputValue(row.querySelector('[data-field="detalhamento_item"]'), expense.detail);
      setMockInputValue(row.querySelector('[data-field="codigo_elemento_despesa"]'), expense.code);
      setMockInputValue(row.querySelector('[data-field="quantidade_itens"]'), expense.quantity);
      setMockCurrency(row.querySelector('[data-field="valor_unitario"]'), expense.unitPrice);

      const source = row.querySelector('[data-field="fonte_recurso"]');
      source.value = expense.source;
      source.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function generateMock() {
      const confirmed = window.confirm(
        "Gerar o mock substituirá todo o preenchimento atual do formulário. Deseja continuar?"
      );
      if (!confirmed) return;

      try {
        resetFormForMock();

        setMockCurrency(getMockField("custo_total_projeto"), 450000);
        setMockInputValue(
          getMockField("objetivo_geral_projeto"),
          "Promover qualificação profissional e inclusão produtiva de pessoas inscritas no CadÚnico na Região Demonstrativa, ampliando oportunidades de emprego e empreendedorismo."
        );
        setMockInputValue(
          getMockField("objetivo_especifico_1"),
          "Desenvolver competências técnicas e empreendedoras para ampliar as oportunidades de inserção socioeconômica dos participantes."
        );
        setMockInputValue(
          getMockField("objetivo_especifico_2"),
          "Ampliar a oferta de capacitação profissional para mulheres inscritas no CadÚnico."
        );
        setMockInputValue(
          getMockField("objetivo_especifico_3"),
          "Entregar kits de trabalho adequados às formações ofertadas, fortalecendo a autonomia financeira dos participantes."
        );
        setMockInputValue(
          getMockField("objetivo_especifico_4"),
          "Estruturar espaços demonstrativos com os equipamentos necessários às ações de qualificação profissional."
        );

        setMockInputValue(quantityCourses, 3, { change: true });
        setMockCheckbox(assistanceCheckbox, true);
        setMockCheckbox(eventCheckbox, true);

        if (!Array.isArray(window.MOCK_COURSES)) {
          throw new Error("Os dados dos cursos do mock não foram carregados.");
        }
        const courses = window.MOCK_COURSES;

        courses.forEach((course, courseIndex) => {
          const card = document.querySelector(`.course-card[data-course-index="${courseIndex}"]`);
          fillMockCourseGeneralData(card, course);
          course.expenses.forEach((expense, expenseIndex) => {
            addMockCourseExpense(courseIndex, expense, expenseIndex);
          });
        });

        setMockStagePeriod("stage11", "02/2026", "08/2026");
        addMockStageExpense("stage11", {
          items: ["Coordenador", "Serviço"],
          detail: "Coordenação e acompanhamento das ações do projeto",
          code: "33.90.39",
          quantity: 7,
          unitPrice: 4800,
          source: "SISEC"
        });
        addMockStageExpense("stage11", {
          items: ["Camiseta", "Material gráfico"],
          detail: "Material de identificação e divulgação do projeto",
          code: "33.90.30",
          quantity: 180,
          unitPrice: 32,
          source: "Contrapartida"
        }, 1);

        setMockStagePeriod("stage12", "02/2026", "04/2026");
        addMockStageExpense("stage12", {
          items: ["Notebook"],
          detail: "Notebook para apoio às atividades formativas",
          code: "44.90.52",
          quantity: 3,
          unitPrice: 4200,
          source: "SISEC"
        });
        addMockStageExpense("stage12", {
          items: ["Projetor"],
          detail: "Projetor multimídia com resolução Full HD",
          code: "44.90.52",
          quantity: 2,
          unitPrice: 3500,
          source: "SISEC"
        }, 1);

        setMockInputValue(
          assistanceThemeInput,
          "Assistência Técnica: melhoria dos processos produtivos e adequação das atividades profissionais;\n\nAssistência Gerencial: gestão financeira, comercialização, marketing e elaboração de planos de negócios."
        );
        setMockStagePeriod("assistance", "06/2026", "09/2026");
        addMockStageExpense("assistance", {
          items: ["Mentor"],
          detail: "Mentoria técnica e gerencial individual e coletiva",
          code: "33.90.39",
          quantity: 120,
          unitPrice: 150,
          source: "SISEC"
        });

        setMockStagePeriod("event", "09/2026", "09/2026");
        addMockStageExpense("event", {
          items: ["Coffee break para evento", "Coffee break para participantes e convidados"],
          detail: "Coffee break individual para participantes e convidados",
          code: "33.90.39",
          quantity: 220,
          unitPrice: 28,
          source: "SISEC"
        });
        addMockStageExpense("event", {
          items: ["Serviço", "Evento"],
          detail: "Serviço de organização, recepção e apoio ao evento final",
          code: "33.90.39",
          quantity: 1,
          unitPrice: 8500,
          source: "Contrapartida"
        }, 1);

        document.querySelectorAll(".course-card").forEach(card => {
          updateCourseDuration(card);
          updateReserveImpact(card);
          updateClassDistribution(card);
          syncCourseExpenseQuantities(card);
          updateCourseSummary(card.querySelector("[data-course-expenses]"));
        });
        ["stage11", "stage12", "assistance", "event"].forEach(updateStageSummary);
        updateAssistanceParticipantSummary();
        updateExpenseTotalsByType();

        const invalidSteps = visibleSteps().filter(stepId => !validateStep(stepId, false));
        showStep(invalidSteps[0] || "dados_gerais_projeto", { scroll: false });
        if (invalidSteps.length) {
          setStatus("O mock foi preenchido, mas há campos que precisam ser revisados.", "error");
          document.getElementById(invalidSteps[0]).querySelector(".is-invalid")?.focus();
          return;
        }

        setStatus("Mock gerado com sucesso. Todos os campos permanecem editáveis.", "success");
      } catch (error) {
        console.error(error);
        showStep("dados_gerais_projeto", { scroll: false });
        setStatus(`Não foi possível gerar o mock: ${error.message}`, "error");
      }
    }

