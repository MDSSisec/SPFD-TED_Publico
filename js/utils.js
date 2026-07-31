"use strict";

    /* ======================================================================
       3. UTILITÁRIOS DE FORMATAÇÃO E CONVERSÃO
       ====================================================================== */

    function escapeHtml(value = "") {
      return String(value).replace(/[&<>'"]/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
      })[char]);
    }

    function formatBRL(value) {
      const number = Number(value) || 0;
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number);
    }

    function currencyValue(input) {
      return Number(input.dataset.value || 0);
    }

    function setCurrencyFromDigits(input) {
      const digits = input.value.replace(/\D/g, "");
      if (!digits) {
        input.value = "";
        input.dataset.value = "";
        return;
      }
      const value = Number(digits) / 100;
      input.dataset.value = String(value);
      input.value = formatBRL(value);
    }

    function maskMonthYear(input) {
      const digits = input.value.replace(/\D/g, "").slice(0, 6);
      input.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    }

    function maskExpenseCode(input) {
      const digits = input.value.replace(/\D/g, "").slice(0, 6);
      input.value = digits.match(/.{1,2}/g)?.join(".") || "";
    }

    function monthYearToComparable(value) {
      const match = /^(0[1-9]|1[0-2])\/(\d{4})$/.exec(value || "");
      if (!match) return null;
      return Number(match[2]) * 12 + Number(match[1]);
    }

    function optionList(items, placeholder = "Selecione") {
      return `<option value="">${placeholder}</option>` + items.map(item => {
        const value = typeof item === "string" ? item : item.id;
        const label = typeof item === "string" ? item : item.label;
        return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
      }).join("");
    }

    function setStatus(message = "", type = "") {
      statusBanner.className = "status-banner";
      statusBanner.textContent = message;
      if (message && type) statusBanner.classList.add(`is-${type}`);
    }

