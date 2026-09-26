export type TipoVeiculo = 
  | 'CAMINHONETE' 
  | 'AMBULANCIA' 
  | 'CAMINHAO_INCENDIO' 
  | 'UTILITARIO' 
  | 'OUTRO';

export type TipoCombustivel = 
  | 'DIESEL_S10' 
  | 'GASOLINA' 
  | 'ETANOL' 
  | 'FLEX' 
  | 'ELETRICO' 
  | 'HIBRIDO';

export type StatusOperacionalViatura = 
  | 'DISPONIVEL' 
  | 'EM_DESLOCAMENTO' 
  | 'EM_MANUTENCAO_INTERNA' 
  | 'EM_OFICINA_EXTERNA' 
  | 'BAIXADO';

export type PosicaoPneu = 
  | 'DIANTEIRO_ESQUERDO' 
  | 'DIANTEIRO_DIREITO' 
  | 'TRASEIRO_ESQUERDO' 
  | 'TRASEIRO_DIREITO' 
  | 'ESTEPE' 
  | 'TRASEIRO_DUPLO_ESQ_EXT' 
  | 'TRASEIRO_DUPLO_ESQ_INT' 
  | 'TRASEIRO_DUPLO_DIR_EXT' 
  | 'TRASEIRO_DUPLO_DIR_INT';

export type StatusTwi = 
  | 'CONFORME'          // >= 3.0 mm
  | 'ATENCAO'           // 1.7 a 2.9 mm
  | 'CRITICO_PROIBIDO'; // <= 1.6 mm (CONTRAN 558/80)

export type StatusOrdemServico = 
  | 'ABERTA' 
  | 'EM_ORCAMENTO' 
  | 'APROVADA' 
  | 'EM_EXECUCAO' 
  | 'EM_ANDAMENTO' 
  | 'AGUARDANDO_PECAS' 
  | 'CONCLUIDA' 
  | 'CANCELADA'
  | 'REJEITADA';

export type NaturezaManutencao = 
  | 'PREVENTIVA' 
  | 'CORRETIVA' 
  | 'EMERGENCIAL';

export type TipoOrdemServico = 
  | 'INTERNA' 
  | 'EXTERNA';

export interface Viatura {
  id: string;
  contrato_id: string;
  prefixo_frota: string;
  placa: string;
  chassi?: string | null;
  renavam?: string | null;
  tipo_veiculo: TipoVeiculo;
  marca: string;
  modelo: string;
  marca_modelo_crlv?: string | null;
  modelo_plano_chave?: string | null;
  ano_fabricacao?: number | null;
  tipo_combustivel: TipoCombustivel;
  odometro_atual_km: number;
  status_operacional: StatusOperacionalViatura;
  vencimento_crlv?: string | null;
  seguradora?: string | null;
  apolice_seguro?: string | null;
  vencimento_seguro?: string | null;
  validade_garantia_data?: string | null;
  limite_garantia_km?: number | null;
  foto_veiculo_url?: string | null;
  foto_documento_url?: string | null;
  data_ultima_calibracao?: string | null;
  data_ultima_preventiva?: string | null;
  odometro_ultima_preventiva_km?: number | null;
  km_ultima_preventiva?: number | null;
  intervalo_revisao_km?: number | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;

  // Campos calculados / agregados
  qtd_pneus_criticos_twi?: number;
  status_crlv?: 'CRLV_REGULAR' | 'CRLV_A_VENCER' | 'CRLV_VENCIDO';
  status_seguro?: 'SEGURO_REGULAR' | 'SEGURO_A_VENCER' | 'SEGURO_VENCIDO';
  ultimo_km_litro?: number | null;
  ultimo_abastecimento_discrepante?: boolean;
  dias_desde_calibracao?: number;
  calibracao_vencida?: boolean;
}

export interface OficinaPrestador {
  id: string;
  contrato_id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  especialidades: string[];
  responsavel?: string | null;
  contato_responsavel?: string | null;
  telefone?: string | null;
  telefone_plantao?: string | null;
  contato_emergencia?: string | null;
  email?: string | null;
  endereco?: string | null;
  ativo?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ItemChecklistOs {
  id: string;
  descricao: string;
  concluido: boolean;
  observacao?: string;
}

export interface NotaFiscalAnexo {
  id: string;
  tipo: 'SERVICO' | 'PECA' | 'PNEU' | 'GERAL';
  numero_nf: string;
  valor: number;
  url: string;
  nome_arquivo: string;
  data_upload?: string;
}

export interface DocumentoAnexo {
  id: string;
  tipo: 'ORCAMENTO' | 'LAUDO' | 'OUTRO';
  titulo: string;
  valor_estimado?: number;
  url: string;
  nome_arquivo: string;
  data_upload?: string;
}

export interface OrcamentoConcorrente {
  id?: string;
  oficina_nome: string;
  oficina_cnpj?: string;
  telefone?: string;
  valor_total: number;
  prazo_dias?: number;
  data_prometida?: string;
  previsao_entrega?: string;
  condicoes_pagamento?: string;
  garantia_meses?: number;
  garantia_km?: number;
  selecionada: boolean;
  observacao?: string;
}

export interface OrcamentoAditivo {
  id?: string;
  numero_aditivo?: number;
  data?: string;
  data_solicitacao?: string;
  motivo: string;
  descricao?: string;
  valor_aditivo?: number;
  valor?: number;
  prazo_adicional_dias?: number;
  aprovado_por?: string;
  data_aprovacao?: string;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'SOLICITADO';
  comprovante_url?: string;
}

export interface OrdemServicoFrota {
  id: string;
  contrato_id: string;
  numero_os: string;
  viatura_id: string;
  oficina_id?: string | null;
  tipo_os: TipoOrdemServico;
  natureza_manutencao: NaturezaManutencao;
  odometro_km: number;
  descricao_servico: string;
  custo_pecas: number;
  custo_mao_de_obra: number;
  custo_pneus?: number;
  custo_total?: number;
  status: StatusOrdemServico;
  itens_checklist: ItemChecklistOs[];
  romaneio_pdf_url?: string | null;
  responsavel_abertura?: string | null;
  data_abertura: string;
  data_conclusao?: string | null;
  data_aprovacao?: string | null;
  responsavel_aprovacao?: string | null;
  created_at?: string;
  updated_at?: string;

  // Campos de compatibilidade para Histórico Completo de Manutenções & Rateio
  tipo_manutencao?: 'PREVENTIVA' | 'CORRETIVA';
  origem_execucao?: 'INTERNA_BRIGADA' | 'EXTERNA_CREDENCIADA';
  descricao_motivo?: string;
  servicos_executados?: string;
  pecas_substituidas_json?: Array<{ peca: string; quantidade: number; valor_unitario?: number }>;
  comprovantes_urls?: string[];
  orcamentos_json?: DocumentoAnexo[];
  notas_fiscais_json?: NotaFiscalAnexo[];
  status_os?: 'ABERTA' | 'EM_ORCAMENTO' | 'APROVADA' | 'EM_EXECUCAO' | 'CONCLUIDA' | 'CANCELADA' | string;

  // Campos do Motor de Workflow e Matriz de Aprovadores
  prioridade?: 'NORMAL' | 'URGENTE' | 'EMERGENCIA';
  etapa_atual?: string; // '1_ABERTURA_TRIAGEM' ... '6_CONCLUIDA_LIBERADA'
  numero_etapa?: number; // 1 a 6
  valor_estimado?: number;
  aprovador_imediato_id?: string | null;
  status_aprovacao?: 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'EM_REVISAO';
  origem_abertura?: 'MANUAL' | 'CHECKLIST_8_SISTEMAS' | 'LAUDO_TWI_PNEUS' | string;
  resumo_anatomico?: string | null;
  itens_componentes_json?: any[];

  // Prazos, Garantias, Recusa e Cotações / Aditivos
  previsao_conclusao?: string | null;
  garantia_meses?: number | null;
  garantia_km?: number | null;
  motivo_recusa?: string | null;
  data_recusa?: string | null;
  responsavel_recusa?: string | null;
  orcamentos_concorrentes_json?: OrcamentoConcorrente[];
  orcamentos_aditivos_json?: OrcamentoAditivo[];

  // Relações em tempo de execução
  viatura?: Viatura;
  oficina?: OficinaPrestador;
  aprovador_imediato?: any;
}

export interface Abastecimento {
  id: string;
  contrato_id: string;
  viatura_id: string;
  data_hora: string;
  posto: string;
  nome_posto?: string;
  tipo_combustivel: TipoCombustivel | string;
  litros: number;
  valor_litro: number;
  valor_total: number;
  odometro_km: number;
  km_registro?: number;
  condutor_nome: string;
  motorista_nome?: string;
  km_rodados?: number | null;
  km_por_litro?: number | null;
  is_discrepante?: boolean;
  motivo_discrepancia?: string | null;
  comprovante_foto_url?: string | null;
  foto_cupom_url?: string | null;
  
  // Georreferenciamento e Telemetria
  latitude_posto?: number;
  longitude_posto?: number;
  variacao_preco_litro?: number | null;
  percentual_variacao?: number | null;
  houve_calibracao_pneus?: boolean;
  foto_calibracao_url?: string | null;
  created_at?: string;

  // Relação opcional
  viatura?: Viatura;
}

export interface ViaturaTrackingTelemetry {
  id: string;
  viatura_id: string;
  placa: string;
  prefixo: string;
  tipo_veiculo: TipoVeiculo;
  empresa: string;
  velocidade_kmh: number;
  status_movimento: 'ralenti' | 'em_transito' | 'desligado';
  heading_graus: number; // 0 - 360 graus
  latitude: number;
  longitude: number;
  odometro_km: number;
  foto_veiculo_url?: string | null;
  ultima_atualizacao: string;
}

export interface RankingPostoInfo {
  nome_posto: string;
  tipo_combustivel: string;
  preco_medio: number;
  menor_preco: number;
  maior_preco: number;
  total_abastecimentos: number;
  percentual_economia?: number;
  latitude?: number;
  longitude?: number;
}

export interface InspecaoPneu {
  id: string;
  contrato_id: string;
  viatura_id: string;
  data_hora: string;
  posicao_pneu: PosicaoPneu;
  sulco_mm: number;
  pressao_psi: number;
  status_twi: StatusTwi;
  precisa_rodizio: boolean;
  marca_pneu?: string | null;
  dot_pneu?: string | null;
  observacoes?: string | null;
  inspetor_nome: string;
  created_at?: string;
}

// ==============================================================================
// METROLOGIA E GESTÃO DE RODAGEM VEICULAR (CONTRAN 558/80)
// ==============================================================================

export type PosicaoPneuAbreviada = 'DE' | 'DD' | 'TE' | 'TD' | 'ESTEPE';
export type TipoTerrenoPneu = 'HT' | 'AT' | 'RT' | 'MT';

export interface CatalogoPneuReferencia {
  id: string;
  marca: string;
  modelo: string;
  medida: string;
  profundidade_original_mm: number; // S_orig nominal de fábrica
  pressao_recomendada_psi: number;
  tipo_terreno?: TipoTerrenoPneu;
  created_at?: string;
}

export interface ItemAfericaoPneu {
  id?: string;
  inspecao_id?: string;
  posicao_pneu: PosicaoPneuAbreviada; // 'DE' | 'DD' | 'TE' | 'TD' | 'ESTEPE'
  pneu_referencia_id?: string | null;
  marca?: string;
  modelo?: string;
  medida?: string;
  profundidade_original_mm: number; // S_orig
  profundidade_sulco_mm: number;    // S_aferido
  desgaste_acumulado_mm: number;    // Delta_desgaste
  percentual_vida_util: number;     // % V_util
  pressao_psi: number;
  status_twi: StatusTwi;
  foto_medicao_url?: string | null;
  created_at?: string;
}

export interface InspecaoRodagemPneus {
  id: string;
  contrato_id: string;
  viatura_id: string;
  data_hora: string;
  odometro_km: number;
  status_geral_twi: StatusTwi;
  houve_calibracao: boolean;
  tecnico_nome: string;
  observacoes_gerais?: string | null;
  created_at?: string;
  itens?: ItemAfericaoPneu[];
  viatura?: Viatura;
}

export interface CalculoDesgasteMetrologico {
  sOrig: number;
  sAferido: number;
  bUtilTotal: number;
  deltaDesgaste: number;
  percentualDesgasteConsumido: number;
  saldoBorrachaRestante: number;
  percentualVidaUtil: number;
  statusTwi: StatusTwi;
  demonstrativoEquacao: string;
  taxaDesgasteMmPorKm?: number | null;
  kmProjetadoTwi?: number | null;
}

export interface FrotaKpisSummary {
  totalViaturas: number;
  disponiveis: number;
  emDeslocamento: number;
  emManutencao: number; // Interna + Externa
  pneusCriticosTwi: number;
  abastecimentosSuspeitos: number;
  crlvAVencerOuVencido: number;
  segurosAVencerOuVencido: number;
}

/**
 * Classifica a medição do pneu segundo a Resolução CONTRAN nº 558/80
 */
export function classificarSulcoTwi(sulcoMm: number): StatusTwi {
  if (sulcoMm <= 1.6) {
    return 'CRITICO_PROIBIDO';
  }
  if (sulcoMm < 3.0) {
    return 'ATENCAO';
  }
  return 'CONFORME';
}

// ==============================================================================
// 6. CHECKLIST TÉCNICO AUTOMOTIVO & DUAL-PHOTO EVIDENCE
// ==============================================================================

export type ParecerChecklist = 'CONFORME' | 'NAO_CONFORME' | 'NA';
export type GravidadeAnomalia = 'LEVE' | 'MEDIA' | 'CRITICA';
export type StatusAprovacaoChecklist = 'APROVADO' | 'ATENCAO' | 'INTERDITADO';

export type SistemaGrupoChecklist = 
  | 'FREIOS' 
  | 'SUSPENSAO' 
  | 'MOTOR_CAMBIO' 
  | 'ELETRICA' 
  | 'ILUMINACAO' 
  | 'PNEUS' 
  | 'EQUIPAMENTOS' 
  | 'IMPLEMENTOS_ESPECIFICOS';

export interface ChecklistItemAvaliacao {
  id?: string;
  checklist_id?: string;
  sistema_grupo: SistemaGrupoChecklist;
  item_nome: string;
  parecer: ParecerChecklist;
  gravidade_anomalia?: GravidadeAnomalia | null;
  observacao_anomalia?: string | null;
  foto_evidencia_1_url?: string | null; // Foto 1: Visão Geral / Contexto da Avaria
  foto_evidencia_2_url?: string | null; // Foto 2: Detalhe / Macro da Avaria
  created_at?: string;
}

export interface ChecklistVeicular {
  id?: string;
  contrato_id: string;
  viatura_id: string;
  viatura?: Viatura;
  tecnico_nome: string;
  tipo_checklist?: string;
  odometro_km: number;
  horimetro?: number | null;
  status_aprovacao: StatusAprovacaoChecklist;
  percentual_conformidade: number;
  total_itens: number;
  total_conformes: number;
  total_nao_conformes: number;
  latitude?: number | null;
  longitude?: number | null;
  ordem_servico_gerada_id?: string | null;
  observacoes_gerais?: string | null;
  itens?: ChecklistItemAvaliacao[];
  created_at?: string;
  updated_at?: string;
}
