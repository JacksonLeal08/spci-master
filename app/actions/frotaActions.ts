'use server';

import { createClient } from '@supabase/supabase-js';
import { 
  Viatura, 
  Abastecimento, 
  InspecaoPneu, 
  OrdemServicoFrota, 
  OficinaPrestador, 
  FrotaKpisSummary,
  classificarSulcoTwi,
  RankingPostoInfo,
  ViaturaTrackingTelemetry,
  ChecklistVeicular,
  ChecklistItemAvaliacao
} from '@/lib/types/frota';
import { FuelAuditService } from '@/lib/fuelAuditService';
import { FuelPricingService } from '@/lib/services/FuelPricingService';
import { FleetTrackingAdapter } from '@/lib/adapters/FleetTrackingAdapter';

const getSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Configuração ausente: NEXT_PUBLIC_SUPABASE_URL ou credenciais do Supabase não configuradas no servidor.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// ==============================================================================
// 1. VIATURAS
// ==============================================================================

export async function listViaturasAction(contratoId?: string): Promise<{ success: boolean; data?: Viatura[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from('vw_viaturas_cockpit').select('*').order('prefixo_frota', { ascending: true });

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback para tabela direta caso a view ainda não tenha sido executada
      const fallbackQuery = supabase.from('viaturas').select('*').order('prefixo_frota', { ascending: true });
      if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
        fallbackQuery.eq('contrato_id', contratoId);
      }
      const fallbackRes = await fallbackQuery;
      if (fallbackRes.error) throw fallbackRes.error;
      return { success: true, data: fallbackRes.data as Viatura[] };
    }

    return { success: true, data: (data || []) as Viatura[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar viaturas:', err);
    return { success: false, error: err?.message || 'Erro ao carregar lista de viaturas' };
  }
}

export async function saveViaturaAction(viatura: Partial<Viatura>): Promise<{ success: boolean; data?: Viatura; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    
    const kmPrev = viatura.km_ultima_preventiva !== undefined && viatura.km_ultima_preventiva !== null
      ? Number(viatura.km_ultima_preventiva)
      : (viatura.odometro_ultima_preventiva_km !== undefined && viatura.odometro_ultima_preventiva_km !== null
          ? Number(viatura.odometro_ultima_preventiva_km)
          : null);

    const intervalo = viatura.intervalo_revisao_km ? Number(viatura.intervalo_revisao_km) : 10000;

    const payload = {
      ...viatura,
      prefixo_frota: viatura.prefixo_frota?.trim().toUpperCase(),
      placa: viatura.placa?.trim().toUpperCase(),
      contrato_id: viatura.contrato_id || 'ONÇA PUMA',
      data_ultima_preventiva: viatura.data_ultima_preventiva || null,
      km_ultima_preventiva: kmPrev,
      odometro_ultima_preventiva_km: kmPrev,
      intervalo_revisao_km: intervalo
    };

    const { data, error } = await supabase
      .from('viaturas')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, data: data as Viatura };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar viatura:', err);
    return { success: false, error: err?.message || 'Falha ao salvar dados da viatura' };
  }
}

export async function updateViaturaFotoAction(viaturaId: string, fotoUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from('viaturas')
      .update({ foto_veiculo_url: fotoUrl })
      .eq('id', viaturaId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao atualizar foto da viatura:', err);
    return { success: false, error: err?.message || 'Falha ao salvar foto da viatura' };
  }
}

// ==============================================================================
// 2. ABASTECIMENTOS & AUDITORIA
// ==============================================================================

export async function listAbastecimentosAction(viaturaId?: string, contratoId?: string): Promise<{ success: boolean; data?: Abastecimento[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from('abastecimentos')
      .select(`
        *,
        viatura:viaturas (
          id,
          prefixo_frota,
          placa,
          tipo_veiculo
        )
      `)
      .order('data_hora', { ascending: false });

    if (viaturaId) {
      query = query.eq('viatura_id', viaturaId);
    }
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback em caso de erro no join
      console.warn('[frotaActions] Fallback query abastecimentos sem join:', error);
      const fallbackQuery = supabase.from('abastecimentos').select('*').order('data_hora', { ascending: false });
      if (viaturaId) fallbackQuery.eq('viatura_id', viaturaId);
      if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') fallbackQuery.eq('contrato_id', contratoId);
      const fbRes = await fallbackQuery;
      if (fbRes.error) throw fbRes.error;
      return { success: true, data: (fbRes.data || []) as Abastecimento[] };
    }
    return { success: true, data: (data || []) as Abastecimento[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar abastecimentos:', err);
    return { success: false, error: err?.message || 'Erro ao carregar abastecimentos' };
  }
}

export async function saveAbastecimentoAction(
  abastecimento: Partial<Abastecimento>, 
  tipoVeiculo: any = 'CAMINHONETE'
): Promise<{ success: boolean; data?: Abastecimento; error?: string }> {
  return registrarAbastecimentoAction(abastecimento, tipoVeiculo);
}

export async function registrarAbastecimentoAction(
  abastecimento: Partial<Abastecimento>, 
  tipoVeiculo: any = 'CAMINHONETE'
): Promise<{ success: boolean; data?: Abastecimento; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    if (!abastecimento.viatura_id) {
      throw new Error('Viatura ID é obrigatório para registrar abastecimento.');
    }

    // 1. Busca dados da viatura para validar trava de 15 dias de pneus e odômetro
    const { data: vtr } = await supabase
      .from('viaturas')
      .select('id, data_ultima_calibracao, contrato_id, odometro_atual_km, tipo_veiculo')
      .eq('id', abastecimento.viatura_id)
      .single();

    const veiculoTipoFinal = vtr?.tipo_veiculo || tipoVeiculo || 'CAMINHONETE';

    // 2. Trava de 15 Dias de Calibração de Pneus
    const statusCalibracao = FuelPricingService.validarCalibracaoPneus(vtr?.data_ultima_calibracao);
    if (statusCalibracao.bloqueioObrigatorio && !abastecimento.houve_calibracao_pneus) {
      return {
        success: false,
        error: statusCalibracao.mensagem
      };
    }

    if (abastecimento.houve_calibracao_pneus && !abastecimento.foto_calibracao_url) {
      return {
        success: false,
        error: 'É obrigatório anexar a foto do manômetro/calibrador para validar o registro de calibragem.'
      };
    }

    // 3. Busca o último abastecimento para calcular autonomia
    const { data: ultimos } = await supabase
      .from('abastecimentos')
      .select('odometro_km')
      .eq('viatura_id', abastecimento.viatura_id)
      .order('data_hora', { ascending: false })
      .limit(1);

    const odometroAnterior = ultimos && ultimos.length > 0 ? Number(ultimos[0].odometro_km) : null;

    // 4. Busca último abastecimento do mesmo combustível para calcular Delta Valor e % Variação
    let queryPreco = supabase
      .from('abastecimentos')
      .select('valor_litro')
      .eq('tipo_combustivel', abastecimento.tipo_combustivel || 'DIESEL_S10')
      .order('data_hora', { ascending: false })
      .limit(1);

    if (abastecimento.contrato_id && abastecimento.contrato_id !== 'TODOS' && abastecimento.contrato_id !== 'GLOBAL') {
      queryPreco = queryPreco.eq('contrato_id', abastecimento.contrato_id);
    }

    const { data: ultPrecoData } = await queryPreco;
    const ultimoValorLitro = ultPrecoData && ultPrecoData.length > 0 ? Number(ultPrecoData[0].valor_litro) : null;
    const variacaoPreco = FuelPricingService.calcularVariacaoPreco(
      Number(abastecimento.valor_litro || 0),
      ultimoValorLitro
    );

    // 5. Executa auditoria antifraude de consumo
    const analise = FuelAuditService.analyze({
      odometroAtualKm: Number(abastecimento.odometro_km || 0),
      odometroAnteriorKm: odometroAnterior,
      litros: Number(abastecimento.litros || 0),
      tipoVeiculo: veiculoTipoFinal,
      tipoCombustivel: abastecimento.tipo_combustivel
    });

    const motoristaFinal = abastecimento.motorista_nome || abastecimento.condutor_nome || 'Condutor Operacional';

    const dbPayload = {
      contrato_id: abastecimento.contrato_id || vtr?.contrato_id || 'ONÇA PUMA',
      viatura_id: abastecimento.viatura_id,
      data_hora: abastecimento.data_hora || new Date().toISOString(),
      posto: (abastecimento.nome_posto || abastecimento.posto || 'Posto Convencionado').trim(),
      nome_posto: (abastecimento.nome_posto || abastecimento.posto || 'Posto Convencionado').trim(),
      tipo_combustivel: abastecimento.tipo_combustivel || 'DIESEL_S10',
      litros: Number(abastecimento.litros || 0),
      valor_litro: Number(abastecimento.valor_litro || 0),
      valor_total: Number(abastecimento.valor_total || 0),
      odometro_km: Number(abastecimento.odometro_km || 0),
      condutor_nome: motoristaFinal,
      motorista_nome: motoristaFinal,
      variacao_preco_litro: variacaoPreco.deltaValor,
      percentual_variacao: variacaoPreco.percentualVariacao,
      km_rodados: analise.kmRodados,
      km_por_litro: analise.kmPorLitro,
      is_discrepante: analise.isDiscrepante,
      motivo_discrepancia: analise.motivoDiscrepancia,
      houve_calibracao_pneus: Boolean(abastecimento.houve_calibracao_pneus),
      foto_calibracao_url: abastecimento.foto_calibracao_url || null,
      foto_cupom_url: abastecimento.foto_cupom_url || abastecimento.comprovante_foto_url || null,
      comprovante_foto_url: abastecimento.comprovante_foto_url || abastecimento.foto_cupom_url || null,
      latitude_posto: abastecimento.latitude_posto ? Number(abastecimento.latitude_posto) : null,
      longitude_posto: abastecimento.longitude_posto ? Number(abastecimento.longitude_posto) : null
    };

    const { data, error } = await supabase
      .from('abastecimentos')
      .insert(dbPayload)
      .select('*')
      .single();

    if (error) throw error;

    // 6. Atualiza viatura: odômetro e calibragem se aplicável
    const updatesViatura: Record<string, any> = {};
    if (abastecimento.odometro_km && (!vtr?.odometro_atual_km || abastecimento.odometro_km > vtr.odometro_atual_km)) {
      updatesViatura.odometro_atual_km = abastecimento.odometro_km;
    }
    if (abastecimento.houve_calibracao_pneus) {
      updatesViatura.data_ultima_calibracao = abastecimento.data_hora || new Date().toISOString();
    }

    if (Object.keys(updatesViatura).length > 0) {
      await supabase
        .from('viaturas')
        .update(updatesViatura)
        .eq('id', abastecimento.viatura_id);
    }

    return { success: true, data: data as Abastecimento };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar abastecimento:', err);
    return { success: false, error: err?.message || 'Falha ao registrar abastecimento' };
  }
}

export async function getRankingPostosAction(
  contratoId?: string, 
  tipoCombustivel?: string
): Promise<{ success: boolean; data?: RankingPostoInfo[]; postoMaisEconomico?: RankingPostoInfo | null; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from('abastecimentos').select('*').order('data_hora', { ascending: false }).limit(200);

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const res = FuelPricingService.getPostoMaisEconomico(data || [], tipoCombustivel);
    return { success: true, data: res.ranking, postoMaisEconomico: res.postoMaisEconomico };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao calcular ranking de postos:', err);
    return { success: false, error: err?.message || 'Falha ao obter ranking de postos' };
  }
}

// ==============================================================================
// 3. INSPEÇÃO DE PNEUS (TWI CONTRAN 558/80)
// ==============================================================================

export async function listInspecoesPneusAction(viaturaId?: string, contratoId?: string): Promise<{ success: boolean; data?: InspecaoPneu[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from('inspecoes_pneus').select('*').order('data_hora', { ascending: false });

    if (viaturaId) {
      query = query.eq('viatura_id', viaturaId);
    }
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: (data || []) as InspecaoPneu[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar inspeções de pneus:', err);
    return { success: false, error: err?.message || 'Erro ao carregar medições de pneus' };
  }
}

export async function saveInspecaoPneuAction(inspecao: Partial<InspecaoPneu>): Promise<{ success: boolean; data?: InspecaoPneu; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const sulco = Number(inspecao.sulco_mm || 0);
    const statusTwi = classificarSulcoTwi(sulco);

    const payload = {
      ...inspecao,
      sulco_mm: sulco,
      status_twi: statusTwi
    };

    const { data, error } = await supabase
      .from('inspecoes_pneus')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, data: data as InspecaoPneu };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar inspeção de pneu:', err);
    return { success: false, error: err?.message || 'Falha ao gravar inspeção de pneu' };
  }
}

// ==============================================================================
// 4. ORDENS DE SERVIÇO & OFICINAS
// ==============================================================================

export async function listOrdensServicoAction(
  contratoId?: string,
  viaturaId?: string
): Promise<{ success: boolean; data?: OrdemServicoFrota[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from('ordens_servico_frota')
      .select('*, viatura:viaturas(*), oficina:oficinas_prestadores(*)')
      .order('data_abertura', { ascending: false });

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    if (viaturaId) {
      query = query.eq('viatura_id', viaturaId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Normaliza campos para interoperabilidade
    const normalized = (data || []).map((os: any) => {
      const cPecas = Number(os.custo_pecas || 0);
      const cMao = Number(os.custo_mao_de_obra || 0);
      const cPneus = Number(os.custo_pneus || 0);
      const cTotal = Number(os.custo_total || (cPecas + cMao + cPneus));
      return {
        ...os,
        tipo_manutencao: os.tipo_manutencao || os.natureza_manutencao || 'PREVENTIVA',
        natureza_manutencao: os.natureza_manutencao || os.tipo_manutencao || 'PREVENTIVA',
        origem_execucao: os.origem_execucao || (os.tipo_os === 'EXTERNA' ? 'EXTERNA_CREDENCIADA' : 'INTERNA_BRIGADA'),
        tipo_os: os.tipo_os || (os.origem_execucao === 'EXTERNA_CREDENCIADA' ? 'EXTERNA' : 'INTERNA'),
        descricao_motivo: os.descricao_motivo || os.descricao_servico || '',
        descricao_servico: os.descricao_servico || os.descricao_motivo || '',
        status_os: os.status_os || os.status || 'ABERTA',
        status: os.status || os.status_os || 'ABERTA',
        custo_pecas: cPecas,
        custo_mao_de_obra: cMao,
        custo_pneus: cPneus,
        custo_total: cTotal,
        orcamentos_json: Array.isArray(os.orcamentos_json) ? os.orcamentos_json : [],
        notas_fiscais_json: Array.isArray(os.notas_fiscais_json) ? os.notas_fiscais_json : []
      };
    });

    return { success: true, data: normalized as OrdemServicoFrota[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar ordens de serviço:', err);
    return { success: false, error: err?.message || 'Erro ao carregar ordens de serviço' };
  }
}

export async function saveOrdemServicoAction(os: Partial<OrdemServicoFrota>): Promise<{ success: boolean; data?: OrdemServicoFrota; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    
    // Normaliza status e valores
    const statusFinal = os.status_os || os.status || 'ABERTA';
    const prioridadeFinal = os.prioridade || 'NORMAL';
    const custoPecas = Number(os.custo_pecas || 0);
    const custoMaoDeObra = Number(os.custo_mao_de_obra || 0);
    const custoPneus = Number(os.custo_pneus || 0);
    const custoTotal = Number(os.custo_total || os.valor_estimado || (custoPecas + custoMaoDeObra + custoPneus));

    const payload = {
      ...os,
      numero_os: os.numero_os || `OS-${Date.now().toString().slice(-6)}`,
      contrato_id: os.contrato_id || 'ONÇA PUMA',
      status: statusFinal,
      status_os: statusFinal,
      prioridade: prioridadeFinal,
      tipo_manutencao: os.tipo_manutencao || os.natureza_manutencao || 'CORRETIVA',
      custo_pecas: custoPecas,
      custo_mao_de_obra: custoMaoDeObra,
      custo_pneus: custoPneus,
      custo_total: custoTotal,
      valor_estimado: os.valor_estimado || custoTotal,
      resumo_anatomico: os.resumo_anatomico || null,
      itens_componentes_json: os.itens_componentes_json || [],
      orcamentos_json: os.orcamentos_json || [],
      notas_fiscais_json: os.notas_fiscais_json || [],
      data_abertura: os.data_abertura || new Date().toISOString(),
      data_conclusao: (statusFinal === 'CONCLUIDA' && !os.data_conclusao) ? new Date().toISOString() : os.data_conclusao,
      previsao_conclusao: os.previsao_conclusao || null,
      garantia_meses: os.garantia_meses !== undefined ? os.garantia_meses : 3,
      garantia_km: os.garantia_km || null,
      motivo_recusa: os.motivo_recusa || null,
      data_recusa: (statusFinal === 'REJEITADA' && !os.data_recusa) ? new Date().toISOString() : os.data_recusa,
      responsavel_recusa: os.responsavel_recusa || null,
      orcamentos_concorrentes_json: os.orcamentos_concorrentes_json || [],
      orcamentos_aditivos_json: os.orcamentos_aditivos_json || []
    };

    const { data, error } = await supabase
      .from('ordens_servico_frota')
      .upsert(payload)
      .select('*, viatura:viaturas(*), oficina:oficinas_prestadores(*)')
      .single();

    if (error) throw error;

    // Se itens de subcomponentes foram fornecidos, persiste na tabela relacional de itens de componentes
    if (data?.id && os.itens_componentes_json && Array.isArray(os.itens_componentes_json) && os.itens_componentes_json.length > 0) {
      try {
        const itensToInsert = os.itens_componentes_json.map((item: any) => ({
          os_id: data.id,
          codigo_sistema: item.codigo_sistema || '01_MOTOR',
          nome_componente_macro: item.nome_componente_macro || '',
          nome_subcomponente: item.nome_subcomponente || '',
          acao_requerida: item.acao || 'SUBSTITUICAO',
          posicao_eixo: item.posicao || 'COMPLETO',
          quantidade: item.quantidade || 1,
          valor_unitario_estimado: item.valor_unitario_estimado || 0,
          observacao_tecnica: item.observacao || null
        }));

        // Limpa itens antigos desta OS e insere os novos
        await supabase.from('os_itens_componentes').delete().eq('os_id', data.id);
        await supabase.from('os_itens_componentes').insert(itensToInsert);
      } catch (errItens) {
        console.warn('[frotaActions] Aviso: tabela os_itens_componentes pode requerer migração:', errItens);
      }
    }

    // Atualiza status da viatura conforme status e prioridade da OS
    if (os.viatura_id) {
      if (prioridadeFinal === 'EMERGENCIA') {
        await supabase.from('viaturas').update({ status_operacional: 'EM_MANUTENCAO_INTERNA' }).eq('id', os.viatura_id);
      } else if (statusFinal === 'EM_EXECUCAO' || statusFinal === 'EM_ANDAMENTO') {
        const novoStatus = os.tipo_os === 'EXTERNA' || os.origem_execucao === 'EXTERNA_CREDENCIADA' 
          ? 'EM_OFICINA_EXTERNA' 
          : 'EM_MANUTENCAO_INTERNA';
        await supabase.from('viaturas').update({ status_operacional: novoStatus }).eq('id', os.viatura_id);
      } else if (statusFinal === 'CONCLUIDA' || statusFinal === 'REJEITADA' || statusFinal === 'CANCELADA') {
        await supabase.from('viaturas').update({ status_operacional: 'DISPONIVEL' }).eq('id', os.viatura_id);
      }
    }

    return { success: true, data: data as OrdemServicoFrota };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar OS:', err);
    return { success: false, error: err?.message || 'Falha ao processar Ordem de Serviço' };
  }
}

export async function listOficinasAction(contratoId?: string): Promise<{ success: boolean; data?: OficinaPrestador[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from('oficinas_prestadores').select('*').eq('ativo', true).order('razao_social', { ascending: true });

    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: (data || []) as OficinaPrestador[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar oficinas:', err);
    return { success: false, error: err?.message || 'Erro ao carregar oficinas credenciadas' };
  }
}

export async function saveOficinaAction(oficina: Partial<OficinaPrestador>): Promise<{ success: boolean; data?: OficinaPrestador; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const payload = {
      ...oficina,
      razao_social: oficina.razao_social?.trim().toUpperCase(),
      contrato_id: oficina.contrato_id || 'ONÇA PUMA',
      ativo: oficina.ativo !== undefined ? oficina.ativo : true
    };

    const { data, error } = await supabase
      .from('oficinas_prestadores')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, data: data as OficinaPrestador };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar oficina:', err);
    return { success: false, error: err?.message || 'Falha ao salvar oficina credenciada' };
  }
}

// ==============================================================================
// 5. TELEMETRIA & RASTREAMENTO GIS (LEAFLET)
// ==============================================================================

export async function getFrotaTrackingAction(contratoId?: string): Promise<{
  success: boolean;
  viaturas: ViaturaTrackingTelemetry[];
  postos: any[];
  error?: string;
}> {
  try {
    const listRes = await listViaturasAction(contratoId);
    const telemetry = FleetTrackingAdapter.getTelemetryPositions(listRes.data || []);
    const postos = FleetTrackingAdapter.getPostosGeorreferenciados();
    return { success: true, viaturas: telemetry, postos };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao carregar telemetria:', err);
    return { success: false, viaturas: [], postos: [], error: err?.message || 'Erro ao carregar telemetria da frota' };
  }
}

// ==============================================================================
// 5. KPIS DO COCKPIT EXECUTIVO
// ==============================================================================

export async function getFrotaKpisAction(contratoId?: string): Promise<{ success: boolean; data?: FrotaKpisSummary; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    
    // Contagem de Viaturas
    let queryV = supabase.from('viaturas').select('status_operacional, vencimento_crlv, vencimento_seguro');
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      queryV = queryV.eq('contrato_id', contratoId);
    }
    const { data: viaturas } = await queryV;

    // Contagem de Abastecimentos Suspeitos
    let queryA = supabase.from('abastecimentos').select('id', { count: 'exact', head: true }).eq('is_discrepante', true);
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      queryA = queryA.eq('contrato_id', contratoId);
    }
    const { count: countAbastecimentosSuspeitos } = await queryA;

    // Contagem de Pneus Críticos TWI
    let queryP = supabase.from('inspecoes_pneus').select('id', { count: 'exact', head: true }).eq('status_twi', 'CRITICO_PROIBIDO');
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      queryP = queryP.eq('contrato_id', contratoId);
    }
    const { count: countPneusCriticos } = await queryP;

    const list = viaturas || [];
    const hoje = new Date();
    const em30Dias = new Date();
    em30Dias.setDate(em30Dias.getDate() + 30);

    const crlvAVencerOuVencido = list.filter(v => {
      if (!v.vencimento_crlv) return false;
      const d = new Date(v.vencimento_crlv);
      return d <= em30Dias;
    }).length;

    const segurosAVencerOuVencido = list.filter(v => {
      if (!v.vencimento_seguro) return false;
      const d = new Date(v.vencimento_seguro);
      return d <= em30Dias;
    }).length;

    const kpis: FrotaKpisSummary = {
      totalViaturas: list.length,
      disponiveis: list.filter(v => v.status_operacional === 'DISPONIVEL').length,
      emDeslocamento: list.filter(v => v.status_operacional === 'EM_DESLOCAMENTO').length,
      emManutencao: list.filter(v => v.status_operacional === 'EM_MANUTENCAO_INTERNA' || v.status_operacional === 'EM_OFICINA_EXTERNA').length,
      pneusCriticosTwi: countPneusCriticos || 0,
      abastecimentosSuspeitos: countAbastecimentosSuspeitos || 0,
      crlvAVencerOuVencido,
      segurosAVencerOuVencido
    };

    return { success: true, data: kpis };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao calcular KPIs de frota:', err);
    return { success: false, error: err?.message || 'Falha no cálculo dos KPIs' };
  }
}

// ==============================================================================
// 6. CHECKLISTS TÉCNICOS AUTOMOTIVOS & DUAL-PHOTO EVIDENCE
// ==============================================================================

export async function salvarChecklistVeicularAction(
  checklist: ChecklistVeicular
): Promise<{ success: boolean; data?: ChecklistVeicular; osId?: string; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    if (!checklist.viatura_id) {
      throw new Error('Viatura ID é obrigatório para registrar checklist.');
    }

    // 1. Inserir cabeçalho do checklist
    const checklistPayload = {
      contrato_id: checklist.contrato_id || 'SALOBO',
      viatura_id: checklist.viatura_id,
      tecnico_nome: checklist.tecnico_nome,
      tipo_checklist: checklist.tipo_checklist || 'DIARIO_PREVENTIVO',
      odometro_km: Number(checklist.odometro_km || 0),
      horimetro: checklist.horimetro ? Number(checklist.horimetro) : null,
      status_aprovacao: checklist.status_aprovacao,
      percentual_conformidade: Number(checklist.percentual_conformidade || 100),
      total_itens: Number(checklist.total_itens || 0),
      total_conformes: Number(checklist.total_conformes || 0),
      total_nao_conformes: Number(checklist.total_nao_conformes || 0),
      latitude: checklist.latitude ? Number(checklist.latitude) : null,
      longitude: checklist.longitude ? Number(checklist.longitude) : null,
      observacoes_gerais: checklist.observacoes_gerais || null,
      created_at: new Date().toISOString()
    };

    const { data: savedChecklist, error: errChecklist } = await supabase
      .from('checklists_veiculares')
      .insert(checklistPayload)
      .select('*')
      .single();

    if (errChecklist) {
      console.error('[frotaActions] Erro ao gravar cabeçalho do checklist:', errChecklist);
      throw errChecklist;
    }

    // 2. Inserir itens avaliados com as fotos duplas
    if (checklist.itens && checklist.itens.length > 0) {
      const itensComChecklistId = checklist.itens.map(item => ({
        checklist_id: savedChecklist.id,
        sistema_grupo: item.sistema_grupo,
        item_nome: item.item_nome,
        parecer: item.parecer,
        gravidade_anomalia: item.gravidade_anomalia || null,
        observacao_anomalia: item.observacao_anomalia || null,
        foto_evidencia_1_url: item.foto_evidencia_1_url || null,
        foto_evidencia_2_url: item.foto_evidencia_2_url || null
      }));

      const { error: errItens } = await supabase
        .from('checklist_itens_avaliacao')
        .insert(itensComChecklistId);

      if (errItens) {
        console.error('[frotaActions] Erro ao gravar itens avaliados:', errItens);
      }
    }

    // 3. Disparo Automático de Ordem de Serviço se houver anomalias MÉDIAS ou CRÍTICAS
    const itensComAvaria = checklist.itens?.filter(
      i => i.parecer === 'NAO_CONFORME' && 
           (i.gravidade_anomalia === 'MEDIA' || i.gravidade_anomalia === 'CRITICA')
    ) || [];

    let generatedOsId: string | null = null;

    if (itensComAvaria.length > 0) {
      const temCritico = itensComAvaria.some(i => i.gravidade_anomalia === 'CRITICA');
      const discriminacao = itensComAvaria
        .map(i => `• [${i.sistema_grupo}] ${i.item_nome} (${i.gravidade_anomalia === 'CRITICA' ? 'IMPEDITIVA' : 'MÉDIA'})\n  Relato: ${i.observacao_anomalia || 'Sem detalhes informados'}`)
        .join('\n\n');

      const osPayload = {
        contrato_id: checklist.contrato_id || 'SALOBO',
        viatura_id: checklist.viatura_id,
        numero_os: `OS-CHK-${Date.now().toString().slice(-6)}`,
        tipo_os: 'INTERNA',
        natureza_manutencao: 'CORRETIVA',
        odometro_km: Number(checklist.odometro_km || 0),
        descricao_servico: `[Abertura Automática via Checklist Veicular]\nVistoriador: ${checklist.tecnico_nome}\n\nANOMALIAS IDENTIFICADAS:\n${discriminacao}`,
        status: 'ABERTA',
        data_abertura: new Date().toISOString()
      };

      const { data: osGerada, error: osErr } = await supabase
        .from('ordens_servico_frota')
        .insert(osPayload)
        .select('id')
        .single();

      if (!osErr && osGerada?.id) {
        generatedOsId = osGerada.id;

        // Vínculo da OS no checklist
        await supabase
          .from('checklists_veiculares')
          .update({ ordem_servico_gerada_id: generatedOsId })
          .eq('id', savedChecklist.id);

        // Atualização do status operacional da viatura
        const novoStatusViatura = temCritico ? 'INTERDITADO' : 'EM_MANUTENCAO_INTERNA';
        await supabase
          .from('viaturas')
          .update({ status_operacional: novoStatusViatura })
          .eq('id', checklist.viatura_id);
      }
    }

    // 4. Atualizar odômetro da viatura se maior que o atual
    const { data: vtrAtual } = await supabase
      .from('viaturas')
      .select('odometro_atual_km')
      .eq('id', checklist.viatura_id)
      .single();

    if (checklist.odometro_km && (!vtrAtual?.odometro_atual_km || checklist.odometro_km > vtrAtual.odometro_atual_km)) {
      await supabase
        .from('viaturas')
        .update({ odometro_atual_km: checklist.odometro_km })
        .eq('id', checklist.viatura_id);
    }

    // 5. Inserir registro no log de auditoria para acionamento imediato de notificações na web
    try {
      const vtrInfo = checklist.viatura 
        ? `${checklist.viatura.prefixo_frota} (${checklist.viatura.placa})`
        : `Viatura ${checklist.viatura_id.slice(0, 8)}`;

      await supabase.from('logs_auditoria').insert([{
        usuario_id: null,
        usuario_nome: checklist.tecnico_nome,
        usuario_email: 'terminal.frota@siger.com',
        acao: checklist.status_aprovacao === 'INTERDITADO' 
          ? 'CHECKLIST_INTERDITADO' 
          : checklist.status_aprovacao === 'ATENCAO' 
            ? 'CHECKLIST_ATENCAO' 
            : 'CHECKLIST_APROVADO',
        tipo_ativo: 'VIATURA',
        patrimonio: vtrInfo,
        detalhes: `Vistoria concluída: ${checklist.percentual_conformidade}% de conformidade. Status: ${checklist.status_aprovacao}. Total NCs: ${checklist.total_nao_conformes}.`,
        created_at: new Date().toISOString()
      }]);
    } catch (audErr) {
      console.warn('[salvarChecklistVeicularAction] Aviso ao gravar logs_auditoria:', audErr);
    }

    return { 
      success: true, 
      data: savedChecklist as ChecklistVeicular, 
      osId: generatedOsId || undefined 
    };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao salvar checklist veicular:', err);
    return { success: false, error: err?.message || 'Falha ao processar checklist veicular' };
  }
}

export async function listChecklistsAction(
  viaturaId?: string, 
  contratoId?: string
): Promise<{ success: boolean; data?: ChecklistVeicular[]; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from('checklists_veiculares')
      .select(`
        *,
        viatura:viaturas (
          id,
          prefixo_frota,
          placa,
          tipo_veiculo,
          marca,
          modelo
        )
      `)
      .order('created_at', { ascending: false });

    if (viaturaId) {
      query = query.eq('viatura_id', viaturaId);
    }
    if (contratoId && contratoId !== 'TODOS' && contratoId !== 'GLOBAL') {
      query = query.eq('contrato_id', contratoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: (data || []) as ChecklistVeicular[] };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao listar checklists:', err);
    return { success: false, error: err?.message || 'Erro ao carregar histórico de checklists' };
  }
}

export async function getChecklistByIdAction(
  checklistId: string
): Promise<{ success: boolean; data?: ChecklistVeicular; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: checklist, error: chkErr } = await supabase
      .from('checklists_veiculares')
      .select(`
        *,
        viatura:viaturas (
          id,
          prefixo_frota,
          placa,
          tipo_veiculo,
          marca,
          modelo,
          chassi
        )
      `)
      .eq('id', checklistId)
      .single();

    if (chkErr || !checklist) throw chkErr || new Error('Checklist não encontrado');

    const { data: itens, error: itensErr } = await supabase
      .from('checklist_itens_avaliacao')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('sistema_grupo', { ascending: true });

    if (!itensErr && itens) {
      checklist.itens = itens as ChecklistItemAvaliacao[];
    }

    return { success: true, data: checklist as ChecklistVeicular };
  } catch (err: any) {
    console.error('[frotaActions] Erro ao buscar checklist por ID:', err);
    return { success: false, error: err?.message || 'Erro ao carregar detalhes do checklist' };
  }
}

// ==============================================================================
// 7. METROLOGIA E RODAGEM DE PNEUS
// ==============================================================================
import { 
  getCatalogoPneusAction as getCatalogoPneusActionImpl, 
  salvarInspecaoRodagemAction as salvarInspecaoRodagemActionImpl, 
  listHistoricoInspecoesRodagemAction as listHistoricoInspecoesRodagemActionImpl 
} from '@/app/actions/pneuActions';

export async function getCatalogoPneusAction() {
  return getCatalogoPneusActionImpl();
}

export async function salvarInspecaoRodagemAction(payload: any) {
  return salvarInspecaoRodagemActionImpl(payload);
}

export async function listHistoricoInspecoesRodagemAction(contratoId?: string, viaturaId?: string) {
  return listHistoricoInspecoesRodagemActionImpl(contratoId, viaturaId);
}


