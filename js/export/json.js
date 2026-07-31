"use strict";

    function downloadJson() {
      if (!state.json) return;
      const blob = new Blob([JSON.stringify(state.json, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "projeto_qualificacao.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }

    function finishForm() {
      if (!validateAll()) return;
      state.json = buildJson();
      document.getElementById("json-preview").textContent = JSON.stringify(state.json, null, 2);
      setStatus("Formulario validado. Os arquivos estao prontos para geracao.", "success");
      if (typeof jsonDialog.showModal === "function") jsonDialog.showModal();
      else downloadSpreadsheet();
    }

