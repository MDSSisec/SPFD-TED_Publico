"use strict";

    /* ======================================================================
       7. VALIDAÇÃO
       ====================================================================== */
    function clearError(control) {
      control.classList.remove("is-invalid");
      const message = document.querySelector(`[data-error-for="${CSS.escape(control.id)}"]`);
      if (message) message.textContent = "";
    }

    function setError(control, message) {
      control.classList.add("is-invalid");
      const target = document.querySelector(`[data-error-for="${CSS.escape(control.id)}"]`);
      if (target) target.textContent = message;
    }

    function validateControl(control, options = {}) {
      clearError(control);
      if (control.disabled || (!options.ignoreVisibility && control.closest("[hidden]"))) return true;

      const value = control.type === "checkbox" ? control.checked : control.value.trim();
      if (control.dataset.required === "true" && (value === "" || value === false)) {
        setError(control, "Campo obrigatório.");
        return false;
      }
      if (value === "") return true;

      if (control.maxLength > -1 && String(value).length > control.maxLength) {
        setError(control, `Use no máximo ${control.maxLength} caracteres.`);
        return false;
      }

      if (control.matches("[data-combobox-input]") && !control.closest(".searchable-combobox").querySelector("select").value) {
        setError(control, "Selecione uma opção da lista.");
        return false;
      }

      if (control.classList.contains("currency-input")) {
        if (currencyValue(control) < 0) {
          setError(control, "Informe um valor igual ou superior a zero.");
          return false;
        }
      }

      if (control.type === "number") {
        const number = Number(control.value);
        if (!Number.isInteger(number)) {
          setError(control, control.dataset.rangeError || "Informe somente números inteiros.");
          return false;
        }
        if (control.min !== "" && number < Number(control.min)) {
          setError(control, control.dataset.rangeError || `O valor mínimo é ${control.min}.`);
          return false;
        }
        if (control.max !== "" && number > Number(control.max)) {
          setError(control, control.dataset.rangeError || `O valor máximo é ${control.max}.`);
          return false;
        }
        const multipleOf = Number(control.dataset.multipleOf);
        if (multipleOf > 0 && number % multipleOf !== 0) {
          setError(control, control.dataset.rangeError || `Informe um múltiplo de ${multipleOf}.`);
          return false;
        }
      }

      if (control.classList.contains("month-year-input")) {
        if (monthYearToComparable(control.value) == null) {
          setError(control, "Use o formato MM/AAAA.");
          return false;
        }
      }

      if (control.classList.contains("expense-code-input") && !/^\d{2}\.\d{2}\.\d{2}$/.test(control.value)) {
        setError(control, "Use o formato XX.XX.XX.");
        return false;
      }

      return true;
    }

    function validatePeriods(section) {
      let valid = true;
      section.querySelectorAll(".course-card").forEach(card => {
        const start = card.querySelector('[data-field="inicio_curso"]');
        const end = card.querySelector('[data-field="fim_curso"]');
        if (!start || !end || !start.value || !end.value) return;
        const startValue = monthYearToComparable(start.value);
        const endValue = monthYearToComparable(end.value);
        if (startValue != null && endValue != null && endValue < startValue) {
          setError(end, "O fim do curso não pode ser anterior ao início do curso.");
          valid = false;
        }
      });
      section.querySelectorAll("[data-stage-period]").forEach(period => {
        const start = period.querySelector('[data-field="inicio_etapa"]');
        const end = period.querySelector('[data-field="fim_etapa"]');
        if (!start || !end || !start.value || !end.value) return;
        const startValue = monthYearToComparable(start.value);
        const endValue = monthYearToComparable(end.value);
        if (startValue != null && endValue != null && endValue < startValue) {
          setError(end, "O fim não pode ser anterior ao início.");
          valid = false;
        }
      });
      return valid;
    }

    function validateStep(stepId, focusFirst = true) {
      const section = document.getElementById(stepId);
      const navButton = document.querySelector(`[data-step-target="${stepId}"]`);
      if (!section || !navButton || navButton.hidden) return true;
      section.querySelectorAll(".course-card").forEach(syncCourseExpenseQuantities);
      const controls = [...section.querySelectorAll("input, select, textarea")].filter(control => control.type !== "button");
      let valid = true;
      controls.forEach(control => { if (!validateControl(control, { ignoreVisibility: true })) valid = false; });
      section.querySelectorAll(".course-card").forEach(updateClassDistribution);
      if (!validatePeriods(section)) valid = false;
      if (!valid && focusFirst) section.querySelector(".is-invalid")?.focus();
      return valid;
    }

    function validateAll() {
      const invalidStep = visibleSteps().find(stepId => !validateStep(stepId, false));
      if (invalidStep) {
        showStep(invalidStep);
        document.getElementById(invalidStep).querySelector(".is-invalid")?.focus();
        setStatus("Revise os campos destacados antes de finalizar.", "error");
        return false;
      }
      return true;
    }

