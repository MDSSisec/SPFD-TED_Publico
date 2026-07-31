"use strict";

    /* ======================================================================
       2. ESTADO E REFERÊNCIAS DA INTERFACE
       ====================================================================== */
    const state = {
      currentStep: "dados_gerais_projeto",
      completedSteps: new Set(),
      json: null,
      rowCounter: 0,
      catalogTargetRow: null,
      requiredRemovalTarget: null
    };

    let valorTotalGestao = 0;
    let valorTotalFinalistica = 0;
    let valorTotalEstruturacao = 0;
    let valorTotalKit = 0;
    let valorTotalGestaoFinalistica = 0;
    let valorTotalProjetoCalculado = 0;
    let valorTotalSISEC = 0;
    let valorTotalContrapartida = 0;
    let possuiDespesasKit = false;

    const form = document.getElementById("project-form");
    const eventCheckbox = document.getElementById("possui_evento_certificacao");
    const assistanceCheckbox = document.getElementById("possui_assistencia_tecnica_gerencial");
    const quantityCourses = document.getElementById("quantidade_cursos");
    const statusBanner = document.getElementById("form-status");
    const jsonDialog = document.getElementById("json-dialog");
    const catalogItemDialog = document.getElementById("catalog-item-dialog");
    const catalogItemForm = document.getElementById("catalog-item-form");
    const requiredRemovalDialog = document.getElementById("required-removal-dialog");
    const requiredRemovalForm = document.getElementById("required-removal-form");
    const assistanceThemeInput = document.getElementById("tematica_assistencia");
    const assistanceThemeTemplate = assistanceThemeInput.defaultValue.trim();

