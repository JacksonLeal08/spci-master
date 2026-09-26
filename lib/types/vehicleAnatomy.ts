export type AcaoSubcomponente = 'SUBSTITUICAO' | 'REPARO' | 'REGULAGEM' | 'REVISAO';
export type PosicaoSubcomponente = 'DIANTEIRO' | 'TRASEIRO' | 'ESQUERDO' | 'DIREITO' | 'COMPLETO';
export type CriticidadeSubcomponente = 'NORMAL' | 'URGENTE' | 'EMERGENCIA';

export interface SubcomponenteCatalogo {
  nome: string;
  criticidadePadrao: CriticidadeSubcomponente;
  permiteTwiCritico?: boolean;
}

export interface SistemaMacro {
  id: string; // Ex: '01_MOTOR'
  numero: string; // '01'
  nome: string; // 'Motor & Sistema de Alimentação'
  icone: string; // Lucide icon identifier
  emoji: string;
  isCriticoGeral?: boolean;
  subcomponentes: SubcomponenteCatalogo[];
}

export interface SubcomponenteSelecionado {
  id: string;
  codigo_sistema: string;
  nome_componente_macro: string;
  nome_subcomponente: string;
  acao: AcaoSubcomponente;
  posicao: PosicaoSubcomponente;
  quantidade: number;
  valor_unitario_estimado: number;
  valor_total_item: number;
  criticidade: CriticidadeSubcomponente;
  twi_critico?: boolean;
  observacao?: string;
  garantia_meses?: number;
  garantia_km?: number;
}

export const CATALOGO_10_SISTEMAS: SistemaMacro[] = [
  {
    id: '01_MOTOR',
    numero: '01',
    nome: 'Motor & Sistema de Alimentação',
    icone: 'Wrench',
    emoji: '🔩',
    subcomponentes: [
      { nome: 'Bloco do Motor, Cabeçote e Junta', criticidadePadrao: 'URGENTE' },
      { nome: 'Kit de Distribuição (Correia Dentada / Corrente e Tensores)', criticidadePadrao: 'URGENTE' },
      { nome: 'Correia de Acessórios (Poly-V) e Polias', criticidadePadrao: 'NORMAL' },
      { nome: 'Bicos Injetores e Bomba de Alta Pressão / Combustível', criticidadePadrao: 'URGENTE' },
      { nome: 'Turbocompressor (Turbina), Intercooler e Mangueiras', criticidadePadrao: 'URGENTE' },
      { nome: 'Kit de Filtros (Óleo, Combustível, Ar e Separador Água/Diesel)', criticidadePadrao: 'NORMAL' },
      { nome: 'Troca de Óleo Lubrificante do Motor e Bujão', criticidadePadrao: 'NORMAL' },
      { nome: 'Sistema de Escape, Válvula EGR, Filtro DPF e Catalisador', criticidadePadrao: 'NORMAL' },
      { nome: 'Coxins de Sustentação do Motor', criticidadePadrao: 'NORMAL' },
    ]
  },
  {
    id: '02_TRANSMISSAO',
    numero: '02',
    nome: 'Caixa de Marchas & Transmissão (Tração 4x2 / 4x4)',
    icone: 'Cog',
    emoji: '⚙️',
    subcomponentes: [
      { nome: 'Caixa de Câmbio (Manual / Automática)', criticidadePadrao: 'URGENTE' },
      { nome: 'Kit de Embreagem Completo (Platô, Disco e Colar/Atuador)', criticidadePadrao: 'URGENTE' },
      { nome: 'Caixa de Transferência e Acionamento 4x4 / Reduzida', criticidadePadrao: 'URGENTE' },
      { nome: 'Eixo Cardan, Cruzetas e Rolamento de Centro', criticidadePadrao: 'URGENTE' },
      { nome: 'Diferencial Dianteiro e/ou Traseiro', criticidadePadrao: 'URGENTE' },
      { nome: 'Semi-eixos, Juntas Homocinéticas, Tulipas e Coifas', criticidadePadrao: 'URGENTE' },
      { nome: 'Substituição de Fluido de Câmbio / Diferencial / Transferência', criticidadePadrao: 'NORMAL' },
    ]
  },
  {
    id: '03_SUSPENSAO',
    numero: '03',
    nome: 'Suspensão Dianteira & Traseira',
    icone: 'Disc',
    emoji: '🛞',
    subcomponentes: [
      { nome: 'Amortecedores Dianteiros (Par)', criticidadePadrao: 'URGENTE' },
      { nome: 'Amortecedores Traseiros (Par)', criticidadePadrao: 'URGENTE' },
      { nome: 'Molas Helicoidais / Feixe de Molas, Grampos e Jumelos', criticidadePadrao: 'NORMAL' },
      { nome: 'Bandejas / Braços Oscilantes (Superiores / Inferiores)', criticidadePadrao: 'NORMAL' },
      { nome: 'Pivôs de Suspensão', criticidadePadrao: 'URGENTE' },
      { nome: 'Bieletas e Buchas da Barra Estabilizadora', criticidadePadrao: 'NORMAL' },
      { nome: 'Kit Batentes, Coifas e Coxins de Amortecedor', criticidadePadrao: 'NORMAL' },
      { nome: 'Cubos de Roda e Rolamentos', criticidadePadrao: 'URGENTE' },
    ]
  },
  {
    id: '04_FREIOS',
    numero: '04',
    nome: 'Sistema de Freios & Controle de Estabilidade (ABS)',
    icone: 'OctagonAlert',
    emoji: '🛑',
    isCriticoGeral: true,
    subcomponentes: [
      { nome: 'Pastilhas de Freio (Dianteiras / Traseiras)', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Discos de Freio (Ventilados / Sólidos)', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Tambores, Lonas (Sapatas) e Cilindros de Roda', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Pinças de Freio (Cavaletes / Êmbolos / Pinos-Guia)', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Cilindro Mestre e Reservatório', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Servo-Freio (Hidrovácuo) e Bomba de Vácuo', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Fluido de Freio (DOT 4 / DOT 5.1) e Sangria', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Flexíveis e Tubulações de Freio', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Cabos e Alavanca do Freio de Estacionamento', criticidadePadrao: 'URGENTE' },
      { nome: 'Sensores de Roda e Módulo Hidráulico ABS/EBD', criticidadePadrao: 'EMERGENCIA' },
    ]
  },
  {
    id: '05_DIRECAO',
    numero: '05',
    nome: 'Sistema de Direção & Geometria',
    icone: 'Compass',
    emoji: '🛞',
    isCriticoGeral: true,
    subcomponentes: [
      { nome: 'Caixa de Direção (Hidráulica, Elétrica ou Mecânica)', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Bomba de Direção Hidráulica, Mangueiras e Fluido', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Terminais de Direção (Ponteiras)', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Barras Axiais', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Coluna de Direção e Cruzeta', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Alinhamento 3D, Cambagem e Cáster', criticidadePadrao: 'NORMAL' },
    ]
  },
  {
    id: '06_ELETRICA',
    numero: '06',
    nome: 'Sistema Elétrico & Eletrônico',
    icone: 'Zap',
    emoji: '⚡',
    subcomponentes: [
      { nome: 'Bateria Principal / Auxiliar Estacionária e Terminais', criticidadePadrao: 'URGENTE' },
      { nome: 'Alternador, Polia e Regulador de Voltagem', criticidadePadrao: 'URGENTE' },
      { nome: 'Motor de Partida (Arranque)', criticidadePadrao: 'URGENTE' },
      { nome: 'Módulo de Injeção (ECU/ECM) e Diagnóstico via Scanner', criticidadePadrao: 'URGENTE' },
      { nome: 'Caixa de Fusíveis, Relés e Chicote Elétrico', criticidadePadrao: 'NORMAL' },
      { nome: 'Iluminação Operacional (Faróis, Milhas, Lanternas, Freio, Ré e Pisca)', criticidadePadrao: 'URGENTE' },
      { nome: 'Painel de Instrumentos (Cluster) e Odômetro', criticidadePadrao: 'NORMAL' },
      { nome: 'Módulo de Telemetria CAN e Rastreador GPS', criticidadePadrao: 'NORMAL' },
    ]
  },
  {
    id: '07_ARREFECIMENTO',
    numero: '07',
    nome: 'Arrefecimento & Climatização (Ar-Condicionado)',
    icone: 'Thermometer',
    emoji: '❄️',
    subcomponentes: [
      { nome: 'Radiador Principal e Tampa de Pressão', criticidadePadrao: 'URGENTE' },
      { nome: 'Bomba d\'Água', criticidadePadrao: 'URGENTE' },
      { nome: 'Válvula Termostática e Carcaça', criticidadePadrao: 'URGENTE' },
      { nome: 'Eletroventilador (Ventoinha) / Polia Viscosa', criticidadePadrao: 'URGENTE' },
      { nome: 'Mangueiras, Reservatório de Expansão e Aditivo', criticidadePadrao: 'NORMAL' },
      { nome: 'Compressor do Ar-Condicionado, Condensador e Carga de Gás', criticidadePadrao: 'URGENTE' },
      { nome: 'Filtro de Cabine e Higienização', criticidadePadrao: 'NORMAL' },
    ]
  },
  {
    id: '08_CARROCERIA',
    numero: '08',
    nome: 'Chassis, Estrutura & Carroceria',
    icone: 'Shield',
    emoji: '🛡️',
    subcomponentes: [
      { nome: 'Longarinas, Travessas do Chassi e Solda Estrutural', criticidadePadrao: 'URGENTE' },
      { nome: 'Para-choques (Dianteiro, Traseiro e Quebra-Mato)', criticidadePadrao: 'NORMAL' },
      { nome: 'Para-brisa, Vidros, Máquinas de Vidro e Palhetas', criticidadePadrao: 'NORMAL' },
      { nome: 'Portas, Fechaduras, Maçanetas e Borrachas de Vedação', criticidadePadrao: 'NORMAL' },
      { nome: 'Retrovisores Externos e Internos', criticidadePadrao: 'NORMAL' },
      { nome: 'Funilaria, Pintura, Plotagem Padrão e Faixas Refletivas', criticidadePadrao: 'NORMAL' },
      { nome: 'Bancos, Estofamento e Cintos de Segurança', criticidadePadrao: 'URGENTE' },
    ]
  },
  {
    id: '09_PNEUS',
    numero: '09',
    nome: 'Rodagem, Pneus & Aros (Integrado à Metrologia TWI)',
    icone: 'CircleDot',
    emoji: '🛞',
    isCriticoGeral: true,
    subcomponentes: [
      { nome: 'Substituição de Pneus (Limite TWI <= 1,60 mm ou Avaria/Corte)', criticidadePadrao: 'EMERGENCIA', permiteTwiCritico: true },
      { nome: 'Balanceamento de Rodas e Rodízio Técnico', criticidadePadrao: 'NORMAL' },
      { nome: 'Reforma/Desempeno de Aros, Prisioneiros e Porcas', criticidadePadrao: 'NORMAL' },
      { nome: 'Válvulas de Calibragem, Sensores TPMS e Fixação do Estepe', criticidadePadrao: 'NORMAL' },
    ]
  },
  {
    id: '10_IMPLEMENTOS',
    numero: '10',
    nome: 'Acessórios Táticos, Resgate & Implementos APH/Incêndio',
    icone: 'Siren',
    emoji: '🚨',
    isCriticoGeral: true,
    subcomponentes: [
      { nome: 'Giroflex (Barra LED), Sirene Eletrônica e Megafone', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Guincho Elétrico (Winch), Cabo e Rolete', criticidadePadrao: 'URGENTE' },
      { nome: 'Snorkel, Estribos Laterais e Gaiola Interna (ROPS)', criticidadePadrao: 'NORMAL' },
      { nome: 'Rádio Comunicador Móvel (VHF/UHF/Tetra) e Antena', criticidadePadrao: 'URGENTE' },
      { nome: 'Inversor de Tensão (12V/220V) e Iluminação de Cena', criticidadePadrao: 'NORMAL' },
      { nome: 'Maca Retrátil, Fixadores e Rede de Oxigênio (Ambulância APH)', criticidadePadrao: 'EMERGENCIA' },
      { nome: 'Bomba de Combate a Incêndio, Tomada de Força (PTO) e Mangotinho', criticidadePadrao: 'EMERGENCIA' },
    ]
  }
];

/**
 * Avalia automaticamente a criticidade e SLA da OS baseada na natureza e subcomponentes flegados
 */
export function avaliarCriticidadeAutomatica(
  natureza: 'PREVENTIVA' | 'CORRETIVA',
  itens: SubcomponenteSelecionado[]
): {
  prioridade: 'NORMAL' | 'URGENTE' | 'EMERGENCIA';
  motivo: string;
  itensCriticos: string[];
} {
  if (itens.length === 0) {
    return {
      prioridade: 'NORMAL',
      motivo: 'Nenhum subcomponente com criticidade especial selecionado.',
      itensCriticos: []
    };
  }

  // Se for PREVENTIVA pura, a prioridade padrão é NORMAL (salvo itens de emergência extrema)
  if (natureza === 'PREVENTIVA') {
    const temEmergencia = itens.filter(i => i.criticidade === 'EMERGENCIA' || i.twi_critico);
    if (temEmergencia.length > 0) {
      return {
        prioridade: 'URGENTE',
        motivo: `Manutenção Preventiva contemplando itens de segurança crítica (${temEmergencia.map(i => i.nome_subcomponente).join(', ')}).`,
        itensCriticos: temEmergencia.map(i => i.nome_subcomponente)
      };
    }
    return {
      prioridade: 'NORMAL',
      motivo: 'Manutenção Preventiva programada / periódica.',
      itensCriticos: []
    };
  }

  // Para Manutenção CORRETIVA:
  // 1. Checa itens de EMERGÊNCIA (Freios, Direção, TWI <= 1.6mm, Giroflex/Sirene, Maca/Oxigênio, Bomba Incêndio)
  const itensEmergencia = itens.filter(i => i.criticidade === 'EMERGENCIA' || i.twi_critico);
  if (itensEmergencia.length > 0) {
    return {
      prioridade: 'EMERGENCIA',
      motivo: `Elevação Automática Obrigatória: falha corretiva em subcomponentes vitais à vida e segurança operacional (${itensEmergencia.map(i => i.nome_subcomponente).join(', ')}). Viatura interditada.`,
      itensCriticos: itensEmergencia.map(i => i.nome_subcomponente)
    };
  }

  // 2. Checa itens de URGÊNCIA (Desgaste funcional acentuado: Embreagem, Amortecedor, Alternador, Bateria, Arrefecimento)
  const itensUrgente = itens.filter(i => i.criticidade === 'URGENTE');
  if (itensUrgente.length > 0) {
    return {
      prioridade: 'URGENTE',
      motivo: `Elevação Automática: desgaste acentuado ou falha funcional crítica (${itensUrgente.map(i => i.nome_subcomponente).join(', ')}). SLA reduzido.`,
      itensCriticos: itensUrgente.map(i => i.nome_subcomponente)
    };
  }

  // 3. Caso padrão
  return {
    prioridade: 'NORMAL',
    motivo: 'Manutenção Corretiva de itens leves ou estéticos.',
    itensCriticos: []
  };
}

/**
 * Formata um resumo legível e compacto dos componentes flegados
 */
export function formatarResumoAnatomico(itens: SubcomponenteSelecionado[]): string {
  if (itens.length === 0) return 'Nenhum componente selecionado';

  // Agrupa por componente macro
  const grupos: { [sistema: string]: string[] } = {};
  itens.forEach(item => {
    if (!grupos[item.nome_componente_macro]) {
      grupos[item.nome_componente_macro] = [];
    }
    const valorFmt = item.valor_total_item > 0 
      ? ` (R$ ${item.valor_total_item.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
      : '';
    const pos = item.posicao !== 'COMPLETO' ? ` [${item.posicao}]` : '';
    grupos[item.nome_componente_macro].push(`${item.nome_subcomponente}${pos}${valorFmt}`);
  });

  return Object.entries(grupos)
    .map(([sistema, subs]) => `• ${sistema}: ${subs.join('; ')}`)
    .join('\n');
}
