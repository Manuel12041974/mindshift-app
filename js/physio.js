// ══════════════════════════════════════════════════════════════
// MindShift — Physiotherapy Module
// Evidence-based lumbar disc herniation rehabilitation
// Based on: McKenzie (MDT), McGill Big 3, Neural Mobilization
// Frontiers 2025 meta-analysis, PMC systematic reviews
// ══════════════════════════════════════════════════════════════

import { haptic, launchConfetti } from './celebrations.js';
import { getPhysioMessage, getPainCategory, getExerciseModification, BREATHING_CUES } from './physio-coach.js';
import { createExerciseAnimation, createBodyMap } from './physio-svg.js';

// ── Exercise Database (24 exercises, 4 phases) ───────────────

export const EXERCISES = [
  // ═══ PHASE I — Acute (Days 1-14): Pain relief, gentle movement ═══
  {
    id: 'prone-lying', name: 'Decubito Ventral Passivo', nameShort: 'Prone Lying',
    phase: 1, category: 'extension', difficulty: 1,
    targetMuscles: ['extensores lombares', 'multifidos'],
    description: 'Deitar de barriga para baixo com almofada fina sob o abdomen. Relaxar completamente. Permite que a gravidade realinhe o disco.',
    sets: 1, reps: 1, holdSeconds: 120, restBetweenSets: 0, totalMinutes: 2,
    contraindications: ['estenose espinal severa'],
    breathingCue: 'Respira lenta e profundamente. Relaxa os musculos das costas a cada expiracao.',
    scienceRef: 'McKenzie R. Treat Your Own Back. 2011',
    steps: ['Deita-te de barriga para baixo', 'Bracos ao lado do corpo ou sob a testa', 'Relaxa completamente por 2 minutos', 'Respira profundamente'],
    modifications: { easier: null, harder: 'prone-on-elbows' }
  },
  {
    id: 'prone-on-elbows', name: 'Apoio nos Cotovelos', nameShort: 'Prone on Elbows',
    phase: 1, category: 'extension', difficulty: 1,
    targetMuscles: ['extensores lombares', 'multifidos', 'gluteos'],
    description: 'Deitado de barriga para baixo, apoia-te nos cotovelos. Cria extensao suave na lombar.',
    sets: 3, reps: 1, holdSeconds: 30, restBetweenSets: 15, totalMinutes: 3,
    contraindications: ['dor irradiada que aumenta com extensao'],
    breathingCue: 'Inspira ao subir para os cotovelos. Mantem respiracao normal.',
    scienceRef: 'McKenzie R. Treat Your Own Back. 2011',
    steps: ['Deita-te de barriga para baixo', 'Coloca cotovelos debaixo dos ombros', 'Empurra o tronco para cima, anca no chao', 'Mantem 30 segundos'],
    modifications: { easier: 'prone-lying', harder: 'mckenzie-press-up' }
  },
  {
    id: 'mckenzie-press-up', name: 'Press-Up McKenzie', nameShort: 'Press-Up',
    phase: 1, category: 'extension', difficulty: 2,
    targetMuscles: ['extensores lombares', 'multifidos', 'abdominais'],
    description: 'Extensao lombar com bracos. O exercicio mais importante do metodo McKenzie para hernia discal.',
    sets: 3, reps: 10, holdSeconds: 2, restBetweenSets: 30, totalMinutes: 5,
    contraindications: ['dor aguda irradiada para a perna durante o exercicio'],
    breathingCue: 'Inspira ao subir, expira ao descer',
    scienceRef: 'Frontiers 2025 meta-analysis; Kilpikoski 2024 RCT',
    steps: ['Deita de barriga para baixo, maos ao lado dos ombros', 'Empurra o tronco para cima com os bracos', 'Mantem a anca no chao — NAO levantar', 'Mantem 1-2 seg no topo, desce lentamente'],
    modifications: { easier: 'prone-on-elbows', harder: 'standing-extension-overpressure' }
  },
  {
    id: 'standing-extension', name: 'Extensao em Pe', nameShort: 'Standing Ext.',
    phase: 1, category: 'extension', difficulty: 1,
    targetMuscles: ['extensores lombares', 'gluteos'],
    description: 'Extensao lombar em pe com maos na lombar. Ideal para fazer no trabalho a cada 90 minutos.',
    sets: 1, reps: 10, holdSeconds: 2, restBetweenSets: 0, totalMinutes: 2,
    contraindications: ['vertigem com extensao cervical'],
    breathingCue: 'Inspira ao inclinar para tras, expira ao voltar',
    scienceRef: 'McKenzie R. Treat Your Own Back. 2011',
    steps: ['Em pe, maos na lombar', 'Inclina o tronco para tras suavemente', 'Mantem 2 seg na extensao maxima sem dor', 'Volta a posicao neutra'],
    modifications: { easier: null, harder: 'standing-extension-overpressure' }
  },
  {
    id: 'abdominal-hollowing', name: 'Hollowing Abdominal', nameShort: 'TrA Activation',
    phase: 1, category: 'stabilization', difficulty: 1,
    targetMuscles: ['transverso abdominal', 'multifidos'],
    description: 'Ativacao isolada do transverso abdominal — o "cinto natural" da coluna. Base de toda a estabilizacao.',
    sets: 3, reps: 10, holdSeconds: 10, restBetweenSets: 20, totalMinutes: 5,
    contraindications: [],
    breathingCue: 'Inspira normalmente. Ao expirar, puxa o umbigo para dentro suavemente.',
    scienceRef: 'Richardson et al. Therapeutic Exercise for Spinal Stabilization',
    steps: ['Deitado de costas, joelhos fletidos', 'Inspira normalmente', 'Ao expirar, puxa umbigo para dentro sem mover a coluna', 'Mantem 10 seg respirando normalmente'],
    modifications: { easier: null, harder: 'front-plank' }
  },
  {
    id: 'sciatic-slider', name: 'Slider Ciatico Supino', nameShort: 'Nerve Slider',
    phase: 1, category: 'neural', difficulty: 2,
    targetMuscles: ['nervo ciatico', 'isquiotibiais'],
    description: 'Mobilizacao suave do nervo ciatico em posicao segura. Melhora o deslizamento neural sem tensionar.',
    sets: 3, reps: 10, holdSeconds: 0, restBetweenSets: 20, totalMinutes: 4,
    contraindications: ['deficit neurologico progressivo', 'sindrome da cauda equina'],
    breathingCue: 'Respira normalmente. Movimentos lentos e controlados.',
    scienceRef: 'PMC 2023 Systematic Review — 6/8 RCTs positivos para NM',
    steps: ['Deitado de costas, uma perna fletida ao peito', 'Estende o joelho lentamente ate sentir tensao ligeira', 'Ao mesmo tempo, faz dorsiflexao do pe', 'Volta a posicao inicial suavemente'],
    modifications: { easier: null, harder: 'sciatic-tensioner' }
  },

  // ═══ PHASE II — Subacute (Weeks 2-6): Core stabilization ═══
  {
    id: 'mcgill-curl-up', name: 'Curl-Up de McGill', nameShort: 'McGill Curl-Up',
    phase: 2, category: 'stabilization', difficulty: 2,
    targetMuscles: ['reto abdominal', 'obliquos', 'transverso abdominal'],
    description: 'Curl-up modificado que protege a lombar. Maos sob a lombar, uma perna fletida. SEM flexao lombar.',
    sets: 3, reps: 8, holdSeconds: 8, restBetweenSets: 30, totalMinutes: 5,
    contraindications: ['dor aguda com flexao do tronco'],
    breathingCue: 'Ativa core ao expirar, mantem respirando, relaxa ao descer',
    scienceRef: 'McGill S. Low Back Disorders. 3rd ed.',
    steps: ['Deitado, uma perna fletida, outra esticada', 'Maos sob a lombar (nao achatar!)', 'Levanta cabeca e ombros 5cm — NAO mais', 'Mantem 8 seg, desce lentamente'],
    modifications: { easier: 'abdominal-hollowing', harder: null },
    unlockCriteria: { phase: 2, sessionsCompleted: 0 }
  },
  {
    id: 'side-plank', name: 'Prancha Lateral', nameShort: 'Side Plank',
    phase: 2, category: 'stabilization', difficulty: 3,
    targetMuscles: ['obliquo externo', 'obliquo interno', 'quadrado lombar', 'gluteo medio'],
    description: 'Estabilizacao lateral da coluna. Comeca nos joelhos, progride para pes.',
    sets: 3, reps: 1, holdSeconds: 15, restBetweenSets: 30, totalMinutes: 4,
    contraindications: ['dor lateral aguda'],
    breathingCue: 'Respira normalmente na posicao. Nao prender a respiracao.',
    scienceRef: 'McGill S. Low Back Disorders. 3rd ed.',
    steps: ['De lado, apoio no cotovelo e joelhos', 'Levanta a anca — corpo em linha reta', 'Mantem 15 seg sem deixar a anca cair', 'Repete do outro lado'],
    modifications: { easier: null, harder: null },
    unlockCriteria: { phase: 2, sessionsCompleted: 0 }
  },
  {
    id: 'bird-dog', name: 'Bird-Dog', nameShort: 'Bird-Dog',
    phase: 2, category: 'stabilization', difficulty: 2,
    targetMuscles: ['multifidos', 'extensores lombares', 'gluteo maximo', 'deltoides'],
    description: 'Extensao braco-perna opostos em quadrupedia. Treina estabilidade anti-rotacional.',
    sets: 3, reps: 6, holdSeconds: 8, restBetweenSets: 30, totalMinutes: 5,
    contraindications: ['dor nos punhos'],
    breathingCue: 'Expira ao estender. Inspira ao recolher. Mantem core ativo.',
    scienceRef: 'McGill S. Low Back Disorders. 3rd ed.',
    steps: ['Em quatro apoios, maos sob ombros, joelhos sob ancas', 'Estende braco direito + perna esquerda em linha', 'Mantem 8 seg SEM rodar a anca', 'Volta e repete lado oposto'],
    modifications: { easier: null, harder: 'dynamic-bird-dog' },
    unlockCriteria: { phase: 2, sessionsCompleted: 0 }
  },
  {
    id: 'dead-bug', name: 'Dead Bug', nameShort: 'Dead Bug',
    phase: 2, category: 'stabilization', difficulty: 2,
    targetMuscles: ['transverso abdominal', 'reto abdominal', 'obliquos', 'flexores da anca'],
    description: 'Estabilizacao anti-extensao em supino. Bracos e pernas opostos movem enquanto a lombar fica neutra.',
    sets: 3, reps: 8, holdSeconds: 3, restBetweenSets: 25, totalMinutes: 5,
    contraindications: [],
    breathingCue: 'Expira ao estender braco e perna. Mantem lombar no chao.',
    scienceRef: 'Sahrmann S. Movement System Impairment Syndromes',
    steps: ['Deitado de costas, bracos para o teto, joelhos a 90 graus', 'Estende braco direito atras + perna esquerda a frente', 'Mantem lombar colada ao chao — CRITICO', 'Volta e repete lado oposto'],
    modifications: { easier: 'abdominal-hollowing', harder: null },
    unlockCriteria: { phase: 2, sessionsCompleted: 3 }
  },
  {
    id: 'glute-bridge', name: 'Ponte Glutea', nameShort: 'Glute Bridge',
    phase: 2, category: 'stabilization', difficulty: 2,
    targetMuscles: ['gluteo maximo', 'isquiotibiais', 'multifidos', 'transverso abdominal'],
    description: 'Ativacao dos gluteos com extensao da anca. Essencial para descarregar a lombar.',
    sets: 3, reps: 12, holdSeconds: 5, restBetweenSets: 25, totalMinutes: 5,
    contraindications: [],
    breathingCue: 'Expira ao subir a anca. Aperta gluteos no topo.',
    scienceRef: 'Reiman et al. JOSPT Gluteus Maximus Activation',
    steps: ['Deitado de costas, joelhos fletidos, pes no chao', 'Aperta gluteos e levanta a anca', 'Corpo em linha dos joelhos aos ombros', 'Mantem 5 seg, desce lentamente'],
    modifications: { easier: null, harder: null },
    unlockCriteria: { phase: 2, sessionsCompleted: 3 }
  },
  {
    id: 'front-plank', name: 'Prancha Frontal', nameShort: 'Front Plank',
    phase: 2, category: 'stabilization', difficulty: 3,
    targetMuscles: ['reto abdominal', 'transverso abdominal', 'obliquos', 'extensores lombares'],
    description: 'Prancha frontal nos cotovelos. Mantem coluna neutra — sem lordose nem cifose excessiva.',
    sets: 3, reps: 1, holdSeconds: 20, restBetweenSets: 30, totalMinutes: 4,
    contraindications: ['dor lombar com posicao horizontal prolongada'],
    breathingCue: 'Respira normalmente. Ativa core como se fosses levar um murro no abdomen.',
    scienceRef: 'McGill S. Ultimate Back Fitness and Performance',
    steps: ['Apoio nos cotovelos e pontas dos pes', 'Corpo em linha reta — sem anca alta ou baixa', 'Ativa core e gluteos', 'Mantem 20 seg sem perder a forma'],
    modifications: { easier: 'abdominal-hollowing', harder: null },
    unlockCriteria: { phase: 2, sessionsCompleted: 5 }
  },
  {
    id: 'hamstring-stretch', name: 'Alongamento Isquiotibiais', nameShort: 'Hamstring Stretch',
    phase: 2, category: 'stretch', difficulty: 1,
    targetMuscles: ['isquiotibiais', 'gastrocnemio'],
    description: 'Alongamento suave dos isquiotibiais em supino com toalha. NAO flexionar a lombar.',
    sets: 3, reps: 1, holdSeconds: 30, restBetweenSets: 10, totalMinutes: 3,
    contraindications: ['ciatica aguda com irradiacao abaixo do joelho'],
    breathingCue: 'Inspira profundamente. A cada expiracao, aprofunda ligeiramente o alongamento.',
    scienceRef: 'Page P. Current Concepts in Muscle Stretching for Exercise',
    steps: ['Deitado de costas, coloca toalha no pe', 'Levanta a perna esticada suavemente', 'Para quando sentires tensao (NAO dor)', 'Mantem 30 seg, respira profundamente'],
    modifications: { easier: null, harder: null },
    unlockCriteria: { phase: 2, sessionsCompleted: 3 }
  },
  {
    id: 'cat-cow', name: 'Gato-Vaca', nameShort: 'Cat-Cow',
    phase: 2, category: 'stretch', difficulty: 1,
    targetMuscles: ['extensores lombares', 'abdominais', 'multifidos'],
    description: 'Mobilidade suave da coluna em quadrupedia. Alterna entre flexao e extensao controlada.',
    sets: 3, reps: 8, holdSeconds: 3, restBetweenSets: 15, totalMinutes: 4,
    contraindications: ['dor aguda em flexao lombar — fazer apenas a extensao (vaca)'],
    breathingCue: 'Inspira na extensao (vaca), expira na flexao (gato)',
    scienceRef: 'Liebenson C. Rehabilitation of the Spine',
    steps: ['Em quatro apoios', 'VACA: baixa a barriga, olha para cima (extensao)', 'GATO: arqueia as costas, queixo ao peito (flexao)', 'Movimentos lentos e controlados'],
    modifications: { easier: null, harder: null },
    unlockCriteria: { phase: 2, sessionsCompleted: 0 }
  },

  // ═══ PHASE III — Remodeling (Weeks 6-12): Progressive loading ═══
  {
    id: 'sciatic-tensioner', name: 'Tensionamento Ciatico', nameShort: 'Nerve Tensioner',
    phase: 3, category: 'neural', difficulty: 3,
    targetMuscles: ['nervo ciatico', 'isquiotibiais', 'piriforme'],
    description: 'Mobilizacao neural com tensao controlada. Mais intenso que o slider — so na Fase III.',
    sets: 3, reps: 8, holdSeconds: 5, restBetweenSets: 25, totalMinutes: 4,
    contraindications: ['deficit neurologico', 'dor irradiada intensa'],
    breathingCue: 'Expira ao estender. Para IMEDIATAMENTE se sentires dor aguda.',
    scienceRef: 'PMC 2023 NM Systematic Review',
    steps: ['Deitado, perna ao peito com maos atras do joelho', 'Estende o joelho + dorsiflexao do pe simultaneamente', 'Mantem 5 seg na posicao de tensao moderada', 'Flexiona joelho para aliviar'],
    modifications: { easier: 'sciatic-slider', harder: null },
    unlockCriteria: { phase: 3, sessionsCompleted: 0 }
  },
  {
    id: 'seated-slump-slider', name: 'Slump Sentado', nameShort: 'Slump Slider',
    phase: 3, category: 'neural', difficulty: 3,
    targetMuscles: ['nervo ciatico', 'dura-mater espinal'],
    description: 'Mobilizacao neural em posicao sentada. Combina flexao cervical com extensao do joelho.',
    sets: 3, reps: 8, holdSeconds: 3, restBetweenSets: 25, totalMinutes: 4,
    contraindications: ['deficit neurologico progressivo'],
    breathingCue: 'Movimentos sincronizados com a respiracao. Sem pressa.',
    scienceRef: 'PMC 2025 Slump Position RCT',
    steps: ['Sentado na beira da cadeira, costas curvas', 'Queixo ao peito', 'Estende o joelho lentamente', 'Quando sentir tensao, olha para cima e flexiona o joelho'],
    modifications: { easier: 'sciatic-slider', harder: null },
    unlockCriteria: { phase: 3, sessionsCompleted: 3 }
  },
  {
    id: 'piriformis-stretch', name: 'Alongamento Piriforme', nameShort: 'Piriformis',
    phase: 3, category: 'stretch', difficulty: 2,
    targetMuscles: ['piriforme', 'gluteo medio', 'rotadores externos da anca'],
    description: 'Alongamento do piriforme em posicao de figura-4. Alivia compressao do nervo ciatico.',
    sets: 3, reps: 1, holdSeconds: 30, restBetweenSets: 10, totalMinutes: 3,
    contraindications: ['dor na articulacao da anca'],
    breathingCue: 'Respira profundamente. Aprofunda a cada expiracao.',
    scienceRef: 'Tonley et al. JOSPT Piriformis Syndrome',
    steps: ['Deitado de costas, cruza o tornozelo sobre o joelho oposto (figura 4)', 'Puxa o joelho de baixo em direcao ao peito', 'Deves sentir alongamento no gluteo profundo', 'Mantem 30 seg por lado'],
    modifications: { easier: null, harder: null },
    unlockCriteria: { phase: 3, sessionsCompleted: 3 }
  },
  {
    id: 'hip-flexor-stretch', name: 'Alongamento Flexor da Anca', nameShort: 'Hip Flexor',
    phase: 3, category: 'stretch', difficulty: 2,
    targetMuscles: ['iliopsoas', 'reto femoral', 'tensor da fascia lata'],
    description: 'Alongamento em meio-joelho. Flexores da anca encurtados sao causa comum de dor lombar.',
    sets: 3, reps: 1, holdSeconds: 30, restBetweenSets: 10, totalMinutes: 3,
    contraindications: ['dor no joelho em posicao ajoelhada'],
    breathingCue: 'Empurra a anca para a frente suavemente a cada expiracao.',
    scienceRef: 'Janda V. Muscles and Motor Control in Low Back Pain',
    steps: ['Um joelho no chao, pe da frente apoiado (posicao de cavaleiro)', 'Contrai gluteo do lado de tras', 'Empurra anca para a frente ate sentir alongamento', 'Mantem 30 seg por lado'],
    modifications: { easier: null, harder: null },
    unlockCriteria: { phase: 3, sessionsCompleted: 3 }
  },
  {
    id: 'standing-extension-overpressure', name: 'Extensao com Pressao', nameShort: 'Ext. Overpressure',
    phase: 3, category: 'extension', difficulty: 3,
    targetMuscles: ['extensores lombares', 'multifidos', 'gluteos'],
    description: 'Extensao em pe com pressao adicional das maos. Versao avancada da extensao McKenzie.',
    sets: 3, reps: 10, holdSeconds: 3, restBetweenSets: 30, totalMinutes: 4,
    contraindications: ['estenose espinal', 'dor com extensao'],
    breathingCue: 'Inspira profundamente, expira ao pressionar',
    scienceRef: 'McKenzie R. Treat Your Own Back. 2011',
    steps: ['Em pe, maos na lombar com polegares a apontar para baixo', 'Inclina para tras com forca', 'Pressiona com as maos para mais extensao', 'Mantem 3 seg, volta a posicao neutra'],
    modifications: { easier: 'standing-extension', harder: null },
    unlockCriteria: { phase: 3, sessionsCompleted: 5 }
  },
  {
    id: 'child-pose', name: 'Posicao da Crianca', nameShort: "Child's Pose",
    phase: 3, category: 'stretch', difficulty: 1,
    targetMuscles: ['extensores lombares', 'latissimus dorsi', 'gluteos'],
    description: 'Alongamento suave de toda a cadeia posterior. Posicao de descanso e recuperacao.',
    sets: 1, reps: 1, holdSeconds: 60, restBetweenSets: 0, totalMinutes: 1,
    contraindications: ['dor no joelho em flexao completa'],
    breathingCue: 'Respiracao abdominal profunda. Deixa o corpo afundar.',
    scienceRef: 'Liebenson C. Rehabilitation of the Spine',
    steps: ['Ajoelhado, senta nos calcanhares', 'Estende os bracos para a frente no chao', 'Testa no chao, relaxa completamente', 'Respira profundamente por 60 seg'],
    modifications: { easier: null, harder: null },
    unlockCriteria: { phase: 3, sessionsCompleted: 0 }
  },

  // ═══ PHASE IV — Maintenance (12+ weeks): Autonomy & prevention ═══
  {
    id: 'advanced-mcgill-big3', name: 'McGill Big 3 Avancado', nameShort: 'Adv. Big 3',
    phase: 4, category: 'combination', difficulty: 4,
    targetMuscles: ['core completo', 'gluteos', 'extensores'],
    description: 'Versao avancada do McGill Big 3 com piramide descendente: 8-6-4-2 por exercicio.',
    sets: 4, reps: 8, holdSeconds: 10, restBetweenSets: 20, totalMinutes: 10,
    contraindications: ['dor lombar acima de 4/10'],
    breathingCue: 'Mantem core ativado. Respiracao controlada.',
    scienceRef: 'McGill S. Low Back Disorders. 3rd ed.',
    steps: ['Curl-up modificado: 8-6-4-2 reps (piramide)', 'Side plank: 8-6-4-2 seg cada lado', 'Bird-dog: 8-6-4-2 reps cada lado', 'Descanso 20 seg entre exercicios'],
    modifications: { easier: 'mcgill-curl-up', harder: null },
    unlockCriteria: { phase: 4, sessionsCompleted: 0 }
  },
  {
    id: 'dynamic-bird-dog', name: 'Bird-Dog Dinamico', nameShort: 'Dynamic Bird-Dog',
    phase: 4, category: 'stabilization', difficulty: 4,
    targetMuscles: ['multifidos', 'gluteos', 'core', 'deltoides'],
    description: 'Bird-dog com movimento dinamico e/ou banda elastica. Desafio anti-rotacional avancado.',
    sets: 3, reps: 10, holdSeconds: 3, restBetweenSets: 30, totalMinutes: 5,
    contraindications: ['instabilidade lombar'],
    breathingCue: 'Expira ao estender. Mantem core 100% ativo.',
    scienceRef: 'McGill S. Ultimate Back Fitness and Performance',
    steps: ['Em quatro apoios com banda no pe', 'Estende braco+perna opostos contra a resistencia', 'Mantem 3 seg SEM rodar', 'Toca cotovelo-joelho debaixo do corpo e repete'],
    modifications: { easier: 'bird-dog', harder: null },
    unlockCriteria: { phase: 4, sessionsCompleted: 3 }
  },
  {
    id: 'turkish-getup-partial', name: 'Turkish Get-Up Parcial', nameShort: 'Half TGU',
    phase: 4, category: 'combination', difficulty: 4,
    targetMuscles: ['core completo', 'ombro', 'gluteos', 'quadriceps'],
    description: 'Metade do Turkish Get-Up: de deitado a sentado. Treina estabilidade em multiplos planos.',
    sets: 3, reps: 3, holdSeconds: 5, restBetweenSets: 30, totalMinutes: 5,
    contraindications: ['dor no ombro', 'instabilidade lombar'],
    breathingCue: 'Inspira antes de mover. Expira durante o esforco.',
    scienceRef: 'Liebenson C. Functional Training Handbook',
    steps: ['Deitado de costas, braco direito para o teto (com ou sem peso)', 'Rola para o cotovelo esquerdo', 'Sobe para a mao esquerda (posicao sentado)', 'Mantem 5 seg e volta lentamente'],
    modifications: { easier: 'glute-bridge', harder: null },
    unlockCriteria: { phase: 4, sessionsCompleted: 5 }
  },
  {
    id: 'maintenance-routine', name: 'Rotina de Manutencao 15min', nameShort: 'Full Routine',
    phase: 4, category: 'combination', difficulty: 3,
    targetMuscles: ['core completo', 'cadeia posterior', 'mobilidade geral'],
    description: 'Circuito completo de manutencao: McKenzie + McGill Big 3 + alongamentos. Fazer diariamente para prevencao.',
    sets: 1, reps: 1, holdSeconds: 0, restBetweenSets: 0, totalMinutes: 15,
    contraindications: [],
    breathingCue: 'Segue as indicacoes de cada exercicio individual.',
    scienceRef: 'Programa integrado baseado em McKenzie + McGill + Neural Mob.',
    steps: ['5 min: McKenzie press-up (3x10)', '5 min: McGill Big 3 (piramide 6-4-2)', '3 min: Alongamentos (isquio + piriforme + hip flexor)', '2 min: Cat-cow + child pose para descanso'],
    modifications: { easier: null, harder: null },
    unlockCriteria: { phase: 4, sessionsCompleted: 0 }
  }
];

// ── Phase Definitions ─────────────────────────────────────────

export const PHYSIO_PHASES = [
  {
    id: 1, name: 'Fase Aguda', period: 'Dias 1-14', icon: 'pain',
    color: '#EF4444', bgColor: '#FEF2F2',
    description: 'Foco em aliviar dor e iniciar movimentos suaves. Extensao McKenzie e ativacao TrA.',
    criteria: { minDays: 14, maxPain: 5, sessionsRequired: 10 },
    exerciseIds: ['prone-lying', 'prone-on-elbows', 'mckenzie-press-up', 'standing-extension', 'abdominal-hollowing', 'sciatic-slider']
  },
  {
    id: 2, name: 'Fase Subaguda', period: 'Semanas 2-6', icon: 'phase',
    color: '#F59E0B', bgColor: '#FFFBEB',
    description: 'Estabilizacao do core com McGill Big 3. Introduzir alongamentos suaves.',
    criteria: { minDays: 28, maxPain: 4, sessionsRequired: 15 },
    exerciseIds: ['mcgill-curl-up', 'side-plank', 'bird-dog', 'dead-bug', 'glute-bridge', 'front-plank', 'hamstring-stretch', 'cat-cow']
  },
  {
    id: 3, name: 'Fase Remodelacao', period: 'Semanas 6-12', icon: 'muscle',
    color: '#10B981', bgColor: '#F0FDF4',
    description: 'Carregamento progressivo. Mobilizacao neural avancada e alongamentos profundos.',
    criteria: { minDays: 42, maxPain: 3, sessionsRequired: 20 },
    exerciseIds: ['sciatic-tensioner', 'seated-slump-slider', 'piriformis-stretch', 'hip-flexor-stretch', 'standing-extension-overpressure', 'child-pose']
  },
  {
    id: 4, name: 'Manutencao', period: '12+ semanas', icon: 'sparkle',
    color: '#6366F1', bgColor: '#EEF2FF',
    description: 'Autonomia e prevencao. Rotina diaria completa para manter a coluna saudavel.',
    criteria: null, // Terminal phase
    exerciseIds: ['advanced-mcgill-big3', 'dynamic-bird-dog', 'turkish-getup-partial', 'maintenance-routine']
  }
];

// ── Default Physio State ─────────────────────────────────────

export const DEFAULT_PHYSIO_STATE = {
  currentPhase: 1,
  phaseStartDate: null,
  painLog: [],
  sessions: [],
  exerciseHistory: {},
  dailyProgramDone: false,
  unlockedExercises: ['prone-lying', 'prone-on-elbows', 'mckenzie-press-up', 'standing-extension', 'abdominal-hollowing', 'sciatic-slider'],
  mobilityLog: []
};

// ── Session Engine ───────────────────────────────────────────

let sessionState = {
  status: 'idle', // idle | pain-pre | exercising | resting | pain-post | complete
  exercises: [],
  currentIndex: 0,
  currentSet: 1,
  currentRep: 1,
  holdRemaining: 0,
  restRemaining: 0,
  holdTimer: null,
  restTimer: null,
  painBefore: 5,
  painAfter: 5,
  startTime: null,
  completedExercises: []
};

export function getSessionState() { return sessionState; }

export function getDailyProgram(physioState) {
  const phase = PHYSIO_PHASES.find(p => p.id === physioState.currentPhase) || PHYSIO_PHASES[0];
  return EXERCISES.filter(e => phase.exerciseIds.includes(e.id));
}

export function getDailyDuration(physioState) {
  return getDailyProgram(physioState).reduce((sum, e) => sum + e.totalMinutes, 0);
}

export function startSession(physioState, onUpdate) {
  const program = getDailyProgram(physioState);
  Object.assign(sessionState, {
    status: 'pain-pre',
    exercises: program,
    currentIndex: 0,
    currentSet: 1,
    currentRep: 1,
    holdRemaining: 0,
    restRemaining: 0,
    holdTimer: null,
    restTimer: null,
    painBefore: 5,
    painAfter: 5,
    startTime: Date.now(),
    completedExercises: []
  });
  if (onUpdate) onUpdate();
}

export function setPainBefore(level) { sessionState.painBefore = level; }
export function setPainAfter(level) { sessionState.painAfter = level; }

export function confirmPainPre(onUpdate) {
  sessionState.status = 'exercising';
  if (onUpdate) onUpdate();
}

export function getCurrentExercise() {
  return sessionState.exercises[sessionState.currentIndex] || null;
}

export function startHoldTimer(onTick, onComplete) {
  const ex = getCurrentExercise();
  if (!ex || ex.holdSeconds <= 0) return;
  sessionState.holdRemaining = ex.holdSeconds;
  clearInterval(sessionState.holdTimer);
  sessionState.holdTimer = setInterval(() => {
    sessionState.holdRemaining--;
    if (onTick) onTick(sessionState.holdRemaining);
    if (sessionState.holdRemaining <= 0) {
      clearInterval(sessionState.holdTimer);
      sessionState.holdTimer = null;
      haptic('medium');
      if (onComplete) onComplete();
    }
  }, 1000);
}

export function completeRep(onUpdate) {
  const ex = getCurrentExercise();
  if (!ex) return;

  sessionState.currentRep++;
  if (sessionState.currentRep > ex.reps) {
    sessionState.currentRep = 1;
    sessionState.currentSet++;
    if (sessionState.currentSet > ex.sets) {
      // Exercise complete
      sessionState.completedExercises.push(ex.id);
      haptic('light');
      advanceExercise(onUpdate);
      return;
    }
  }
  if (onUpdate) onUpdate();
}

export function completeSet(onUpdate) {
  const ex = getCurrentExercise();
  if (!ex) return;
  sessionState.currentSet++;
  sessionState.currentRep = 1;
  if (sessionState.currentSet > ex.sets) {
    sessionState.completedExercises.push(ex.id);
    haptic('light');
    advanceExercise(onUpdate);
    return;
  }
  // Start rest between sets
  startRestTimer(ex.restBetweenSets, onUpdate);
}

function startRestTimer(seconds, onUpdate) {
  if (seconds <= 0) { if (onUpdate) onUpdate(); return; }
  sessionState.status = 'resting';
  sessionState.restRemaining = seconds;
  clearInterval(sessionState.restTimer);
  sessionState.restTimer = setInterval(() => {
    sessionState.restRemaining--;
    if (onUpdate) onUpdate();
    if (sessionState.restRemaining <= 0) {
      clearInterval(sessionState.restTimer);
      sessionState.restTimer = null;
      sessionState.status = 'exercising';
      if (onUpdate) onUpdate();
    }
  }, 1000);
}

export function skipRest(onUpdate) {
  clearInterval(sessionState.restTimer);
  sessionState.restTimer = null;
  sessionState.restRemaining = 0;
  sessionState.status = 'exercising';
  if (onUpdate) onUpdate();
}

function advanceExercise(onUpdate) {
  sessionState.currentIndex++;
  sessionState.currentSet = 1;
  sessionState.currentRep = 1;
  if (sessionState.currentIndex >= sessionState.exercises.length) {
    sessionState.status = 'pain-post';
  } else {
    sessionState.status = 'resting';
    startRestTimer(30, onUpdate);
  }
  if (onUpdate) onUpdate();
}

export function skipExercise(onUpdate) {
  advanceExercise(onUpdate);
}

export function confirmPainPost(state, save, onUpdate) {
  const duration = Math.round((Date.now() - sessionState.startTime) / 60000);
  // Record session
  const session = {
    date: new Date().toISOString().split('T')[0],
    exercises: sessionState.completedExercises,
    duration,
    painBefore: sessionState.painBefore,
    painAfter: sessionState.painAfter
  };
  state.physio.sessions.push(session);

  // Record pain
  const dateStr = new Date().toISOString().split('T')[0];
  state.physio.painLog.push(
    { date: dateStr, level: sessionState.painBefore, location: 'lombar-central', context: 'pre-session' },
    { date: dateStr, level: sessionState.painAfter, location: 'lombar-central', context: 'post-session' }
  );

  // Update exercise history
  sessionState.completedExercises.forEach(id => {
    if (!state.physio.exerciseHistory[id]) state.physio.exerciseHistory[id] = { completions: 0 };
    state.physio.exerciseHistory[id].completions++;
    state.physio.exerciseHistory[id].lastDone = dateStr;
  });

  state.physio.dailyProgramDone = true;

  // Set phase start date if first session ever
  if (!state.physio.phaseStartDate) {
    state.physio.phaseStartDate = dateStr;
  }

  sessionState.status = 'complete';
  save();

  launchConfetti(2500);
  haptic('celebration');

  if (onUpdate) onUpdate();
}

export function endSession() {
  clearInterval(sessionState.holdTimer);
  clearInterval(sessionState.restTimer);
  sessionState.status = 'idle';
  sessionState.holdTimer = null;
  sessionState.restTimer = null;
}

// ── Phase Progression ────────────────────────────────────────

export function shouldAdvancePhase(physioState) {
  const phase = PHYSIO_PHASES.find(p => p.id === physioState.currentPhase);
  if (!phase || !phase.criteria) return false;

  const daysSince = physioState.phaseStartDate
    ? Math.floor((Date.now() - new Date(physioState.phaseStartDate).getTime()) / 86400000)
    : 0;

  if (daysSince < phase.criteria.minDays) return false;

  const recentPain = physioState.painLog
    .filter(p => p.context === 'post-session')
    .slice(-5);
  if (recentPain.length < 3) return false;
  const avgPain = recentPain.reduce((s, p) => s + p.level, 0) / recentPain.length;
  if (avgPain > phase.criteria.maxPain) return false;

  const phaseSessions = physioState.sessions.filter(s =>
    new Date(s.date) >= new Date(physioState.phaseStartDate)
  );
  if (phaseSessions.length < phase.criteria.sessionsRequired) return false;

  return true;
}

export function advancePhase(state, save) {
  if (state.physio.currentPhase >= 4) return;
  state.physio.currentPhase++;
  state.physio.phaseStartDate = new Date().toISOString().split('T')[0];
  const newPhase = PHYSIO_PHASES.find(p => p.id === state.physio.currentPhase);
  if (newPhase) {
    state.physio.unlockedExercises.push(...newPhase.exerciseIds);
  }
  save();
  launchConfetti(3000);
  haptic('celebration');
}

// ── Pain Tracking Helpers ────────────────────────────────────

export function getRecentPainData(painLog, days) {
  const now = new Date();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayEntries = painLog.filter(p => p.date === key);
    const pre = dayEntries.find(p => p.context === 'pre-session');
    const post = dayEntries.find(p => p.context === 'post-session');
    result.push({
      date: key,
      label: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][d.getDay()],
      pre: pre ? pre.level : null,
      post: post ? post.level : null,
      isToday: i === 0
    });
  }
  return result;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}
