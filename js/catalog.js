"use strict";

    let catalogs = {};
    let catalogRows = [];
    let catalogCsvText = "";

    /* =========================================================
       CATÁLOGO CARREGADO DO CSV
       A aplicação só é inicializada depois que catalogo.csv é carregado.
       ========================================================= */
    const catalogCsvUrl = "./data/catalogo.csv";
    const customCourseCategoryConfig = {
      kit_trabalho: { csvCategory: "kit_trabalho", label: "Kit Trabalho", csvType: "kit" },
      epi: { csvCategory: "epi", label: "EPI", csvType: "finalística" },
      insumos_gerais: { csvCategory: "insumo_gerais", label: "Insumos Gerais", csvType: "finalística" }
    };

    function splitCatalogValues(value) {
      return [...new Set(String(value || "")
        .split(",")
        .map(part => part.trim())
        .filter(Boolean))];
    }

    function catalogId(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    }

    function normalizeExpenseType(value) {
      const normalized = catalogId(value);
      return {
        gestao: "Gestao",
        finalistica: "Finalistica",
        estruturacao: "Estruturacao",
        kit: "Kit"
      }[normalized] || value.trim();
    }

    function parseCatalogCsv(text) {
      const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) throw new Error("O catálogo CSV está vazio.");

      const headerAliases = {
        Categoria: "categoria",
        Unidade: "unidade",
        TIPO: "tipo_despesa",
        "Item de Despesa Padronizado": "descricao_item",
        "Obrigatório": "obrigatorio"
      };
      const headers = lines[0].split(";").map(header => {
        const trimmed = header.trim();
        return headerAliases[trimmed] || trimmed;
      });
      const requiredHeaders = [
        "categoria",
        "unidade",
        "tipo_despesa",
        "descricao_item",
        "obrigatorio"
      ];
      if (!requiredHeaders.every(header => headers.includes(header))) {
        throw new Error("O catálogo CSV não possui as colunas obrigatórias.");
      }

      return lines.slice(1).map((line, lineIndex) => {
        const values = line.split(";");
        if (values.length !== headers.length) {
          throw new Error(`Linha ${lineIndex + 2} inválida no catálogo CSV.`);
        }
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index].trim()]));
        if (!["true", "false"].includes(row.obrigatorio.toLowerCase())) {
          throw new Error(`Linha ${lineIndex + 2} possui um marcador de obrigatoriedade inválido.`);
        }
        row.obrigatorio = row.obrigatorio.toLowerCase() === "true";
        return row;
      });
    }

    function serializeCatalogCsv(rows) {
      const headers = ["categoria", "unidade", "tipo_despesa", "descricao_item", "obrigatorio"];
      return [
        headers.join(";"),
        ...rows.map(row => headers.map(header =>
          header === "obrigatorio" ? String(row[header] === true) : String(row[header] || "").trim()
        ).join(";"))
      ].join("\n");
    }

    function mergeCatalogItems(rows) {
      const items = new Map();
      rows.forEach(row => {
        const label = row.descricao_item;
        const key = catalogId(label);
        const existing = items.get(key) || {
          id: key,
          label,
          unidades: [],
          tipo: normalizeExpenseType(row.tipo_despesa),
          obrigatorio: row.obrigatorio === true
        };
        existing.obrigatorio ||= row.obrigatorio === true;
        existing.unidades = [...new Set([
          ...existing.unidades,
          ...splitCatalogValues(row.unidade)
        ])];
        items.set(key, existing);
      });

      return [...items.values()]
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
    }

    function buildCatalogsFromCsv(rows) {
      const rowsByCategory = category => rows.filter(row => row.categoria === category);
      const courseCategories = [
        ["kit_participante", "Kit participante"],
        ["insumo_gerais", "Insumos gerais"],
        ["epi", "EPI"],
        ["kit_trabalho", "Kit trabalho"],
        ["alimentacao", "Alimentação"],
        ["transporte", "Transporte"],
        ["curso_outros", "Diversas"]
      ];

      return {
        fontesRecurso: ["SISEC", "Contrapartida"],
        tiposItemCurso: courseCategories.map(([csvCategory, label]) => {
          const itens = mergeCatalogItems(rowsByCategory(csvCategory));
          return {
            id: csvCategory === "insumo_gerais" ? "insumos_gerais" : csvCategory,
            label,
            tipo: itens[0]?.tipo || "",
            itens
          };
        }),
        stage11: mergeCatalogItems(rowsByCategory("stage11")),
        stage12: mergeCatalogItems(rowsByCategory("stage12")),
        assistance: mergeCatalogItems(rowsByCategory("assistencia")),
        event: mergeCatalogItems(rowsByCategory("event"))
      };
    }

    async function loadCatalogs(url = catalogCsvUrl) {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Não foi possível carregar o catálogo (${response.status}).`);
      const sourceCsvText = await response.text();
      catalogRows = parseCatalogCsv(sourceCsvText);
      catalogCsvText = serializeCatalogCsv(catalogRows);
      catalogs = buildCatalogsFromCsv(catalogRows);
    }

