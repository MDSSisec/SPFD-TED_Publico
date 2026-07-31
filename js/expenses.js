"use strict";

    /* =========================================================
       CORREÇÃO: CABEÇALHO DUPLICADO NAS TABELAS DE DESPESAS
       Obtém somente as linhas de dados do <tbody>, ignorando o
       <tr> existente no <thead> da tabela já renderizada.
       ========================================================= */
    function getExpenseDataRows(container) {
      const tbody = container.querySelector(".table-wrap table tbody");
      if (tbody) return [...tbody.children].filter(child => child.tagName === "TR");
      return [...container.children].filter(child => child.tagName === "TR");
    }

    function renderCourseExpenseTable(container) {
      const rows = getExpenseDataRows(container);
      if (!rows.length) {
        container.innerHTML = emptyState("Nenhuma despesa adicionada a este curso.");
        updateCourseSummary(container);
        return;
      }
      const table = document.createElement("div");
      table.className = "table-wrap";
      table.innerHTML = `<table>
        <thead><tr>
          <th>Tipo do item *</th><th>Item *</th><th>Detalhamento do item *</th><th>Elemento *</th><th>Unidade *</th>
          <th>Qtd. *</th><th>Valor unitário *</th><th>Valor total</th><th>Ações</th>
        </tr></thead><tbody></tbody></table>`;
      rows.forEach(row => table.querySelector("tbody").appendChild(row));
      container.replaceChildren(table);
      updateCourseSummary(container);
    }

    function renderStageTable(kind) {
      const container = document.getElementById(`${kind}-table`);
      const rows = getExpenseDataRows(container);
      if (!rows.length) {
        container.innerHTML = emptyState("Nenhuma despesa adicionada nesta etapa.");
      } else {
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrap";
        wrapper.innerHTML = `<table>
          <thead><tr>
            <th>Item *</th><th>Detalhamento do item *</th><th>Elemento *</th><th>Unidade *</th><th>Qtd. *</th>
            <th>Valor unitário *</th><th>Valor total</th><th>Fonte *</th>
            <th>Ações</th>
          </tr></thead><tbody></tbody></table>`;
        rows.forEach(row => wrapper.querySelector("tbody").appendChild(row));
        container.replaceChildren(wrapper);
      }
      updateStageSummary(kind);
    }

    function addCourseExpense(courseIndex) {
      const container = document.querySelector(`[data-course-expenses="${courseIndex}"]`);
      const existingRows = getExpenseDataRows(container);
      existingRows.push(courseExpenseRow(courseIndex));
      container.replaceChildren(...existingRows);
      renderCourseExpenseTable(container);
    }

    function ensureInitialTransportExpense(card) {
      if (!requiredCatalogItems("transporte").length) return;
      if (hasRequiredRemovalJustification(card, "transporte")) return;
      const container = card.querySelector("[data-course-expenses]");
      const existingTransportRow = [...container.querySelectorAll("tbody tr")].find(row =>
        row.querySelector('[data-field="tipo_item_despesa"]')?.value === "transporte"
      );
      if (existingTransportRow) return;

      addCourseExpense(Number(card.dataset.courseIndex));
      const row = [...container.querySelectorAll("tbody tr")].at(-1);
      const typeSelect = row.querySelector('[data-field="tipo_item_despesa"]');
      typeSelect.value = "transporte";
      typeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function addStageRow(kind) {
      const container = document.getElementById(`${kind}-table`);
      const rows = getExpenseDataRows(container);
      rows.push(stageExpenseRow(kind));
      container.replaceChildren(...rows);
      renderStageTable(kind);
    }

    function updateCourseDependencies(row) {
      const typeSelect = row.querySelector('[data-field="tipo_item_despesa"]');
      const itemSelect = row.querySelector('[data-field="item_despesa"]');
      const unitSelect = row.querySelector('[data-field="unidade"]');
      const addCatalogItemButton = row.querySelector("[data-add-catalog-item]");
      const type = catalogs.tiposItemCurso.find(item => item.id === typeSelect.value);
      if (addCatalogItemButton) addCatalogItemButton.hidden = !customCourseCategoryConfig[typeSelect.value];
      itemSelect.disabled = !type;
      const itemInput = itemSelect.closest(".searchable-combobox").querySelector("[data-combobox-input]");
      itemInput.disabled = !type;
      setComboboxOptions(
        itemSelect,
        availableCourseItems(type, row),
        type ? "Selecione ou pesquise" : "Selecione o tipo primeiro"
      );
      unitSelect.disabled = true;
      unitSelect.innerHTML = optionList([], "Selecione o item primeiro");
      syncCourseExpenseQuantities(row.closest(".course-card"));
    }

    function updateCourseItemDependencies(row) {
      const type = catalogs.tiposItemCurso.find(item => item.id === row.querySelector('[data-field="tipo_item_despesa"]').value);
      const selected = type?.itens.find(item => item.id === row.querySelector('[data-field="item_despesa"]').value);
      const unitSelect = row.querySelector('[data-field="unidade"]');
      unitSelect.disabled = true;
      unitSelect.innerHTML = selected ? optionList(selected.unidades, "Selecione") : optionList([], "Selecione o item primeiro");
      if (selected) {
        unitSelect.value = selected.unidades[0] || "";
      }
      syncCourseExpenseQuantities(row.closest(".course-card"));
      updateExpenseTotalsByType();
    }

    function updateStageDependencies(row) {
      const kind = row.dataset.stageKind;
      const item = catalogs[kind].find(entry => entry.id === row.querySelector('[data-field="item_despesa"]').value);
      const unitSelect = row.querySelector('[data-field="unidade"]');
      const typeInput = row.querySelector('[data-field="tipo_despesa"]');
      unitSelect.disabled = true;
      unitSelect.innerHTML = item ? optionList(item.unidades) : optionList([], "Selecione o item primeiro");
      typeInput.value = item?.tipo || "";
      if (item) {
        unitSelect.value = item.unidades[0] || "";
      }
      updateExpenseTotalsByType();
    }

    function clearCatalogItemErrors() {
      catalogItemForm.querySelectorAll(".is-invalid").forEach(control => control.classList.remove("is-invalid"));
      catalogItemForm.querySelectorAll("[data-catalog-error]").forEach(error => { error.textContent = ""; });
    }

    function setCatalogItemError(field, message) {
      const control = document.getElementById(`catalog-item-${field}`);
      control?.classList.add("is-invalid");
      const error = catalogItemForm.querySelector(`[data-catalog-error="${field}"]`);
      if (error) error.textContent = message;
    }

    function catalogUnitOptions() {
      const units = [...new Set(catalogRows.flatMap(row => splitCatalogValues(row.unidade)))]
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
      return optionList(units);
    }

    function openCatalogItemDialog(row) {
      const categoryId = row.querySelector('[data-field="tipo_item_despesa"]')?.value;
      const config = customCourseCategoryConfig[categoryId];
      if (!config) return;
      state.catalogTargetRow = row;
      catalogItemForm.reset();
      clearCatalogItemErrors();
      document.getElementById("catalog-item-category").value = config.label;
      document.getElementById("catalog-item-unit").innerHTML = catalogUnitOptions();
      catalogItemDialog.showModal();
      document.getElementById("catalog-item-name").focus();
    }

    function closeCatalogItemDialog() {
      catalogItemDialog.close();
      state.catalogTargetRow = null;
    }

    function requiredRemovalRuleForRow(row) {
      const card = row.closest(".course-card");
      if (!card) return null;
      const categoryId = row.querySelector('[data-field="tipo_item_despesa"]')?.value;
      const itemId = row.querySelector('[data-field="item_despesa"]')?.value;
      const item = courseCatalogItem(categoryId, itemId);

      if (categoryId === "kit_participante" && itemId === "apostila") {
        return {
          id: itemId,
          ...requiredRemovalRules.apostila,
          label: item?.label || requiredRemovalRules.apostila.label
        };
      }
      if (categoryId === "transporte" && requiredCatalogItems("transporte").length) {
        return {
          id: "transporte",
          ...requiredRemovalRules.transporte,
          label: item?.label || requiredRemovalRules.transporte.label
        };
      }
      if (categoryId === "alimentacao") {
        const dailyWorkload = Number(
          card.querySelector('[data-field="carga_horaria_diaria"]')?.value
        );
        if (requiredCourseFoodItemIds(dailyWorkload).includes(itemId)) {
          return { id: itemId, ...requiredRemovalRules[itemId], label: item?.label };
        }
      }
      if (categoryId === "curso_outros" && itemId === "certificado" && item?.obrigatorio) {
        return { id: itemId, ...requiredRemovalRules.certificado, label: item.label };
      }
      return null;
    }

    function removeExpenseRow(row, { synchronizeCourse = true } = {}) {
      const courseContainer = row.closest("[data-course-expenses]");
      const courseCard = row.closest(".course-card");
      const kind = row.dataset.stageKind;
      row.remove();
      if (courseContainer) {
        renderCourseExpenseTable(courseContainer);
        if (synchronizeCourse) syncCourseExpenseQuantities(courseCard);
      }
      if (kind) renderStageTable(kind);
    }

    function openRequiredRemovalDialog(row, rule) {
      state.requiredRemovalTarget = { row, rule };
      requiredRemovalForm.reset();
      clearError(document.getElementById("required-removal-justification"));
      document.getElementById("required-removal-item").textContent = rule.label;
      requiredRemovalDialog.showModal();
      document.getElementById("required-removal-justification").focus();
    }

    function closeRequiredRemovalDialog() {
      requiredRemovalDialog.close();
      state.requiredRemovalTarget = null;
    }

    function confirmRequiredRemoval(event) {
      event.preventDefault();
      const justificationInput = document.getElementById("required-removal-justification");
      if (!validateControl(justificationInput, { ignoreVisibility: true })) {
        justificationInput.focus();
        return;
      }

      const target = state.requiredRemovalTarget;
      if (!target?.row?.isConnected) return closeRequiredRemovalDialog();
      const card = target.row.closest(".course-card");
      courseRemovalJustifications(card)[target.rule.property] = justificationInput.value.trim();
      removeExpenseRow(target.row);
      requiredRemovalDialog.close();
      state.requiredRemovalTarget = null;
      setStatus(`${target.rule.label} removido mediante justificativa formal.`, "success");
    }

    function clearRemovalJustificationForSelection(row) {
      const card = row.closest(".course-card");
      if (!card) return;
      const categoryId = row.querySelector('[data-field="tipo_item_despesa"]')?.value;
      const itemId = row.querySelector('[data-field="item_despesa"]')?.value;
      if (categoryId === "kit_participante" && itemId) {
        removedParticipantKitItems(card).delete(itemId);
        if (itemId === "apostila") clearRequiredRemovalJustification(card, "apostila");
      }
      if (categoryId === "transporte") clearRequiredRemovalJustification(card, "transporte");
      if (categoryId === "alimentacao" && requiredRemovalRules[itemId]) {
        clearRequiredRemovalJustification(card, itemId);
      }
      if (categoryId === "curso_outros" && itemId === "certificado") {
        clearRequiredRemovalJustification(card, "certificado");
      }
    }

    function refreshCourseCategoryItems(categoryId) {
      const category = catalogs.tiposItemCurso.find(item => item.id === categoryId);
      if (!category) return;
      document.querySelectorAll('[data-course-expenses] tbody tr').forEach(row => {
        if (row.querySelector('[data-field="tipo_item_despesa"]')?.value !== categoryId) return;
        const select = row.querySelector('[data-field="item_despesa"]');
        const previousValue = select.value;
        select.innerHTML = optionList(category.itens, "Selecione ou pesquise");
        select.value = previousValue;
        syncComboboxDisplay(select);
        renderComboboxOptions(select.closest(".searchable-combobox"));
      });
    }

    function downloadUpdatedCatalog() {
      const blob = new Blob([catalogCsvText], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "catalogo.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }

    function addCatalogItem(event) {
      event.preventDefault();
      clearCatalogItemErrors();

      const row = state.catalogTargetRow;
      const categoryId = row?.querySelector('[data-field="tipo_item_despesa"]')?.value;
      const config = customCourseCategoryConfig[categoryId];
      if (!row || !config) return closeCatalogItemDialog();

      const name = document.getElementById("catalog-item-name").value.trim();
      const unit = document.getElementById("catalog-item-unit").value.trim();
      let valid = true;
      [["name", name], ["unit", unit]].forEach(([field, value]) => {
        if (!value) {
          setCatalogItemError(field, "Preencha este campo.");
          valid = false;
        } else if (/[;\r\n]/.test(value)) {
          setCatalogItemError(field, "Não use ponto e vírgula ou quebra de linha.");
          valid = false;
        }
      });

      const category = catalogs.tiposItemCurso.find(item => item.id === categoryId);
      const newItemId = catalogId(name);
      if (name && category?.itens.some(item => item.id === newItemId)) {
        setCatalogItemError("name", "Este item já existe na categoria.");
        valid = false;
      }
      if (!valid) {
        catalogItemForm.querySelector(".is-invalid")?.focus();
        return;
      }

      const catalogRow = {
        categoria: config.csvCategory,
        unidade: unit,
        tipo_despesa: config.csvType,
        descricao_item: name,
        obrigatorio: false
      };
      const newItem = mergeCatalogItems([catalogRow])[0];
      catalogRows.push(catalogRow);
      category.itens.push(newItem);
      category.itens.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
      catalogCsvText = serializeCatalogCsv(catalogRows);

      refreshCourseCategoryItems(categoryId);
      const targetSelect = row.querySelector('[data-field="item_despesa"]');
      chooseComboboxOption(targetSelect.closest(".searchable-combobox"), newItem.id);
      catalogItemDialog.close();
      state.catalogTargetRow = null;
      downloadUpdatedCatalog();
      setStatus(`Item "${name}" cadastrado. Substitua o catalogo.csv pela versão baixada para persistir a alteração.`, "success");
    }

