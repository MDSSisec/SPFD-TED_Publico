(function () {
  "use strict";

  const participantKit = [
    { items: ["Apontador"], detail: "Apontador escolar com depósito", unitPrice: 4.5 },
    { items: ["Apostila"], detail: "Apostila didática impressa e encadernada", unitPrice: 38 },
    { items: ["Borracha"], detail: "Borracha escolar branca", unitPrice: 3.5 },
    { items: ["Caderno"], detail: "Caderno universitário de capa dura", unitPrice: 28.5 },
    { items: ["Caneta"], detail: "Caneta esferográfica azul", unitPrice: 3.8 },
    { items: ["Copo"], detail: "Copo reutilizável de 400 ml", unitPrice: 12 },
    { items: ["Ecobag"], detail: "Ecobag personalizada em algodão", unitPrice: 19.5 },
    { items: ["Estojo"], detail: "Estojo escolar com fechamento em zíper", unitPrice: 16 },
    { items: ["Garrafa d'água"], detail: "Garrafa reutilizável de 600 ml", unitPrice: 24 },
    { items: ["Lápis"], detail: "Lápis preto nº 2", unitPrice: 2.5 },
    { items: ["Mochila"], detail: "Mochila para transporte do material didático", unitPrice: 72 },
    { items: ["Pasta"], detail: "Pasta plástica com elástico", unitPrice: 9.5 }
  ].map(item => ({
    typeId: "kit_participante",
    code: "33.90.30",
    quantity: 1,
    ...item
  }));

  window.MOCK_COURSES = [
    {
      name: "Eletricista Instalador",
      start: "03/2026",
      end: "05/2026",
      totalWorkload: 80,
      dailyWorkload: 8,
      participants: 100,
      reserveMargin: 10,
      weeklyMeetings: 5,
      expenses: [
        ...participantKit,
        { typeId: "epi", items: ["Capacete"], detail: "Capacete de segurança classe B", code: "33.90.30", quantity: 1, unitPrice: 46 },
        { typeId: "epi", items: ["Luva"], detail: "Luva isolante para atividades elétricas", code: "33.90.30", quantity: 1, unitPrice: 42 },
        { typeId: "epi", items: ["Óculos de proteção"], detail: "Óculos de segurança com proteção lateral", code: "33.90.30", quantity: 1, unitPrice: 18 },
        { typeId: "epi", items: ["Protetor facial contra arco elétrico"], detail: "Protetor facial para trabalhos com risco de arco elétrico", code: "33.90.30", quantity: 1, unitPrice: 185 },
        { typeId: "kit_trabalho", items: ["Alicate"], detail: "Alicate universal isolado", code: "33.90.30", quantity: 1, unitPrice: 58 },
        { typeId: "kit_trabalho", items: ["Chave de fenda"], detail: "Chave de fenda isolada para instalações elétricas", code: "33.90.30", quantity: 1, unitPrice: 26 },
        { typeId: "kit_trabalho", items: ["Chave de teste de tensão"], detail: "Chave para teste de tensão", code: "33.90.30", quantity: 1, unitPrice: 24 },
        { typeId: "kit_trabalho", items: ["Multímetro"], detail: "Multímetro digital portátil", code: "33.90.30", quantity: 1, unitPrice: 96 },
        { typeId: "insumos_gerais", items: ["Cabo/Fio"], detail: "Cabo flexível para exercícios em bancada", code: "33.90.30", quantity: 20, unitPrice: 8.5 },
        { typeId: "insumos_gerais", items: ["Disjuntor"], detail: "Disjuntor termomagnético para aulas práticas", code: "33.90.30", quantity: 30, unitPrice: 22 },
        { typeId: "insumos_gerais", items: ["Fita isolante"], detail: "Fita isolante antichama", code: "33.90.30", quantity: 110, unitPrice: 9 },
        { typeId: "insumos_gerais", items: ["Tomada"], detail: "Tomada padrão brasileiro para montagem didática", code: "33.90.30", quantity: 60, unitPrice: 14 },
        { typeId: "alimentacao", items: ["Almoço para participantes"], detail: "Refeição individual completa", code: "33.90.39", quantity: 110, unitPrice: 24 },
        { typeId: "transporte", items: ["Transporte público"], detail: "", code: "33.90.33", quantity: 1, unitPrice: 5.5 },
        { typeId: "curso_outros", items: ["Instrutor"], detail: "Instrutor habilitado em instalações elétricas", code: "33.90.39", quantity: 80, unitPrice: 110 }
      ]
    },
    {
      name: "Panificação e Confeitaria",
      start: "04/2026",
      end: "06/2026",
      totalWorkload: 60,
      dailyWorkload: 6,
      participants: 48,
      reserveMargin: 5,
      weeklyMeetings: 3,
      expenses: [
        ...participantKit,
        { typeId: "epi", items: ["Avental"], detail: "Avental de proteção para manipulação de alimentos", code: "33.90.30", quantity: 1, unitPrice: 32 },
        { typeId: "epi", items: ["Luva"], detail: "Luva de proteção para atividades culinárias", code: "33.90.30", quantity: 1, unitPrice: 18 },
        { typeId: "epi", items: ["Máscara"], detail: "Máscara descartável para manipulação de alimentos", code: "33.90.30", quantity: 1, unitPrice: 2.5 },
        { typeId: "epi", items: ["Touca"], detail: "Touca descartável para proteção dos alimentos", code: "33.90.30", quantity: 1, unitPrice: 1.8 },
        { typeId: "kit_trabalho", items: ["Assadeira"], detail: "Assadeira retangular de alumínio reforçado", code: "33.90.30", quantity: 1, unitPrice: 48 },
        { typeId: "kit_trabalho", items: ["Avental"], detail: "Avental profissional para uso individual", code: "33.90.30", quantity: 1, unitPrice: 38 },
        { typeId: "kit_trabalho", items: ["Espátula"], detail: "Espátula culinária em silicone", code: "33.90.30", quantity: 1, unitPrice: 22 },
        { typeId: "kit_trabalho", items: ["Fouet"], detail: "Batedor manual em aço inoxidável", code: "33.90.30", quantity: 1, unitPrice: 24 },
        { typeId: "insumos_gerais", items: ["Forma para alimentos"], detail: "Forma para preparo e cocção de alimentos", code: "33.90.30", quantity: 12, unitPrice: 36 },
        { typeId: "insumos_gerais", items: ["Assadeira"], detail: "Assadeira para uso nas aulas práticas", code: "33.90.30", quantity: 12, unitPrice: 42 },
        { typeId: "alimentacao", items: ["Lanche"], detail: "Lanche individual para os participantes", code: "33.90.39", quantity: 50, unitPrice: 12 },
        { typeId: "transporte", items: ["Transporte privado"], detail: "", code: "33.90.33", quantity: 1, unitPrice: 12 },
        { typeId: "curso_outros", items: ["Instrutor"], detail: "Instrutor com experiência em panificação e confeitaria", code: "33.90.39", quantity: 60, unitPrice: 85 },
        { typeId: "curso_outros", items: ["Monitor"], detail: "Monitor para apoio às atividades práticas em laboratório", code: "33.90.39", quantity: 30, unitPrice: 45 }
      ]
    },
    {
      name: "Horticultura e Produção Sustentável",
      start: "05/2026",
      end: "07/2026",
      totalWorkload: 40,
      dailyWorkload: 4,
      participants: 30,
      reserveMargin: 8,
      weeklyMeetings: 2,
      expenses: [
        ...participantKit,
        { typeId: "epi", items: ["Bota"], detail: "Bota de segurança impermeável para atividades de campo", code: "33.90.30", quantity: 1, unitPrice: 78 },
        { typeId: "epi", items: ["Luva"], detail: "Luva de proteção para manejo de solo e plantas", code: "33.90.30", quantity: 1, unitPrice: 24 },
        { typeId: "epi", items: ["Óculos de proteção"], detail: "Óculos de proteção para atividades de campo", code: "33.90.30", quantity: 1, unitPrice: 18 },
        { typeId: "epi", items: ["Protetor solar"], detail: "Protetor solar para atividades externas", code: "33.90.30", quantity: 1, unitPrice: 34 },
        { typeId: "kit_trabalho", items: ["Enxada"], detail: "Enxada para preparo e manejo do solo", code: "33.90.30", quantity: 1, unitPrice: 72 },
        { typeId: "kit_trabalho", items: ["Pá de bico"], detail: "Pá de bico com cabo de madeira", code: "33.90.30", quantity: 1, unitPrice: 68 },
        { typeId: "kit_trabalho", items: ["Regador"], detail: "Regador plástico com capacidade de 10 litros", code: "33.90.30", quantity: 1, unitPrice: 42 },
        { typeId: "kit_trabalho", items: ["Tesoura"], detail: "Tesoura de poda manual", code: "33.90.30", quantity: 1, unitPrice: 54 },
        { typeId: "insumos_gerais", items: ["Adubo"], detail: "Adubo orgânico para as unidades demonstrativas", code: "33.90.30", quantity: 40, unitPrice: 18 },
        { typeId: "insumos_gerais", items: ["Muda"], detail: "Mudas adaptadas à região demonstrativa", code: "33.90.30", quantity: 90, unitPrice: 8.5 },
        { typeId: "insumos_gerais", items: ["Semente"], detail: "Sementes de hortaliças variadas", code: "33.90.30", quantity: 60, unitPrice: 6.5 },
        { typeId: "insumos_gerais", items: ["Substrato"], detail: "Substrato preparado para produção de mudas", code: "33.90.30", quantity: 30, unitPrice: 22 },
        { typeId: "alimentacao", items: ["Lanche"], detail: "Lanche individual para os participantes", code: "33.90.39", quantity: 33, unitPrice: 12 },
        { typeId: "transporte", items: ["Transporte público"], detail: "", code: "33.90.33", quantity: 1, unitPrice: 5.5 },
        { typeId: "curso_outros", items: ["Instrutor"], detail: "Instrutor com experiência em horticultura sustentável", code: "33.90.39", quantity: 40, unitPrice: 90 }
      ]
    }
  ];
}());
