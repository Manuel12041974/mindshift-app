// ══════════════════════════════════════════════════════════════
// MindShift — Data Models & Scientific Framework
// Based on: James Clear, BJ Fogg, Peter Gollwitzer, Wendy Wood,
//           Kristin Neff, Stuart McGill, Phillippa Lally,
//           Prochaska & DiClemente (TTM), Michie (COM-B),
//           Deci & Ryan (SDT), Katterman (Mindful Eating)
// ══════════════════════════════════════════════════════════════

export const GOALS = [
  { id: "weight", icon: "scale", label: "Perder 15 kg", color: "#6366F1",
    identity: "Sou uma pessoa que trata o corpo com respeito e come para nutrir." },
  { id: "water", icon: "droplet", label: "Beber agua", color: "#0EA5E9",
    identity: "Sou uma pessoa que se mantem hidratada ao longo do dia." },
  { id: "vegan", icon: "leaf", label: "Dieta plant-based", color: "#10B981",
    identity: "Sou uma pessoa que se alimenta de plantas para proteger o coracao." },
  { id: "spine", icon: "spine", label: "Reverter hernia", color: "#F59E0B",
    identity: "Sou uma pessoa que fortalece a coluna todos os dias com movimento inteligente." }
];

export const HABITS = {
  weight: [
    { text: "Depois de acordar, peso-me e registo sem julgamento", min: 1,
      copingPlan: "Se a balanca subiu, lembro-me: flutuacoes sao normais. A tendencia importa, nao o dia.",
      upgrade: "Depois de acordar, peso-me, registo e anoto 1 coisa que comi bem ontem" },
    { text: "Antes de cada refeicao, como um prato de sopa ou salada primeiro", min: 5,
      copingPlan: "Se nao tenho sopa/salada pronta, como uma peca de fruta antes da refeicao.",
      upgrade: "Antes de cada refeicao, faco 3 respiracoes conscientes e como sopa ou salada primeiro" },
    { text: "Depois do jantar, fecho a cozinha \u2014 sem snacks noturnos", min: 0,
      copingPlan: "Se sinto vontade de snack, bebo um cha quente e espero 10 minutos.",
      upgrade: "Depois do jantar, fecho a cozinha e escrevo 1 frase no diario" }
  ],
  water: [
    { text: "Depois de pousar as chaves em casa, encho a garrafa de 1L", min: 1,
      copingPlan: "Se me esqueci, coloco a garrafa junto as chaves como lembrete visual.",
      upgrade: "Depois de pousar as chaves, encho a garrafa e bebo o primeiro copo" },
    { text: "Antes de cada cafe, bebo um copo de agua", min: 1,
      copingPlan: "Se estou fora de casa, peco agua antes do cafe no balcao.",
      upgrade: "Antes de cada cafe, bebo um copo de agua com limao" },
    { text: "Ao sentar na secretaria, a garrafa fica ao lado do teclado", min: 0,
      copingPlan: "Se a garrafa esta vazia, levanto-me para encher \u2014 bonus de movimento.",
      upgrade: "Ao sentar, coloco garrafa junto ao teclado e ponho timer de 90 min" }
  ],
  vegan: [
    { text: "Ao planear o jantar, escolho uma receita 100% vegetal", min: 5,
      copingPlan: "Se nao tenho ideia, uso a regra do prato: legumes + leguminosa + cereal.",
      upgrade: "Ao planear o jantar, escolho receita vegetal e preparo ingredientes com antecedencia" },
    { text: "Ao fazer compras, passo primeiro pela seccao de frutas e legumes", min: 5,
      copingPlan: "Se estou com pressa, compro pelo menos 3 vegetais diferentes.",
      upgrade: "Ao fazer compras, uso a lista dos 20 basicos plant-based" },
    { text: "Depois do almoco, como uma peca de fruta em vez de sobremesa", min: 2,
      copingPlan: "Se nao tenho fruta, como 3 nozes ou amandoas como alternativa.",
      upgrade: "Depois do almoco, como fruta da epoca e anoto no diario alimentar" }
  ],
  spine: [
    { text: "Depois de acordar, faco 5min de extensoes McKenzie na sala", min: 5,
      copingPlan: "Se estou com dor, faco apenas 2 minutos de respiracao deitado.",
      upgrade: "Depois de acordar, faco 8min de McKenzie + cat-cow na sala" },
    { text: "Ao levantar da secretaria (cada 90min), faco 3 bird-dogs por lado", min: 3,
      copingPlan: "Se estou em reuniao, faco 30seg de standing extension discretamente.",
      upgrade: "A cada 90min, faco 5 bird-dogs por lado + 30seg side plank" },
    { text: "Antes de deitar, faco McGill Big 3 (curl-up, side plank, bird-dog)", min: 8,
      copingPlan: "Se estou muito cansado, faco apenas 2 minutos de curl-up basico.",
      upgrade: "Antes de deitar, faco McGill Big 3 + 2min de alongamento dos flexores da anca" }
  ]
};

export const ENV_TIPS = {
  weight: [
    "Usa pratos mais pequenos (efeito Delboeuf \u2014 parece mais cheio)",
    "Remove alimentos processados da bancada visivel",
    "Coloca fruta fresca a altura dos olhos no frigorifico"
  ],
  water: [
    "Garrafa com marcas horarias sempre visivel na secretaria",
    "Uma garrafa em cada divisao que frequentas",
    "App de lembretes de 90 em 90 minutos"
  ],
  vegan: [
    "Prepara ingredientes ao domingo (meal prep minimo)",
    "Lista de compras fixa com os 20 basicos plant-based",
    "Livro de receitas aberto na bancada (nao guardado)"
  ],
  spine: [
    "Tapete de exercicios sempre aberto no chao da sala",
    "Alarme visual no PC a cada 90 minutos para levantar",
    "Rolo lombar fixo na cadeira do escritorio"
  ]
};

export const COMPASSION = [
  "Hoje nao correu como planeei \u2014 e esta tudo bem. Amanha e outro voto na minha nova identidade.",
  "Um deslize nao apaga os votos anteriores. A tendencia importa mais que um dia.",
  "Estou a fazer algo dificil. Mereco a mesma paciencia que daria a um amigo.",
  "Nao preciso de ser perfeito. Preciso de ser consistente na maioria dos dias.",
  "O progresso nao e linear. Cada recomeco e prova de que nao desisti.",
  "Hoje escolhi descansar \u2014 e descansar tambem e cuidar do corpo.",
  "Cada pequena accao conta. Mesmo 1% melhor hoje e progresso real.",
  "A autocompaixao nao e preguica \u2014 e o combustivel para continuar."
];

export const PILLARS = [
  { id: "identity", icon: "brain", title: "Identidade", subtitle: "Quem estou a tornar-me",
    science: "James Clear \u2014 Atomic Habits",  color: "#4F46E5",
    desc: "Mudanca duradoura comeca com identidade, nao objetivos. Cada accao coerente e um voto na pessoa que queres ser." },
  { id: "tiny", icon: "seedling", title: "Tiny Habits", subtitle: "Ridiculamente pequeno",
    science: "BJ Fogg \u2014 Stanford", color: "#059669",
    desc: "Comeca tao pequeno que e impossivel falhar. O comportamento escala quando a friccao desaparece." },
  { id: "environment", icon: "home", title: "Ambiente", subtitle: "Design > Disciplina",
    science: "Wendy Wood \u2014 Duke/USC", color: "#D97706",
    desc: "40-45% dos comportamentos diarios sao automaticos. Redesenha o contexto para que a escolha certa seja a mais facil." },
  { id: "compassion", icon: "heart", title: "Autocompaixao", subtitle: "Recuperar > Castigar",
    science: "Kristin Neff", color: "#E11D48",
    desc: "Apos um deslize, autocompaixao acelera a recuperacao. Perfeccionismo mata habitos." },
  { id: "implementation", icon: "target", title: "Intencoes de Implementacao", subtitle: "Se-Entao Planning",
    science: "Peter Gollwitzer", color: "#7C3AED",
    desc: "Planos Se-Entao duplicam ou triplicam a taxa de sucesso. Delegam a iniciacao do comportamento ao ambiente." },
  { id: "stages", icon: "stairs", title: "Estagios de Mudanca", subtitle: "TTM Model",
    science: "Prochaska & DiClemente", color: "#0891B2",
    desc: "A mudanca passa por estagios: pre-contemplacao, contemplacao, preparacao, accao e manutencao. Intervencoes adaptadas ao estagio sao 2-3x mais eficazes." }
];

export const PHASES = [
  { week: "1-2", phase: "Iniciacao", desc: "1-2 tiny habits por objetivo. Sem pressao de resultado.", color: "#818CF8", s: 1, e: 2 },
  { week: "3-4", phase: "Stacking", desc: "Adicionar 1 habito por objetivo. Habit tracking visivel.", color: "#6366F1", s: 3, e: 4 },
  { week: "5-8", phase: "Automatizacao", desc: "Habitos tornam-se automaticos (~66 dias segundo Phillippa Lally, UCL).", color: "#4F46E5", s: 5, e: 8 },
  { week: "9-12", phase: "Identidade", desc: "A identidade consolida-se. Os habitos sao quem es, nao o que fazes.", color: "#3730A3", s: 9, e: 12 }
];

// TTM Stage Assessment Questions (Prochaska & DiClemente)
export const TTM_STAGES = [
  { id: "precontemplation", label: "Pre-contemplacao",
    desc: "Ainda nao estou a pensar seriamente em mudar.",
    approach: "Vamos comecar por explorar os beneficios da mudanca sem pressao." },
  { id: "contemplation", label: "Contemplacao",
    desc: "Estou a pensar em mudar, mas ainda nao comecei.",
    approach: "Vamos pesar pros e contras e encontrar a tua motivacao mais profunda." },
  { id: "preparation", label: "Preparacao",
    desc: "Ja decidi mudar e estou a planear como.",
    approach: "Vamos criar o teu plano com habitos minusculos e preparar o ambiente." },
  { id: "action", label: "Accao",
    desc: "Ja comecei a mudar os meus habitos recentemente.",
    approach: "Vamos consolidar os habitos com tracking, celebracao e coping plans." },
  { id: "maintenance", label: "Manutencao",
    desc: "Ja mantenho os novos habitos ha mais de 6 meses.",
    approach: "Vamos prevenir recaidas e aprofundar a identidade." }
];

// Mindful Eating Micro-Practices (Katterman et al.)
export const MINDFUL_PRACTICES = [
  { title: "3 Respiracoes Conscientes", duration: "30 seg",
    instruction: "Antes de comer, fecha os olhos. Inspira pelo nariz contando ate 4. Expira pela boca contando ate 6. Repete 3 vezes. Nota como te sentes." },
  { title: "Escala de Fome", duration: "15 seg",
    instruction: "Numa escala de 1 a 10, qual e o teu nivel de fome agora? 1=vazio, 5=neutro, 10=cheio. O ideal e comer entre 3-4 e parar entre 6-7." },
  { title: "Primeira Garfada Consciente", duration: "20 seg",
    instruction: "Come a primeira garfada devagar. Nota a textura, temperatura e sabor. Mastiga pelo menos 15 vezes antes de engolir." },
  { title: "Check-in Emocional", duration: "20 seg",
    instruction: "Estou a comer porque tenho fome fisica ou emocional? Se for emocional, o que estou a sentir? Posso responder a essa emocao de outra forma?" }
];

// CBT Fallback Messages (categorized by situation)
export const CBT_MESSAGES = {
  missed_day: [
    "Um dia sem marcar habitos nao apaga o progresso. A investigacao mostra que falhar um dia nao afeta a formacao do habito (Lally, UCL). O que importa e o padrao geral.",
    "O pensamento tudo-ou-nada (perdi um dia, ja nao vale a pena) e uma distorcao cognitiva. A realidade: tens X dias de consistencia. Um dia e estatisticamente insignificante.",
    "Imagina que um amigo te dissesse que falhou um dia. Dirias 'desiste'? Claro que nao. Da a ti mesmo a mesma compaixao."
  ],
  low_motivation: [
    "A motivacao nao e pre-requisito para a accao \u2014 e frequentemente consequencia dela. Faz a versao minima do habito (2 min) e ve o que acontece.",
    "BJ Fogg descobriu que a emocao vem DEPOIS do comportamento, nao antes. Nao esperes motivacao. Comeca pelo habito mais pequeno.",
    "A tua identidade nao se constroi com motivacao. Constroi-se com votos consistentes. Mesmo um voto pequeno hoje conta."
  ],
  streak_broken: [
    "A streak e uma ferramenta, nao a tua identidade. O teu valor nao depende de um numero. Ja provaste que consegues ser consistente \u2014 faz isso outra vez.",
    "A regra de James Clear: nunca falhar dois dias seguidos. Um dia e um acidente. Dois dias e o inicio de um novo padrao. Volta hoje.",
    "Kristin Neff: a autocompaixao apos falha AUMENTA a motivacao. A autocritica diminui-a. Se gentil contigo mesmo E a estrategia cientificamente mais eficaz."
  ],
  plateau: [
    "Plateaus sao normais e esperados. O teu corpo/mente esta a adaptar-se. Isto nao e falha \u2014 e consolidacao.",
    "E altura de ajustar, nao desistir. Pergunta: posso tornar o habito ligeiramente mais desafiante? Ou preciso de variar o estimulo?",
    "A curva de automaticidade e assintotica (Lally). O progresso abranda naturalmente. Mas cada dia adiciona cimento a base."
  ],
  celebration: [
    "Cada habito completado e um voto na tua nova identidade. Nao e so uma tarefa \u2014 e quem estas a tornar-te.",
    "BJ Fogg: a celebracao imediata e o que cabla o habito no cerebro. Sente orgulho agora \u2014 mereces.",
    "Estas a construir algo real. A maioria das pessoas desiste. Tu estas aqui, a fazer o trabalho. Isso e extraordinario."
  ]
};

// Weekly Review Template (Structured Reflection)
export const WEEKLY_REVIEW_PROMPTS = [
  "Que habitos ja parecem mais automaticos esta semana?",
  "Que obstaculos surgiram? Como os resolvi (ou nao)?",
  "O que preciso de ajustar para a proxima semana?",
  "Numa escala de 1-10, quao alinhado me sinto com a minha nova identidade?",
  "Qual foi o momento de maior orgulho esta semana?"
];

// SRHI Simplified Questions (Self-Report Habit Index - Verplanken & Orbell)
export const AUTOMATICITY_QUESTIONS = [
  "Fiz este habito sem ter que me lembrar conscientemente?",
  "Fiz este habito automaticamente, quase sem pensar?",
  "Seria estranho NAO fazer este habito?",
  "Este habito ja faz parte da minha rotina natural?"
];
