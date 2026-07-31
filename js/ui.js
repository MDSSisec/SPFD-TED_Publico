"use strict";

    /* ======================================================================
       4. NAVEGAÇÃO DO FORMULÁRIO
       ====================================================================== */
    function visibleSteps() {
      return [...document.querySelectorAll("[data-step-target]")]
        .filter(button => !button.hidden)
        .map(button => button.dataset.stepTarget);
    }

    function updateNavigation() {
      const visible = visibleSteps();
      document.querySelectorAll("[data-step-target]").forEach(button => {
        const target = button.dataset.stepTarget;
        button.hidden = !visible.includes(target);
        button.toggleAttribute("aria-current", target === state.currentStep);
        if (target === state.currentStep) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
        button.classList.toggle("is-complete", state.completedSteps.has(target));
      });
      visible.forEach((stepId, index) => {
        const stepIndex = document.querySelector(`[data-step-target="${stepId}"] .step-index`);
        if (stepIndex) stepIndex.textContent = String(index + 1);
      });

      const currentIndex = visible.indexOf(state.currentStep);
      document.querySelectorAll("[data-section] .eyebrow").forEach(eyebrow => {
        const section = eyebrow.closest("[data-section]");
        const index = visible.indexOf(section.id);
        if (index >= 0) eyebrow.textContent = `Etapa ${index + 1} de ${visible.length}`;
      });

      const stage12 = document.getElementById("despesas_etapa_1_2");
      const nextButton = stage12.querySelector("[data-next]");
      const finishButton = stage12.querySelector("[data-finish]");
      const stage12IsLast = visible.at(-1) === "despesas_etapa_1_2";
      nextButton.hidden = stage12IsLast;
      finishButton.hidden = !stage12IsLast;

      const assistanceSection = document.getElementById("assistencia_tecnica_gerencial");
      const assistanceNextButton = assistanceSection.querySelector("[data-next]");
      const assistanceFinishButton = assistanceSection.querySelector("[data-finish]");
      const assistanceIsLast = visible.at(-1) === "assistencia_tecnica_gerencial";
      assistanceNextButton.hidden = assistanceIsLast;
      assistanceFinishButton.hidden = !assistanceIsLast;

      return currentIndex;
    }

    function showStep(stepId, options = {}) {
      const target = document.getElementById(stepId);
      const navButton = document.querySelector(`[data-step-target="${stepId}"]`);
      if (!target || !navButton || navButton.hidden) return;
      document.querySelectorAll("[data-section]").forEach(section => {
        section.hidden = section.id !== stepId;
      });
      state.currentStep = stepId;
      updateNavigation();
      setStatus();
      if (options.scroll !== false) window.scrollTo({ top: 0, behavior: "smooth" });
    }


    function handleAssistanceSection() {
      const section = document.getElementById("assistencia_tecnica_gerencial");
      const navButton = document.querySelector('[data-step-target="assistencia_tecnica_gerencial"]');
      if (assistanceCheckbox.checked) {
        navButton.hidden = false;
        if (!assistanceThemeInput.value.trim()) assistanceThemeInput.value = assistanceThemeTemplate;
        updateAssistanceParticipantSummary();
      } else {
        document.getElementById("assistance-table").innerHTML = emptyState("Nenhuma despesa adicionada nesta etapa.");
        document.querySelectorAll('[data-stage-period="assistance"] input').forEach(input => {
          input.value = "";
          clearError(input);
        });
        assistanceThemeInput.value = assistanceThemeTemplate;
        clearError(assistanceThemeInput);
        updateStageSummary("assistance");
        navButton.hidden = true;
        state.completedSteps.delete("assistencia_tecnica_gerencial");
        if (state.currentStep === "assistencia_tecnica_gerencial") showStep("despesas_etapa_1_2");
      }
      section.hidden = state.currentStep !== "assistencia_tecnica_gerencial";
      updateNavigation();
    }

    function handleEventSection() {
      const section = document.getElementById("despesas_evento_final");
      const navButton = document.querySelector('[data-step-target="despesas_evento_final"]');
      if (eventCheckbox.checked) {
        navButton.hidden = false;
      } else {
        document.getElementById("event-table").innerHTML = emptyState("Nenhuma despesa adicionada nesta etapa.");
        document.querySelectorAll('[data-stage-period="event"] input').forEach(input => {
          input.value = "";
          clearError(input);
        });
        updateStageSummary("event");
        navButton.hidden = true;
        state.completedSteps.delete("despesas_evento_final");
        if (state.currentStep === "despesas_evento_final") {
          showStep(assistanceCheckbox.checked ? "assistencia_tecnica_gerencial" : "despesas_etapa_1_2");
        }
      }
      // Mantém visível somente a seção que corresponde à etapa atual.
      section.hidden = state.currentStep !== "despesas_evento_final";
      updateNavigation();
    }


    /* ======================================================================
       9. CONTROLADORES DE EVENTOS
       ====================================================================== */
    function handleFormInput(event) {
      const control = event.target;
      if (control.matches("[data-combobox-input]")) {
        const wrapper = control.closest(".searchable-combobox");
        const source = wrapper.querySelector("select");
        const previousValue = source.value;
        const match = [...source.options].find(option =>
          option.value && option.textContent.localeCompare(control.value, "pt-BR", { sensitivity: "base" }) === 0
        );
        const nextValue = match?.value || "";
        source.value = nextValue;
        if (previousValue !== nextValue) source.dispatchEvent(new Event("change", { bubbles: true }));
        openCombobox(wrapper, control.value);
      }
      if (control.classList.contains("currency-input")) setCurrencyFromDigits(control);
      if (control.id === "custo_total_projeto") updateFinancialDashboard();
      if (control.classList.contains("month-year-input")) maskMonthYear(control);
      if (control.classList.contains("expense-code-input")) maskExpenseCode(control);
      if (control.matches("input, select, textarea")) validateControl(control);

      if (["quantidade_participantes", "margem_reserva"].includes(control.dataset.field)) {
        const courseCard = control.closest(".course-card");
        const courseContainer = courseCard?.querySelector("[data-course-expenses]");
        if (courseCard) updateReserveImpact(courseCard);
        if (courseCard) syncCourseExpenseQuantities(courseCard);
        if (control.dataset.field === "quantidade_participantes") {
          if (courseCard) updateClassDistribution(courseCard);
          if (courseContainer) updateCourseSummary(courseContainer);
          updateAssistanceParticipantSummary();
        }
      }

      if (["carga_horaria_total", "carga_horaria_diaria"].includes(control.dataset.field)) {
        const courseCard = control.closest(".course-card");
        if (courseCard) updateCourseDuration(courseCard);
        if (courseCard) syncCourseExpenseQuantities(courseCard);
        updateFinancialDashboard();
      }

      const row = control.closest("tr");
      if (row && ["quantidade_itens", "valor_unitario"].includes(control.dataset.field)) recalculateRow(row);
    }

    function handleFormChange(event) {
      const control = event.target;
      if (control === quantityCourses) syncCourses();
      if (control === assistanceCheckbox) handleAssistanceSection();
      if (control === eventCheckbox) handleEventSection();
      const row = control.closest("tr");
      if (!row) return;
      if (control.dataset.field === "tipo_item_despesa") {
        clearRemovalJustificationForSelection(row);
        updateCourseDependencies(row);
        const courseContainer = row.closest("[data-course-expenses]");
        if (courseContainer) updateCourseSummary(courseContainer);
      }
      if (control.dataset.field === "item_despesa" && row.querySelector('[data-field="tipo_item_despesa"]')) {
        clearRemovalJustificationForSelection(row);
        updateCourseItemDependencies(row);
      }
      if (control.dataset.field === "item_despesa" && row.dataset.stageKind) updateStageDependencies(row);
      if (control.dataset.field === "fonte_recurso") updateExpenseTotalsByType();
    }

    function handleFormKeydown(event) {
      const input = event.target.closest("[data-combobox-input]");
      if (!input) return;
      const wrapper = input.closest(".searchable-combobox");
      const list = wrapper.querySelector("[role='listbox']");

      if (event.key === "Escape" || event.key === "Tab") {
        closeCombobox(wrapper);
        return;
      }

      if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
      event.preventDefault();
      if (list.hidden) openCombobox(wrapper);
      const options = [...list.querySelectorAll("[data-combobox-option]")];
      if (!options.length) return;
      const activeIndex = options.findIndex(option => option.classList.contains("is-active"));

      if (event.key === "Enter") {
        const selected = options[Math.max(0, activeIndex)];
        chooseComboboxOption(wrapper, selected.dataset.comboboxOption);
        return;
      }

      const nextIndex = event.key === "ArrowDown"
        ? (activeIndex + 1) % options.length
        : (activeIndex <= 0 ? options.length - 1 : activeIndex - 1);
      options.forEach(option => option.classList.remove("is-active"));
      options[nextIndex].classList.add("is-active");
      options[nextIndex].scrollIntoView({ block: "nearest" });
    }

    function handleFormClick(event) {
      const restoreObjectiveButton = event.target.closest("[data-restore-objective]");
      if (restoreObjectiveButton) {
        const objectiveNumber = restoreObjectiveButton.dataset.restoreObjective;
        const objectiveCard = document.querySelector(
          `[data-specific-objective][data-objective-number="${objectiveNumber}"]`
        );
        const objectiveInput = objectiveCard?.querySelector("textarea");
        if (objectiveCard && objectiveInput) {
          objectiveCard.hidden = false;
          objectiveInput.disabled = false;
          restoreObjectiveButton.hidden = true;
          state.json = null;
          objectiveInput.focus();
        }
        return;
      }

      const removeObjectiveButton = event.target.closest("[data-remove-objective]");
      if (removeObjectiveButton) {
        const objectiveCard = removeObjectiveButton.closest("[data-specific-objective]");
        const objectiveInput = objectiveCard?.querySelector("textarea");
        const restoreButton = document.querySelector(
          `[data-restore-objective="${objectiveCard?.dataset.objectiveNumber}"]`
        );
        if (objectiveCard && objectiveInput && restoreButton) {
          objectiveCard.hidden = true;
          objectiveInput.disabled = true;
          clearError(objectiveInput);
          restoreButton.hidden = false;
        }
        state.json = null;
        return;
      }

      const catalogItemButton = event.target.closest("[data-add-catalog-item]");
      if (catalogItemButton) {
        openCatalogItemDialog(catalogItemButton.closest("tr"));
        return;
      }

      const comboboxOption = event.target.closest("[data-combobox-option]");
      if (comboboxOption) {
        chooseComboboxOption(comboboxOption.closest(".searchable-combobox"), comboboxOption.dataset.comboboxOption);
        return;
      }

      const comboboxInput = event.target.closest("[data-combobox-input]");
      if (comboboxInput) {
        const wrapper = comboboxInput.closest(".searchable-combobox");
        openCombobox(wrapper, wrapper.querySelector("select").value ? "" : comboboxInput.value);
      }
      else document.querySelectorAll(".searchable-combobox-list:not([hidden])").forEach(list => closeCombobox(list.closest(".searchable-combobox")));

      const addCourse = event.target.closest("[data-add-course-expense]");
      if (addCourse) return addCourseExpense(Number(addCourse.dataset.addCourseExpense));

      const addStage = event.target.closest("[data-add-stage-row]");
      if (addStage) return addStageRow(addStage.dataset.addStageRow);

      const remove = event.target.closest("[data-remove-row]");
      if (remove) {
        const row = remove.closest("tr");
        const card = row.closest(".course-card");
        const categoryId = row.querySelector('[data-field="tipo_item_despesa"]')?.value;
        const itemId = row.querySelector('[data-field="item_despesa"]')?.value;
        if (card && categoryId === "kit_participante" && itemId !== "apostila") {
          if (itemId) removedParticipantKitItems(card).add(itemId);
          removeExpenseRow(row);
          setStatus("Item do Kit participante removido.", "success");
          return;
        }
        const requiredRemovalRule = requiredRemovalRuleForRow(row);
        if (requiredRemovalRule) {
          openRequiredRemovalDialog(row, requiredRemovalRule);
          return;
        }
        removeExpenseRow(row);
        return;
      }

      if (event.target.closest("[data-next]")) {
        if (!validateStep(state.currentStep)) {
          setStatus("Revise os campos destacados para avançar.", "error");
          return;
        }
        state.completedSteps.add(state.currentStep);
        const steps = visibleSteps();
        const next = steps[steps.indexOf(state.currentStep) + 1];
        if (next) showStep(next);
        return;
      }

      if (event.target.closest("[data-prev]")) {
        const steps = visibleSteps();
        const previous = steps[steps.indexOf(state.currentStep) - 1];
        if (previous) showStep(previous);
        return;
      }

      if (event.target.closest("[data-finish]")) finishForm();
    }

    function handleStepNavigation(event) {
      const button = event.currentTarget;
      const target = button.dataset.stepTarget;
      const steps = visibleSteps();
      const currentIndex = steps.indexOf(state.currentStep);
      const targetIndex = steps.indexOf(target);

      if (targetIndex > currentIndex && !validateStep(state.currentStep)) {
        setStatus("Revise os campos destacados antes de mudar de etapa.", "error");
        return;
      }

      if (targetIndex > currentIndex) state.completedSteps.add(state.currentStep);
      showStep(target);
    }

    function bindEvents() {
      form.addEventListener("input", handleFormInput);
      form.addEventListener("change", handleFormChange);
      form.addEventListener("keydown", handleFormKeydown);
      form.addEventListener("click", handleFormClick);
      document.querySelectorAll("[data-step-target]").forEach(button => {
        button.addEventListener("click", handleStepNavigation);
      });
      document.getElementById("generate-mock").addEventListener("click", generateMock);
      document.getElementById("close-dialog").addEventListener("click", () => jsonDialog.close());
      document.getElementById("download-json").addEventListener("click", downloadJson);
      document.getElementById("download-xlsx").addEventListener("click", downloadSpreadsheet);
      catalogItemForm.addEventListener("submit", addCatalogItem);
      document.getElementById("cancel-catalog-item").addEventListener("click", closeCatalogItemDialog);
      catalogItemDialog.addEventListener("close", () => { state.catalogTargetRow = null; });
      requiredRemovalForm.addEventListener("submit", confirmRequiredRemoval);
      document.getElementById("cancel-required-removal").addEventListener("click", closeRequiredRemovalDialog);
      requiredRemovalDialog.addEventListener("close", () => { state.requiredRemovalTarget = null; });
    }

    /* ======================================================================
       10. INICIALIZAÇÃO
       ====================================================================== */
    async function initializeApp() {
      try {
        await loadCatalogs();
        bindEvents();
        syncCourses();
        ["stage11", "stage12", "assistance", "event"].forEach(renderStageTable);
        handleAssistanceSection();
        handleEventSection();
        showStep("dados_gerais_projeto", { scroll: false });
      } catch (error) {
        console.error(error);
        setStatus(`Não foi possível iniciar o formulário: ${error.message}`, "error");
      }
    }

    initializeApp();
