"use strict";

    /* ======================================================================
       5. COMPONENTES DINÂMICOS: CURSOS E DESPESAS
       ====================================================================== */
    function buildCourseCard(index) {
      const courseNumber = index + 1;
      const card = document.createElement("article");
      card.className = "course-card";
      card.dataset.courseIndex = String(index);
      card.innerHTML = `
        <div class="course-card__header">
          <h3>Curso ${courseNumber}</h3>
          <span class="hint">Campos obrigatórios marcados com *</span>
        </div>
        <div class="course-card__body">
          <h4 class="subsection-title">2.1 — Dados gerais do curso</h4>
          <div class="grid">
            ${courseField(index, "nome_curso", "Nome do Curso", "text", { full: true, max: 255 })}
            ${courseField(index, "inicio_curso", "Início do curso", "text", { monthYear: true, placeholder: "MM/AAAA" })}
            ${courseField(index, "fim_curso", "Fim do curso", "text", { monthYear: true, placeholder: "MM/AAAA" })}
            ${courseField(index, "carga_horaria_total", "Carga horária total", "number", {
              min: 40,
              step: 10,
              multipleOf: 10,
              suffix: "horas",
              rangeError: "Informe um número inteiro, igual ou superior a 40, terminado em 0."
            })}
            ${courseField(index, "quantidade_participantes", "Quantidade de participantes", "number", { min: 1 })}
            ${courseField(index, "margem_reserva", "Margem de Reserva", "number", {
              min: 5, max: 10, value: 5, suffix: "%",
              tooltip: "Percentual de segurança (entre 5% e 10%) adicionado à quantidade de participantes para o cálculo de insumos extras (como estojos, apostilas, etc.) em caso de perda ou danos. Exemplo: Para 100 participantes com margem de 5%, o sistema planejará 105 itens.",
              hintAttribute: "data-reserve-impact",
              hint: "Informe a quantidade de participantes para visualizar o impacto da margem.",
              rangeError: "A margem de reserva deve ser um valor entre 5% e 10%."
            })}
            ${courseDailyWorkloadField(index)}
            <div class="field">
              <label for="curso_${index}_duracao_dias">Dias de duração do curso</label>
              <div class="input-with-suffix">
                <input id="curso_${index}_duracao_dias" type="number" data-field="duracao_dias" readonly />
                <span class="input-suffix">dias</span>
              </div>
            </div>
            ${courseField(index, "quantidade_encontros_semanais", "Quantidade de encontros semanais", "number", { min: 1, max: 5 })}
            <div class="field">
              <label for="curso_${index}_quantidade_turmas">Quantidade mínima de turmas</label>
              <input id="curso_${index}_quantidade_turmas" type="number" data-field="quantidade_turmas" readonly />
              <small class="hint">Calculada considerando o limite de 30 participantes.</small>
              <small class="error-message" data-error-for="curso_${index}_quantidade_turmas"></small>
            </div>
            <div class="field">
              <label for="curso_${index}_participantes_por_turma">Máximo de participantes em uma turma</label>
              <input id="curso_${index}_participantes_por_turma" type="number" data-field="participantes_por_turma" readonly />
              <small class="hint" data-class-distribution>Informe a quantidade de participantes.</small>
              <small class="error-message" data-error-for="curso_${index}_participantes_por_turma"></small>
            </div>
          </div>
          <div class="divider"></div>
          <!-- RESUMO FINANCEIRO INDIVIDUAL DO CURSO -->
          <div class="summary-strip summary-strip--course" data-course-summary="${index}">
            <div class="summary-card">
              <span>Total de itens</span>
              <strong data-course-count>0</strong>
            </div>
            <div class="summary-card">
              <span>Valor total</span>
              <strong data-course-total>R$ 0,00</strong>
            </div>
            <div class="summary-card">
              <span>Valor Kit Participante por Aluno</span>
              <strong data-course-kit-per-student>R$ 0,00</strong>
            </div>
            <!-- Cards condicionais: aparecem apenas quando há despesas do respectivo tipo -->
            <div class="summary-card" data-course-type-card="epi" hidden>
              <span>Valor EPI por Aluno</span>
              <strong data-course-epi-per-student>R$ 0,00</strong>
            </div>
            <div class="summary-card" data-course-type-card="insumos_gerais" hidden>
              <span>Valor Insumo por Aluno</span>
              <strong data-course-insumos-per-student>R$ 0,00</strong>
            </div>
            <div class="summary-card" data-course-type-card="kit_trabalho" hidden>
              <span>Valor Kit Trabalho por Aluno</span>
              <strong data-course-kit-trabalho-per-student>R$ 0,00</strong>
            </div>
          </div>
          <div class="table-toolbar">
            <h4 class="subsection-title">2.2 — Detalhamento de gastos do curso</h4>
          </div>
          <div data-course-expenses="${index}">${emptyState("Nenhuma despesa adicionada a este curso.")}</div>
          <div class="table-footer-actions">
            <button class="btn btn-secondary btn-sm" type="button" data-add-course-expense="${index}">+ Adicionar despesa</button>
          </div>
        </div>`;
      return card;
    }

    function courseField(index, id, label, type, options = {}) {
      const fieldId = `curso_${index}_${id}`;
      const attrs = [
        `id="${fieldId}"`, `name="${fieldId}"`, `type="${type}"`, `data-field="${id}"`, `data-required="true"`
      ];
      if (type === "number") attrs.push(`step="${options.step || 1}"`, `inputmode="numeric"`);
      if (options.monthYear) attrs.push(`class="month-year-input"`, `inputmode="numeric"`, `maxlength="7"`);
      if (options.min != null) attrs.push(`min="${options.min}"`);
      if (options.max != null) attrs.push(`max="${options.max}"`);
      if (options.max && type === "text") attrs.push(`maxlength="${options.max}"`);
      if (options.value != null) attrs.push(`value="${escapeHtml(options.value)}"`);
      if (options.placeholder) attrs.push(`placeholder="${escapeHtml(options.placeholder)}"`);
      if (options.rangeError) attrs.push(`data-range-error="${escapeHtml(options.rangeError)}"`);
      if (options.multipleOf != null) attrs.push(`data-multiple-of="${options.multipleOf}"`);
      const wrapper = options.suffix ? "input-with-suffix" : "";
      const tooltipId = `${fieldId}_tooltip`;
      return `
        <div class="field ${options.full ? "field--full" : ""}">
          <label class="required${options.tooltip ? " label-with-help" : ""}" for="${fieldId}">
            ${escapeHtml(label)}
            ${options.tooltip ? `<span class="help-tooltip" tabindex="0" role="button" aria-label="Ajuda sobre ${escapeHtml(label)}" aria-describedby="${tooltipId}">?<span id="${tooltipId}" class="help-tooltip__content" role="tooltip">${escapeHtml(options.tooltip)}</span></span>` : ""}
          </label>
          <div class="${wrapper}">
            <input ${attrs.join(" ")} />
            ${options.suffix ? `<span class="input-suffix">${escapeHtml(options.suffix)}</span>` : ""}
          </div>
          ${options.hint ? `<small class="hint" ${options.hintAttribute || ""}>${escapeHtml(options.hint)}</small>` : ""}
          <small class="error-message" data-error-for="${fieldId}"></small>
        </div>`;
    }

    function courseDailyWorkloadField(index) {
      return courseField(index, "carga_horaria_diaria", "Carga horária diária", "number", {
        min: 2,
        max: 8,
        step: 1,
        suffix: "horas",
        rangeError: "Informe um número inteiro entre 2 e 8 horas."
      });
    }

    function updateCourseDuration(card) {
      const total = Number(card.querySelector('[data-field="carga_horaria_total"]')?.value);
      const daily = Number(card.querySelector('[data-field="carga_horaria_diaria"]')?.value);
      const duration = card.querySelector('[data-field="duracao_dias"]');
      if (duration) duration.value = total > 0 && daily > 0 ? Math.ceil(total / daily) : "";
    }

    function calculateClassDistribution(participantCount, capacity = 30) {
      if (!Number.isInteger(participantCount) || participantCount < 1) return [];
      const classCount = Math.ceil(participantCount / capacity);
      const baseClassSize = Math.floor(participantCount / classCount);
      const classesWithExtraParticipant = participantCount % classCount;

      return Array.from(
        { length: classCount },
        (_, index) => baseClassSize + (index < classesWithExtraParticipant ? 1 : 0)
      );
    }

    function updateClassDistribution(card) {
      const participantInput = card.querySelector('[data-field="quantidade_participantes"]');
      const classCountInput = card.querySelector('[data-field="quantidade_turmas"]');
      const maxPerClassInput = card.querySelector('[data-field="participantes_por_turma"]');
      const distributionHint = card.querySelector("[data-class-distribution]");
      const distribution = calculateClassDistribution(Number(participantInput?.value));

      classCountInput.value = distribution.length || "";
      maxPerClassInput.value = distribution.length ? Math.max(...distribution) : "";
      distributionHint.textContent = distribution.length
        ? `Distribuição: ${distribution.join(" + ")} = ${distribution.reduce((sum, value) => sum + value, 0)} participantes.`
        : "Informe a quantidade de participantes.";
    }

    function calculateParticipantCountWithReserve(participantCount, reserveMargin) {
      if (!Number.isFinite(participantCount) || participantCount <= 0 ||
          !Number.isFinite(reserveMargin) || reserveMargin < 0) {
        return 0;
      }
      return Math.ceil(participantCount * (100 + reserveMargin) / 100);
    }

    function updateReserveImpact(card) {
      const participantCount = Number(card.querySelector('[data-field="quantidade_participantes"]')?.value);
      const reserveMargin = Number(card.querySelector('[data-field="margem_reserva"]')?.value);
      const impactHint = card.querySelector("[data-reserve-impact]");
      if (!impactHint) return;

      if (Number.isInteger(participantCount) && participantCount > 0 &&
          Number.isInteger(reserveMargin) && reserveMargin >= 5 && reserveMargin <= 10) {
        const itemCount = calculateParticipantCountWithReserve(participantCount, reserveMargin);
        impactHint.textContent = `Com esta margem, o sistema calculará a compra de ${itemCount} itens para ${participantCount} participantes.`;
      } else {
        impactHint.textContent = "Informe valores válidos de participantes e margem para visualizar o cálculo.";
      }
    }

    function calculateTransportQuantity(totalWorkload, participantCountWithReserve, dailyWorkload) {
      const divisionResult = totalWorkload > 0 && dailyWorkload > 0 && participantCountWithReserve > 0
        ? totalWorkload / dailyWorkload
        : 0;
      const participantTrips = divisionResult * participantCountWithReserve;
      const rawQuantity = participantTrips * 2;
      return {
        divisionResult,
        participantTrips,
        rawQuantity,
        quantity: rawQuantity > 0 ? Math.ceil(rawQuantity) : 0
      };
    }

    const courseFoodItemIds = {
      snack: "lanche",
      lunch: "almoco_para_participantes"
    };

    function courseCatalogCategory(categoryId) {
      return catalogs.tiposItemCurso.find(category => category.id === categoryId);
    }

    function requiredCatalogItems(categoryId) {
      return courseCatalogCategory(categoryId)?.itens.filter(item => item.obrigatorio) || [];
    }

    function courseCatalogItem(categoryId, itemId) {
      return courseCatalogCategory(categoryId)?.itens.find(item => item.id === itemId);
    }

    const requiredRemovalRules = {
      transporte: {
        property: "justificativaRemocaoTransporte",
        label: "Transporte"
      },
      lanche: {
        property: "justificativaRemocaoLanche",
        label: "Lanche"
      },
      almoco_para_participantes: {
        property: "justificativaRemocaoAlmoco",
        label: "Almoço"
      },
      certificado: {
        property: "justificativaRemocaoCertificado",
        label: "Certificado"
      },
      apostila: {
        property: "justificativaRemocaoApostila",
        label: "Apostila"
      }
    };

    function courseRemovalJustifications(card) {
      if (!card.requiredRemovalJustifications) card.requiredRemovalJustifications = {};
      return card.requiredRemovalJustifications;
    }

    function hasRequiredRemovalJustification(card, ruleId) {
      const property = requiredRemovalRules[ruleId]?.property;
      return Boolean(property && courseRemovalJustifications(card)[property]);
    }

    function clearRequiredRemovalJustification(card, ruleId) {
      const property = requiredRemovalRules[ruleId]?.property;
      if (property) delete courseRemovalJustifications(card)[property];
    }

    function removedParticipantKitItems(card) {
      if (!card.removedParticipantKitItems) card.removedParticipantKitItems = new Set();
      return card.removedParticipantKitItems;
    }

    function requiredCourseFoodItemIds(dailyWorkload, card = null) {
      const requiredIds = new Set(requiredCatalogItems("alimentacao").map(item => item.id));
      const withoutJustifiedRemovals = itemIds => card
        ? itemIds.filter(itemId => !hasRequiredRemovalJustification(card, itemId))
        : itemIds;
      if (dailyWorkload >= 2 && dailyWorkload <= 4) {
        return withoutJustifiedRemovals(
          requiredIds.has(courseFoodItemIds.snack) ? [courseFoodItemIds.snack] : []
        );
      }
      if (dailyWorkload > 4 && dailyWorkload <= 8) {
        return withoutJustifiedRemovals(
          [courseFoodItemIds.snack, courseFoodItemIds.lunch]
            .filter(itemId => requiredIds.has(itemId))
        );
      }
      return [];
    }

    function availableCourseItems(type, row) {
      if (type?.id !== "alimentacao") return type?.itens || [];
      const card = row.closest(".course-card");
      const dailyWorkload = Number(
        card?.querySelector('[data-field="carga_horaria_diaria"]')?.value
      );
      const currentItemId = row.querySelector('[data-field="item_despesa"]')?.value;
      const selectedInOtherRows = new Set(
        [...card.querySelectorAll('[data-course-expenses] tbody tr')]
          .filter(candidate => candidate !== row)
          .filter(candidate =>
            candidate.querySelector('[data-field="tipo_item_despesa"]')?.value === type.id
          )
          .map(candidate => candidate.querySelector('[data-field="item_despesa"]')?.value)
          .filter(Boolean)
      );

      return type.itens.filter(item => {
        if (dailyWorkload >= 2 && dailyWorkload <= 4 &&
            item.id === courseFoodItemIds.lunch) {
          return false;
        }
        return item.id === currentItemId || !selectedInOtherRows.has(item.id);
      });
    }

    function calculateFoodQuantity(totalWorkload, participantCountWithReserve, dailyWorkload, itemId) {
      const classDays = totalWorkload > 0 && dailyWorkload > 0
        ? totalWorkload / dailyWorkload
        : 0;
      const baseQuantity = classDays * participantCountWithReserve;
      const multiplier = itemId === courseFoodItemIds.snack &&
        dailyWorkload > 4 && dailyWorkload <= 8
        ? 2
        : 1;
      const rawQuantity = baseQuantity * multiplier;
      const nearestInteger = Math.round(rawQuantity);
      const quantity = Math.abs(rawQuantity - nearestInteger) < 1e-9
        ? nearestInteger
        : Math.ceil(rawQuantity);

      return {
        classDays,
        baseQuantity,
        multiplier,
        rawQuantity,
        quantity: rawQuantity > 0 ? quantity : 0
      };
    }

    function syncCourseFoodExpenses(card, dailyWorkload) {
      if (!card || card.dataset.foodExpenseSync === "true") return;

      const requiredItemIds = requiredCourseFoodItemIds(dailyWorkload, card);
      const category = catalogs.tiposItemCurso.find(item => item.id === "alimentacao");
      if (!category) return;

      const container = card.querySelector("[data-course-expenses]");
      const rows = () => [...container.querySelectorAll("tbody tr")];
      card.dataset.foodExpenseSync = "true";

      try {
        if (dailyWorkload >= 2 && dailyWorkload <= 4) {
          const lunchRows = rows().filter(row =>
            row.querySelector('[data-field="tipo_item_despesa"]')?.value === category.id &&
            row.querySelector('[data-field="item_despesa"]')?.value === courseFoodItemIds.lunch
          );
          if (lunchRows.length) {
            lunchRows.forEach(row => row.remove());
            renderCourseExpenseTable(container);
          }
        }

        if (!requiredItemIds.length) return;

        rows()
          .filter(row =>
            row.querySelector('[data-field="tipo_item_despesa"]')?.value === category.id
          )
          .forEach(row => {
            const itemSelect = row.querySelector('[data-field="item_despesa"]');
            const selectedItemId = itemSelect.value;
            const availableItems = availableCourseItems(category, row);
            setComboboxOptions(itemSelect, availableItems);
            if (availableItems.some(item => item.id === selectedItemId)) {
              itemSelect.value = selectedItemId;
              syncComboboxDisplay(itemSelect);
            }
          });

        requiredItemIds.forEach(itemId => {
          const alreadyIncluded = rows().some(row =>
            row.querySelector('[data-field="tipo_item_despesa"]')?.value === category.id &&
            row.querySelector('[data-field="item_despesa"]')?.value === itemId
          );
          if (alreadyIncluded) return;

          let row = rows().find(candidate =>
            candidate.querySelector('[data-field="tipo_item_despesa"]')?.value === category.id &&
            !candidate.querySelector('[data-field="item_despesa"]')?.value
          );
          if (!row) {
            addCourseExpense(Number(card.dataset.courseIndex));
            row = rows().at(-1);
          }

          const typeSelect = row.querySelector('[data-field="tipo_item_despesa"]');
          if (typeSelect.value !== category.id) {
            typeSelect.value = category.id;
            typeSelect.dispatchEvent(new Event("change", { bubbles: true }));
          }

          const itemSelect = row.querySelector('[data-field="item_despesa"]');
          chooseComboboxOption(itemSelect.closest(".searchable-combobox"), itemId);
        });
      } finally {
        delete card.dataset.foodExpenseSync;
      }
    }

    function ensureRequiredCourseItem(card, category, itemId) {
      const container = card.querySelector("[data-course-expenses]");
      const rows = () => [...container.querySelectorAll("tbody tr")];
      if (rows().some(row =>
        row.querySelector('[data-field="tipo_item_despesa"]')?.value === category.id &&
        row.querySelector('[data-field="item_despesa"]')?.value === itemId
      )) return;

      let row = rows().find(candidate =>
        candidate.querySelector('[data-field="tipo_item_despesa"]')?.value === category.id &&
        !candidate.querySelector('[data-field="item_despesa"]')?.value
      );
      if (!row) {
        addCourseExpense(Number(card.dataset.courseIndex));
        row = rows().at(-1);
      }

      const typeSelect = row.querySelector('[data-field="tipo_item_despesa"]');
      if (typeSelect.value !== category.id) {
        typeSelect.value = category.id;
        typeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const itemSelect = row.querySelector('[data-field="item_despesa"]');
      chooseComboboxOption(itemSelect.closest(".searchable-combobox"), itemId);
    }

    function syncRequiredCourseExpenses(card) {
      if (!card || card.dataset.requiredExpenseSync === "true") return;
      card.dataset.requiredExpenseSync = "true";

      try {
        ["kit_participante", "curso_outros"].forEach(categoryId => {
          const category = courseCatalogCategory(categoryId);
          if (!category) return;
          requiredCatalogItems(categoryId)
            .filter(item =>
              categoryId === "kit_participante"
                ? !removedParticipantKitItems(card).has(item.id) &&
                  !hasRequiredRemovalJustification(card, item.id)
                : !hasRequiredRemovalJustification(card, item.id)
            )
            .forEach(item => ensureRequiredCourseItem(card, category, item.id));
        });
        ensureInitialTransportExpense(card);
      } finally {
        delete card.dataset.requiredExpenseSync;
      }
    }

    function syncCourseExpenseQuantities(card) {
      if (!card) return;

      const participantCount = Number(card.querySelector('[data-field="quantidade_participantes"]')?.value);
      const reserveMargin = Number(card.querySelector('[data-field="margem_reserva"]')?.value);
      const totalWorkload = Number(card.querySelector('[data-field="carga_horaria_total"]')?.value);
      const dailyWorkload = Number(card.querySelector('[data-field="carga_horaria_diaria"]')?.value);
      const itemCount = calculateParticipantCountWithReserve(participantCount, reserveMargin);
      const requiredFoodItemIds = requiredCourseFoodItemIds(dailyWorkload, card);

      syncRequiredCourseExpenses(card);
      syncCourseFoodExpenses(card, dailyWorkload);

      card.querySelectorAll('[data-course-expenses] tbody tr').forEach(row => {
        const typeId = row.querySelector('[data-field="tipo_item_despesa"]')?.value;
        const itemId = row.querySelector('[data-field="item_despesa"]')?.value;
        const quantityInput = row.querySelector('[data-field="quantidade_itens"]');
        const detailInput = row.querySelector('[data-field="detalhamento_item"]');
        if (!quantityInput || !detailInput) return;

        const usesReserve = ["kit_participante", "epi"].includes(typeId);
        const usesCertificateParticipantCount =
          typeId === "curso_outros" && itemId === "certificado" &&
          courseCatalogItem(typeId, itemId)?.obrigatorio === true;
        const usesParticipantCount =
          typeId === "kit_trabalho" || usesCertificateParticipantCount;
        const usesTransportCalculation = typeId === "transporte" && Boolean(itemId);
        const usesFoodCalculation =
          typeId === "alimentacao" && requiredFoodItemIds.includes(itemId);
        const hadTransportCalculation = row.dataset.transportCalculation === "true";
        const hadFoodCalculation = row.dataset.foodCalculation === "true";
        const hadCertificateCalculation = row.dataset.certificateCalculation === "true";

        if (hadCertificateCalculation && !usesCertificateParticipantCount) {
          delete row.dataset.certificateCalculation;
          quantityInput.value = "";
        }
        if (usesCertificateParticipantCount) {
          row.dataset.certificateCalculation = "true";
        }

        if (usesFoodCalculation) {
          if (hadTransportCalculation) {
            delete row.dataset.transportCalculation;
            detailInput.value = "";
          }
          row.dataset.foodCalculation = "true";
          quantityInput.readOnly = true;
          detailInput.readOnly = false;

          const { quantity: foodQuantity } = calculateFoodQuantity(
            totalWorkload,
            itemCount,
            dailyWorkload,
            itemId
          );
          quantityInput.value = foodQuantity || "";
          clearError(quantityInput);
          recalculateRow(row);
          return;
        }

        if (hadFoodCalculation) {
          delete row.dataset.foodCalculation;
          quantityInput.value = "";
        }

        if (usesTransportCalculation) {
          row.dataset.transportCalculation = "true";
          quantityInput.readOnly = true;
          detailInput.readOnly = true;

          const { divisionResult, participantTrips, rawQuantity, quantity: transportQuantity } =
            calculateTransportQuantity(totalWorkload, itemCount, dailyWorkload);

          quantityInput.value = transportQuantity || "";
          if (transportQuantity) {
            const divisionResultText = divisionResult.toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 4
            });
            const rawQuantityText = rawQuantity.toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 4
            });
            const participantTripsText = participantTrips.toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 4
            });
            const roundingText = Number.isInteger(rawQuantity)
              ? ""
              : `; ${rawQuantityText} arredondado para cima = ${transportQuantity}`;
            detailInput.value =
              `${totalWorkload}h de carga horária total ÷ ${dailyWorkload}h diárias = ${divisionResultText}; ` +
              `${divisionResultText} × ${itemCount} participantes com margem = ${participantTripsText}; ` +
              `${participantTripsText} × 2 (ida e volta) = ${rawQuantityText}${roundingText}`;
          } else {
            detailInput.value = "";
          }

          clearError(quantityInput);
          clearError(detailInput);
          recalculateRow(row);
          return;
        }

        if (hadTransportCalculation) {
          delete row.dataset.transportCalculation;
          quantityInput.value = "";
          detailInput.value = "";
        }

        quantityInput.readOnly = usesReserve || usesParticipantCount;
        detailInput.readOnly = false;

        if (usesReserve) quantityInput.value = itemCount > 0 ? itemCount : "";
        if (usesParticipantCount) quantityInput.value = participantCount > 0 ? participantCount : "";
        if (usesReserve || usesParticipantCount || hadTransportCalculation ||
            hadCertificateCalculation) {
          recalculateRow(row);
        }
      });
    }

    function totalCourseParticipantsFromForm() {
      return [...document.querySelectorAll('.course-card [data-field="quantidade_participantes"]')]
        .reduce((total, input) => total + (Number(input.value) || 0), 0);
    }

    function updateAssistanceParticipantSummary() {
      document.getElementById("assistance-participants").textContent =
        String(totalCourseParticipantsFromForm());
    }

    function syncCourses() {
      const container = document.getElementById("courses-container");
      const desired = Math.max(1, Number.parseInt(quantityCourses.value, 10) || 1);
      const existing = [...container.querySelectorAll(".course-card")];
      if (existing.length < desired) {
        for (let index = existing.length; index < desired; index += 1) {
          const card = buildCourseCard(index);
          container.appendChild(card);
        }
      } else if (existing.length > desired) {
        existing.slice(desired).forEach(card => card.remove());
      }
      [...container.querySelectorAll(".course-card")].forEach(syncRequiredCourseExpenses);
      updateAssistanceParticipantSummary();
      updateExpenseTotalsByType();
    }

    function emptyState(message) {
      return `<div class="empty-state">${escapeHtml(message)}</div>`;
    }

    function courseExpenseRow(courseIndex) {
      const rowId = `course-${courseIndex}-${++state.rowCounter}`;
      const tr = document.createElement("tr");
      tr.dataset.rowId = rowId;
      tr.innerHTML = `
        ${tableCellSelect("tipo_item_despesa", optionList(catalogs.tiposItemCurso), rowId, "Tipo do item")}
        ${tableCellCombobox("item_despesa", [], rowId, "Item", "Selecione o tipo primeiro", true, true)}
        ${tableCellInput("detalhamento_item", "text", rowId, { placeholder: "Descreva características do item, Ex: Luva de descartavel Latex Natural S/Pó" })}
        ${tableCellInput("codigo_elemento_despesa", "text", rowId, { expenseCode: true, placeholder: "00.00.00" })}
        ${tableCellSelect("unidade", optionList([], "Selecione o item primeiro"), rowId, "Unidade", true)}
        ${tableCellInput("quantidade_itens", "number", rowId, { min: 1 })}
        ${tableCellInput("valor_unitario", "text", rowId, { currency: true })}
        ${tableCellInput("valor_total", "text", rowId, { readonly: true, value: "R$ 0,00" })}
        <td><button class="btn btn-danger btn-sm" type="button" data-remove-row>Remover</button></td>`;

      return tr;
    }

    function stageExpenseRow(kind) {
      const rowId = `${kind}-${++state.rowCounter}`;
      const tr = document.createElement("tr");
      tr.dataset.rowId = rowId;
      tr.dataset.stageKind = kind;
      tr.innerHTML = `
        ${stageItemCell(kind, rowId)}
        ${tableCellInput("detalhamento_item", "text", rowId, { placeholder: "Descreva características do item, Ex: Luva de descartavel Latex Natural S/Pó" })}
        ${tableCellInput("codigo_elemento_despesa", "text", rowId, { expenseCode: true, placeholder: "00.00.00" })}
        ${tableCellSelect("unidade", optionList([], "Selecione o item primeiro"), rowId, "Unidade", true)}
        ${tableCellInput("quantidade_itens", "number", rowId, { min: 1 })}
        ${tableCellInput("valor_unitario", "text", rowId, { currency: true })}
        ${tableCellInput("valor_total", "text", rowId, { readonly: true, value: "R$ 0,00" })}
        ${tableCellSelect("fonte_recurso", optionList(catalogs.fontesRecurso), rowId, "Fonte")}
        <td><button class="btn btn-danger btn-sm" type="button" data-remove-row>Remover</button></td>`;
      return tr;
    }

    function stageItemCell(kind, rowId) {
      const itemCell = tableCellCombobox("item_despesa", catalogs[kind], rowId, "Item");
      return itemCell.replace(
        "</td>",
        `<input type="hidden" data-field="tipo_despesa" /></td>`
      );
    }

    function tableCellSelect(field, options, rowId, label, disabled = false) {
      const id = `${rowId}_${field}`;
      return `<td><select id="${id}" data-field="${field}" data-required="true" aria-label="${escapeHtml(label)}" ${disabled ? "disabled" : ""}>${options}</select><small class="error-message" data-error-for="${id}"></small></td>`;
    }

    function tableCellCombobox(field, items, rowId, label, placeholder = "Selecione ou pesquise", disabled = false, allowItemCreation = false) {
      const id = `${rowId}_${field}`;
      const sourceId = `${id}_value`;
      const listId = `${id}_options`;
      return `<td><div class="${allowItemCreation ? "catalog-item-control" : ""}"><div class="searchable-combobox">
        <input id="${id}" class="searchable-combobox-input" type="text" role="combobox"
          aria-autocomplete="list" aria-controls="${listId}" aria-expanded="false"
          placeholder="${escapeHtml(placeholder)}" autocomplete="off"
          data-combobox-input data-required="true" aria-label="${escapeHtml(label)}" ${disabled ? "disabled" : ""} />
        <div id="${listId}" class="searchable-combobox-list" role="listbox" hidden></div>
        <select id="${sourceId}" class="searchable-combobox-source" data-field="${field}" tabindex="-1" aria-hidden="true" ${disabled ? "disabled" : ""}>${optionList(items, placeholder)}</select>
      </div>${allowItemCreation ? `<button type="button" class="btn btn-secondary catalog-item-action" data-add-catalog-item aria-label="Cadastrar Item" title="Cadastrar Item" hidden>+</button>` : ""}</div><small class="error-message" data-error-for="${id}"></small></td>`;
    }

    function renderComboboxOptions(wrapper, search = "") {
      const select = wrapper.querySelector("select");
      const list = wrapper.querySelector("[role='listbox']");
      const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
      const options = [...select.options].filter(option => option.value &&
        option.textContent.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
      );
      list.innerHTML = options.length ? options.map(option =>
        `<button type="button" class="searchable-combobox-option" role="option" data-combobox-option="${escapeHtml(option.value)}">${escapeHtml(option.textContent)}</button>`
      ).join("") : `<div class="searchable-combobox-empty">Nenhum item encontrado.</div>`;
    }

    function openCombobox(wrapper, search = null) {
      const input = wrapper.querySelector("[data-combobox-input]");
      if (input.disabled) return;
      document.querySelectorAll(".searchable-combobox-list:not([hidden])").forEach(list => {
        if (list !== wrapper.querySelector("[role='listbox']")) closeCombobox(list.closest(".searchable-combobox"));
      });
      renderComboboxOptions(wrapper, search == null ? input.value : search);
      wrapper.querySelector("[role='listbox']").hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function closeCombobox(wrapper) {
      if (!wrapper) return;
      wrapper.querySelector("[role='listbox']").hidden = true;
      wrapper.querySelector("[data-combobox-input]").setAttribute("aria-expanded", "false");
    }

    function chooseComboboxOption(wrapper, value) {
      const select = wrapper.querySelector("select");
      select.value = value;
      syncComboboxDisplay(select);
      closeCombobox(wrapper);
      clearError(wrapper.querySelector("[data-combobox-input]"));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function setComboboxOptions(select, items, placeholder = "Selecione ou pesquise") {
      const wrapper = select.closest(".searchable-combobox");
      const input = wrapper.querySelector("[data-combobox-input]");
      select.innerHTML = optionList(items, placeholder);
      select.value = "";
      input.value = "";
      renderComboboxOptions(wrapper);
      closeCombobox(wrapper);
    }

    function syncComboboxDisplay(select) {
      const input = select.closest(".searchable-combobox")?.querySelector("[data-combobox-input]");
      if (input) input.value = selectedText(select);
    }

    function tableCellInput(field, type, rowId, options = {}) {
      const id = `${rowId}_${field}`;
      const classes = [
        options.currency ? "currency-input" : "",
        options.monthYear ? "month-year-input" : "",
        options.expenseCode ? "expense-code-input" : ""
      ].filter(Boolean).join(" ");
      const attributes = [
        `id="${id}"`, `type="${type}"`, `data-field="${field}"`, `aria-label="${field.replaceAll("_", " ")}"`
      ];
      if (!options.readonly) attributes.push(`data-required="true"`);
      if (options.readonly) attributes.push("readonly");
      if (options.min != null) attributes.push(`min="${options.min}"`, `step="1"`, `inputmode="numeric"`);
      if (options.currency) attributes.push(`inputmode="numeric"`, `autocomplete="off"`, `placeholder="R$ 0,00"`);
      if (options.monthYear) attributes.push(`inputmode="numeric"`, `maxlength="7"`);
      if (options.expenseCode) attributes.push(`inputmode="numeric"`, `maxlength="8"`, `autocomplete="off"`);
      if (options.placeholder) attributes.push(`placeholder="${escapeHtml(options.placeholder)}"`);
      if (options.value != null) attributes.push(`value="${escapeHtml(options.value)}"`);
      return `<td><input class="${classes}" ${attributes.join(" ")} /><small class="error-message" data-error-for="${id}"></small></td>`;
    }

