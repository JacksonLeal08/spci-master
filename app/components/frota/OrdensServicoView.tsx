'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  OrdemServicoFrota, 
  Viatura, 
  OficinaPrestador 
} from '@/lib/types/frota';
import { 
  ETAPAS_WORKFLOW_OS, 
  CRITICIDADE_INFO, 
  EtapaOS, 
  CriticidadeOS 
} from '@/lib/types/osWorkflow';
import { 
  listOrdensServicoAction, 
  listViaturasAction, 
  listOficinasAction 
} from '@/app/actions/frotaActions';
import { 
  quickApproveOSAction 
} from '@/app/actions/osWorkflowActions';
import { useSearchParams } from 'next/navigation';
import { useSpci } from '@/app/context/SpciContext';
import { OSDetailModal } from './OSDetailModal';
import { OrdemServicoModal } from './OrdemServicoModal';
import { OSRomaneioModal } from './OSRomaneioModal';
import { ManualInterativoOSModal } from './ManualInterativoOSModal';
import { DockMinimizados, MinimizedWindow } from './DockMinimizados';
import { 
  Wrench, 
  Search, 
  Filter, 
  Plus, 
  Kanban, 
  List, 
  Truck, 
  DollarSign, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw,
  BookOpen,
  ExternalLink,
  Layers,
  ChevronRight,
  Disc,
  Fuel,
  Building2,
  Printer,
  Ban,
  ShieldCheck
} from 'lucide-react';

export const OrdensServicoView: React.FC = () => {
  const { activeSite, userProfile, currentUser, triggerSuccessNotification } = useSpci();

  const [ordens, setOrdens] = useState<OrdemServicoFrota[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [oficinas, setOficinas] = useState<OficinaPrestador[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCriticidade, setSelectedCriticidade] = useState<string>('TODAS');
  const [selectedEtapa, setSelectedEtapa] = useState<string>('TODAS');
  const [selectedViaturaId, setSelectedViaturaId] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Modais
  const [selectedOSForDetail, setSelectedOSForDetail] = useState<OrdemServicoFrota | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedOSForRomaneio, setSelectedOSForRomaneio] = useState<OrdemServicoFrota | null>(null);
  const [isRomaneioOpen, setIsRomaneioOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Janelas minimizadas no Dock
  const [minimizedWindows, setMinimizedWindows] = useState<MinimizedWindow[]>([]);

  // Leitura de Parâmetros de URL (compartilhamento WhatsApp / E-mail)
  const searchParams = useSearchParams();
  const targetId = searchParams ? searchParams.get('id') : null;
  const targetView = searchParams ? searchParams.get('view') : null;
  const targetAction = searchParams ? searchParams.get('action') : null;

  const loadData = async () => {
    setLoading(true);
    try {
      const [osRes, vtrRes, ofcRes] = await Promise.all([
        listOrdensServicoAction(activeSite),
        listViaturasAction(activeSite),
        listOficinasAction(activeSite)
      ]);

      if (osRes.success && osRes.data) setOrdens(osRes.data);
      if (vtrRes.success && vtrRes.data) setViaturas(vtrRes.data);
      if (ofcRes.success && ofcRes.data) setOficinas(ofcRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSite]);

  // Deep-link do WhatsApp ou E-mail
  useEffect(() => {
    if (targetId && ordens.length > 0) {
      const found = ordens.find(o => o.id === targetId || o.numero_os === targetId);
      if (found) {
        if (targetView === 'romaneio') {
          setSelectedOSForRomaneio(found);
          setIsRomaneioOpen(true);
        } else {
          setSelectedOSForDetail(found);
          setIsDetailOpen(true);
        }
      }
    }
  }, [targetId, targetView, targetAction, ordens]);

  // Contagem de Ordens Recusadas / Não Autorizadas
  const countRejeitadas = useMemo(() => {
    return ordens.filter(os => (os.status_os === 'REJEITADA' || os.status === 'REJEITADA')).length;
  }, [ordens]);

  // Filtros combinados
  const filteredOrdens = useMemo(() => {
    return ordens.filter(os => {
      const vtr = os.viatura || viaturas.find(v => v.id === os.viatura_id);
      const prefixo = vtr?.prefixo_frota || '';
      const placa = vtr?.placa || '';
      const numOs = os.numero_os || '';
      const desc = os.descricao_motivo || os.descricao_servico || '';
      const isRej = os.status_os === 'REJEITADA' || os.status === 'REJEITADA';

      const matchSearch = searchTerm === '' || 
        prefixo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        numOs.toLowerCase().includes(searchTerm.toLowerCase()) ||
        desc.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCrit = selectedCriticidade === 'TODAS' || 
        (os.prioridade || 'NORMAL').toUpperCase() === selectedCriticidade;

      let matchEtapa = true;
      if (selectedEtapa === 'REJEITADAS') {
        matchEtapa = isRej;
      } else if (selectedEtapa !== 'TODAS') {
        matchEtapa = !isRej && (os.etapa_atual || '1_ABERTURA_TRIAGEM') === selectedEtapa;
      } else {
        matchEtapa = true;
      }

      const matchVtr = selectedViaturaId === 'TODAS' || os.viatura_id === selectedViaturaId;

      return matchSearch && matchCrit && matchEtapa && matchVtr;
    });
  }, [ordens, viaturas, searchTerm, selectedCriticidade, selectedEtapa, selectedViaturaId]);

  // Contadores por etapa
  const countsByEtapa = useMemo(() => {
    const counts: Record<string, number> = {
      '1_ABERTURA_TRIAGEM': 0,
      '2_ORCAMENTACAO_DIAGNOSTICO': 0,
      '3_AGUARDANDO_APROVACAO': 0,
      '4_APROVADA_EM_EXECUCAO': 0,
      '5_CONFERENCIA_QUALIDADE': 0,
      '6_CONCLUIDA_LIBERADA': 0,
    };

    ordens.forEach(os => {
      const isRej = os.status_os === 'REJEITADA' || os.status === 'REJEITADA';
      if (!isRej) {
        const et = os.etapa_atual || '1_ABERTURA_TRIAGEM';
        if (counts[et] !== undefined) counts[et]++;
      }
    });

    return counts;
  }, [ordens]);

  // Aprovação rápida em 1 clique
  const handleQuickApprove = async (e: React.MouseEvent, os: OrdemServicoFrota) => {
    e.stopPropagation();
    setApprovingId(os.id);
    const responsavel = userProfile?.name || currentUser?.displayName || 'Aprovador Autorizado';
    try {
      const res = await quickApproveOSAction(os.id, responsavel, undefined, 'Aprovado via Kanban em 1 clique.');
      if (res.success && res.data) {
        setOrdens(prev => prev.map(x => x.id === os.id ? res.data! : x));
        triggerSuccessNotification('OS Aprovada!', `OS #${os.numero_os} da viatura ${os.viatura?.prefixo_frota || ''} está em execução.`);
      } else {
        alert(res.error || 'Erro ao aprovar OS.');
      }
    } catch (err: any) {
      alert('Erro: ' + err?.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleOpenDetail = (os: OrdemServicoFrota) => {
    setSelectedOSForDetail(os);
    setIsDetailOpen(true);
  };

  const handleMinimizeDetail = (os: OrdemServicoFrota) => {
    setIsDetailOpen(false);
    setMinimizedWindows(prev => {
      if (prev.some(w => w.id === os.id)) return prev;
      return [...prev, {
        id: os.id,
        title: `OS #${os.numero_os || 'PENDENTE'}`,
        type: 'ordem_servico'
      }];
    });
  };

  const handleRestoreWindow = (id: string) => {
    const found = ordens.find(o => o.id === id);
    if (found) {
      setSelectedOSForDetail(found);
      setIsDetailOpen(true);
      setMinimizedWindows(prev => prev.filter(w => w.id !== id));
    }
  };

  const handleCloseMinimized = (id: string) => {
    setMinimizedWindows(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="space-y-6 font-sans select-none">

      {/* ========================================================================= */}
      {/* 1. CABEÇALHO EXECUTIVO DO MÓDULO DE ORDENS DE SERVIÇO                     */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1C4E26] via-[#68D346] to-[#B7F365]" />
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#68D346] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#1C4E26] dark:text-[#B7F365] font-black">
              MOTOR DE WORKFLOW & ESTADOS DE OS • SIGER MASTER
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-['Hanken_Grotesk'] text-slate-900 dark:text-white tracking-tight">
            Painel Executivo de Ordens de Serviço (OS 360°)
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Controle de alçadas financeiras, aprovação rápida em 1 clique e rastreabilidade temporal por viatura.
          </p>
        </div>

        {/* Botão de Ação Primária & Alternador de Visão */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex bg-slate-100 dark:bg-[#121418] p-1 rounded-xl border border-slate-200 dark:border-[#3C3F45]">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border-none ${
                viewMode === 'kanban' 
                  ? 'bg-white dark:bg-[#282A2F] text-[#1C4E26] dark:text-[#B7F365] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-transparent'
              }`}
              title="Visão Kanban por Etapa"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border-none ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-[#282A2F] text-[#1C4E26] dark:text-[#B7F365] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-transparent'
              }`}
              title="Visão Lista / Tabela"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          {/* Botão Manual Interativo 3D */}
          <button
            type="button"
            onClick={() => setIsManualOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#171A22] via-[#222733] to-[#171A22] hover:bg-[#2A3140] text-slate-200 hover:text-white border border-[#3C4455] hover:border-[#68D346] font-mono font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer group"
            title="Abrir Manual Interativo 3D de Ordens de Serviço"
          >
            <div className="w-5 h-5 rounded-lg overflow-hidden shrink-0 border border-[#68D346]/40 shadow-xs">
              <img 
                src="/images/manual_os_icon_3d.jpg" 
                alt="3D Icon" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
              />
            </div>
            <span className="hidden sm:inline">Manual da O.S.</span>
            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-[#68D346] text-slate-950">3D</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1C4E26] to-[#68D346] hover:brightness-110 active:scale-95 text-white font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Nova OS</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TIRA DE ETAPAS DO WORKFLOW COM CONTADORES                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {ETAPAS_WORKFLOW_OS.map((def) => {
          const count = countsByEtapa[def.etapa] || 0;
          const isSelected = selectedEtapa === def.etapa;

          return (
            <button
              key={def.etapa}
              type="button"
              onClick={() => setSelectedEtapa(isSelected ? 'TODAS' : def.etapa)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected 
                  ? 'bg-[#1C4E26]/20 border-[#68D346] shadow-sm ring-1 ring-[#68D346]' 
                  : 'bg-white dark:bg-[#1E2024] border-slate-200 dark:border-[#3C3F45] hover:border-slate-300 dark:hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-slate-400">
                  0{def.numero}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${
                  count > 0 ? 'bg-[#68D346]/20 text-[#1C4E26] dark:text-[#B7F365]' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 mt-2 truncate">
                {def.titulo}
              </p>
              <span className="text-[9px] text-slate-400 font-mono block truncate">
                {def.subtitulo}
              </span>
            </button>
          );
        })}

        {/* Card Especial de Ordens Recusadas / Não Autorizadas */}
        <button
          type="button"
          onClick={() => setSelectedEtapa(selectedEtapa === 'REJEITADAS' ? 'TODAS' : 'REJEITADAS')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            selectedEtapa === 'REJEITADAS' 
              ? 'bg-rose-500/20 border-rose-500 shadow-sm ring-1 ring-rose-500' 
              : 'bg-white dark:bg-[#1E2024] border-slate-200 dark:border-[#3C3F45] hover:border-rose-400 dark:hover:border-rose-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-rose-500 flex items-center gap-1">
              <Ban className="w-3 h-3" /> 07
            </span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${
              countRejeitadas > 0 ? 'bg-rose-600/20 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
            }`}>
              {countRejeitadas}
            </span>
          </div>
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-2 truncate">
            Não Autorizadas
          </p>
          <span className="text-[9px] text-slate-400 font-mono block truncate">
            Reparos Recusados
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE FILTROS & PESQUISA                                            */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          {/* Busca Textual */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por OS #, placa, viatura ou defeito..."
              className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#68D346]"
            />
          </div>

          {/* Filtro Criticidade */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#121418] p-1 rounded-xl border border-slate-200 dark:border-[#3C3F45]">
            {(['TODAS', 'NORMAL', 'URGENTE', 'EMERGENCIA'] as const).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCriticidade(c)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border-none ${
                  selectedCriticidade === c
                    ? c === 'EMERGENCIA' 
                      ? 'bg-red-600 text-white' 
                      : c === 'URGENTE' 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-white dark:bg-[#282A2F] text-[#1C4E26] dark:text-[#B7F365] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-transparent'
                }`}
              >
                {c === 'TODAS' ? 'Todas' : c}
              </button>
            ))}
          </div>

          {/* Filtro Viatura */}
          <select
            value={selectedViaturaId}
            onChange={(e) => setSelectedViaturaId(e.target.value)}
            className="bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#3C3F45] rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="TODAS">🚓 Todas as Viaturas</option>
            {viaturas.map(v => (
              <option key={v.id} value={v.id}>{v.prefixo_frota} - {v.placa}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282A2F] transition-colors cursor-pointer border-none bg-transparent"
          title="Recarregar dados"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISUALIZAÇÃO KANBAN OU TABELA                                         */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="py-20 text-center text-xs font-mono text-slate-400 animate-pulse">
          Carregando Ordens de Serviço e Workflow...
        </div>
      ) : filteredOrdens.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] text-center space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Nenhuma Ordem de Serviço encontrada.</p>
          <p className="text-xs text-slate-400">Ajuste os filtros acima ou crie uma nova OS.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 text-xs font-bold text-[#68D346] underline cursor-pointer border-none bg-transparent"
          >
            Cadastrar nova OS agora.
          </button>
        </div>
      ) : selectedEtapa === 'REJEITADAS' ? (
        /* ---------------- VISUALIZAÇÃO DEDICADA DE ORDENS NÃO AUTORIZADAS / RECUSADAS ---------------- */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-rose-800 dark:text-rose-300 font-mono">
                  Painel de Controle: Ordens de Serviço Não Autorizadas ({filteredOrdens.length})
                </h3>
                <p className="text-[11px] text-rose-600/80 dark:text-rose-400">
                  Histórico de cotações recusadas e justificativas técnicas registradas para auditoria corporativa.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEtapa('TODAS')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 underline cursor-pointer border-none bg-transparent"
            >
              Voltar ao Fluxo Principal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredOrdens.map(os => {
              const vtr = os.viatura || viaturas.find(v => v.id === os.viatura_id);
              const valor = Number(os.valor_estimado || os.custo_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

              return (
                <div
                  key={os.id}
                  onClick={() => handleOpenDetail(os)}
                  className="p-4 rounded-2xl bg-white dark:bg-[#1E2024] border-2 border-rose-300/80 dark:border-rose-900/60 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2.5 relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-black text-rose-700 dark:text-rose-400">
                      #{os.numero_os || 'OS-SEM-NUM'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-600 text-white">
                      NÃO AUTORIZADA
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>{vtr?.prefixo_frota || 'VTR'}</span>
                    <span className="text-[10px] font-mono text-slate-400">({vtr?.placa || '-'})</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs">
                    <span className="text-[9px] font-mono uppercase text-rose-700 dark:text-rose-400 font-bold block mb-0.5">
                      Motivo da Recusa:
                    </span>
                    <p className="text-slate-800 dark:text-zinc-200 italic line-clamp-3 leading-snug">
                      "{os.motivo_recusa || 'Sem justificativa informada.'}"
                    </p>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 flex justify-between items-center pt-2 border-t border-slate-100 dark:border-[#282A2F]">
                    <span>Orçamento: <strong className="text-slate-700 dark:text-zinc-200">{valor}</strong></span>
                    <span>{os.data_recusa ? new Date(os.data_recusa).toLocaleDateString('pt-BR') : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* ---------------- KANBAN BOARD (6 COLUNAS) ---------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
          {ETAPAS_WORKFLOW_OS.map((col) => {
            const osNaEtapa = filteredOrdens.filter(o => (o.etapa_atual || '1_ABERTURA_TRIAGEM') === col.etapa);

            return (
              <div
                key={col.etapa}
                className="bg-slate-100/60 dark:bg-[#121418] rounded-2xl border border-slate-200/80 dark:border-[#282A2F] p-3 flex flex-col space-y-2.5 min-w-[240px]"
              >
                {/* Cabeçalho da Coluna */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-[#282A2F]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.cor }} />
                    <h3 className="font-extrabold text-[11px] uppercase tracking-wide text-slate-800 dark:text-zinc-200 font-['Hanken_Grotesk']">
                      {col.titulo}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#282A2F] text-slate-700 dark:text-zinc-300">
                    {osNaEtapa.length}
                  </span>
                </div>

                {/* Cards na Coluna */}
                <div className="space-y-2.5">
                  {osNaEtapa.length === 0 ? (
                    <div className="py-8 text-center text-[10px] font-mono text-slate-400">
                      Nenhuma OS nesta etapa
                    </div>
                  ) : (
                    osNaEtapa.map(os => {
                      const prioridade = (os.prioridade || 'NORMAL').toUpperCase() as CriticidadeOS;
                      const isEmergencia = prioridade === 'EMERGENCIA';
                      const isUrgente = prioridade === 'URGENTE';
                      const vtr = os.viatura || viaturas.find(v => v.id === os.viatura_id);
                      const valor = Number(os.valor_estimado || os.custo_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                      const isAtrasada = Boolean(
                        os.previsao_conclusao && 
                        new Date(os.previsao_conclusao).getTime() < Date.now() &&
                        !['CONCLUIDA', 'REJEITADA', 'CANCELADA'].includes(os.status_os || os.status)
                      );
                      const isRej = os.status_os === 'REJEITADA' || os.status === 'REJEITADA';

                      return (
                        <div
                          key={os.id}
                          onClick={() => handleOpenDetail(os)}
                          className={`p-3 rounded-xl bg-white dark:bg-[#1E2024] border transition-all duration-200 hover:shadow-md cursor-pointer space-y-2 relative overflow-hidden group ${
                            isEmergencia 
                              ? 'border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.15)]' 
                              : isUrgente 
                                ? 'border-amber-500/50' 
                                : 'border-slate-200 dark:border-[#3C3F45] hover:border-slate-300 dark:hover:border-zinc-500'
                          }`}
                        >
                          {/* Topo do Card: OS # e Criticidade */}
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-black text-slate-800 dark:text-zinc-200 group-hover:text-[#68D346] transition-colors">
                              #{os.numero_os || 'OS-SEM-NUM'}
                            </span>

                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              isEmergencia ? 'bg-red-600 text-white' : isUrgente ? 'bg-amber-500 text-white' : 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {prioridade}
                            </span>
                          </div>

                          {/* Viatura */}
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{vtr?.prefixo_frota || 'VTR'}</span>
                            <span className="text-[10px] font-mono text-slate-400">({vtr?.placa || '-'})</span>
                          </div>

                          {/* Resumo do Defeito */}
                          <p className="text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-2 leading-snug">
                            {os.descricao_motivo || os.descricao_servico || 'Manutenção corretiva.'}
                          </p>

                          {/* Badges de Cronograma, SLA & Garantia */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono pt-0.5">
                            {os.previsao_conclusao && (
                              <span className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                isAtrasada ? 'bg-rose-500 text-white font-bold animate-pulse' : 'bg-slate-100 dark:bg-[#121418] text-slate-500 dark:text-zinc-300'
                              }`}>
                                <Clock className="w-2.5 h-2.5" />
                                {isAtrasada ? 'SLA Atrasado' : new Date(os.previsao_conclusao).toLocaleDateString('pt-BR')}
                              </span>
                            )}

                            {(os.garantia_meses || os.garantia_km) && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-[#B7F365] border border-emerald-500/20 flex items-center gap-0.5 font-bold">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                {os.garantia_meses ? `${os.garantia_meses}m` : ''}{os.garantia_km ? `/${os.garantia_km}km` : ''}
                              </span>
                            )}

                            {isRej && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold flex items-center gap-0.5">
                                <Ban className="w-2.5 h-2.5" /> Não Autorizada
                              </span>
                            )}
                          </div>

                          {/* Rodapé: Valor & Ação Rápida */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#282A2F] text-[10px] font-mono">
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {valor}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOSForRomaneio(os);
                                  setIsRomaneioOpen(true);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#3C3F45] transition cursor-pointer border-none bg-transparent"
                                title="Visualizar / Imprimir Romaneio Oficial"
                              >
                                <Printer className="w-3.5 h-3.5 text-red-500" />
                              </button>

                              {col.etapa === '3_AGUARDANDO_APROVACAO' ? (
                                <button
                                  type="button"
                                  disabled={approvingId === os.id}
                                  onClick={(e) => handleQuickApprove(e, os)}
                                  className="px-2 py-1 rounded-lg bg-gradient-to-r from-[#1C4E26] to-[#68D346] hover:brightness-110 active:scale-95 text-white font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs border-none cursor-pointer disabled:opacity-50"
                                  title="Aprovar em 1 clique"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>{approvingId === os.id ? '...' : 'Aprovar'}</span>
                                </button>
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* ---------------- LIST VIEW (TABELA INTERATIVA) ---------------- */
        <div className="bg-white dark:bg-[#1E2024] rounded-2xl border border-slate-200 dark:border-[#3C3F45] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 dark:bg-[#121418] text-slate-500 dark:text-zinc-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-[#282A2F]">
                <tr>
                  <th className="p-3.5 pl-5">Número OS</th>
                  <th className="p-3.5">Viatura & Placa</th>
                  <th className="p-3.5">Prioridade / SLA</th>
                  <th className="p-3.5">Prazos & Garantias</th>
                  <th className="p-3.5">Etapa do Workflow</th>
                  <th className="p-3.5">Defeito Relatado</th>
                  <th className="p-3.5">Valor Estimado</th>
                  <th className="p-3.5 pr-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#282A2F]">
                {filteredOrdens.map(os => {
                  const prioridade = (os.prioridade || 'NORMAL').toUpperCase() as CriticidadeOS;
                  const isEmergencia = prioridade === 'EMERGENCIA';
                  const isUrgente = prioridade === 'URGENTE';
                  const vtr = os.viatura || viaturas.find(v => v.id === os.viatura_id);
                  const valor = Number(os.valor_estimado || os.custo_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  const isAtrasada = Boolean(
                    os.previsao_conclusao && 
                    new Date(os.previsao_conclusao).getTime() < Date.now() &&
                    !['CONCLUIDA', 'REJEITADA', 'CANCELADA'].includes(os.status_os || os.status)
                  );
                  const isRej = os.status_os === 'REJEITADA' || os.status === 'REJEITADA';

                  return (
                    <tr
                      key={os.id}
                      onClick={() => handleOpenDetail(os)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#282A2F]/60 transition-colors cursor-pointer ${
                        isRej ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="p-3.5 pl-5 font-mono font-black text-slate-900 dark:text-white">
                        #{os.numero_os || 'OS-000'}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 dark:text-zinc-200">{vtr?.prefixo_frota || 'VTR'}</div>
                        <div className="text-[10px] font-mono text-slate-400">{vtr?.placa || '-'} • {vtr?.marca} {vtr?.modelo}</div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          isEmergencia ? 'bg-red-600 text-white' : isUrgente ? 'bg-amber-500 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {prioridade}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-[10.5px]">
                        <div className="flex flex-col gap-0.5">
                          {os.previsao_conclusao ? (
                            <span className={`flex items-center gap-1 ${isAtrasada ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-zinc-300'}`}>
                              <Clock className="w-3 h-3" />
                              {new Date(os.previsao_conclusao).toLocaleDateString('pt-BR')}
                              {isAtrasada && <span className="text-[8.5px] uppercase font-bold px-1 bg-rose-100 text-rose-700 rounded">Atrasado</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}

                          {(os.garantia_meses || os.garantia_km) && (
                            <span className="text-[#1C4E26] dark:text-[#B7F365] font-bold flex items-center gap-1 text-[9.5px]">
                              <ShieldCheck className="w-3 h-3" />
                              {os.garantia_meses ? `${os.garantia_meses}m` : ''} {os.garantia_km ? `(${os.garantia_km}km)` : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {isRej ? (
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-600 text-white uppercase flex items-center gap-1 w-fit">
                            <Ban className="w-3 h-3" /> Recusada
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-zinc-200">
                            {os.etapa_atual || '1_ABERTURA_TRIAGEM'}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 max-w-xs truncate text-slate-600 dark:text-zinc-400">
                        {isRej && os.motivo_recusa ? (
                          <span className="text-rose-700 dark:text-rose-400 font-medium">Motivo: {os.motivo_recusa}</span>
                        ) : (
                          os.descricao_motivo || os.descricao_servico || '-'
                        )}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {valor}
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOSForRomaneio(os);
                              setIsRomaneioOpen(true);
                            }}
                            className="p-1 px-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#3C3F45] transition cursor-pointer border border-slate-300 dark:border-[#3C3F45] bg-transparent flex items-center gap-1 text-[10px] font-mono"
                            title="Visualizar e Imprimir Romaneio"
                          >
                            <Printer className="w-3 h-3 text-red-500" />
                            <span className="hidden sm:inline">Romaneio</span>
                          </button>

                          {os.etapa_atual === '3_AGUARDANDO_APROVACAO' && !isRej ? (
                            <button
                              type="button"
                              disabled={approvingId === os.id}
                              onClick={(e) => handleQuickApprove(e, os)}
                              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#1C4E26] to-[#68D346] text-white font-mono font-bold text-[10px] uppercase cursor-pointer border-none shadow-xs"
                            >
                              Aprovar
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Inspecionar</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAIS & FLOATING DOCK                                                 */}
      {/* ========================================================================= */}
      <OSDetailModal
        os={selectedOSForDetail}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onMinimize={handleMinimizeDetail}
        onOSUpdated={(updated) => {
          setOrdens(prev => prev.map(x => x.id === updated.id ? updated : x));
          setSelectedOSForDetail(updated);
        }}
      />

      <OrdemServicoModal
        isOpen={isCreateModalOpen}
        viaturas={viaturas}
        contratoId={activeSite || 'ONÇA PUMA'}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(saved) => {
          setOrdens(prev => [saved, ...prev]);
          setIsCreateModalOpen(false);
          triggerSuccessNotification('Nova OS Cadastrada!', `OS #${saved.numero_os} aberta com sucesso.`);
        }}
      />

      {/* MODAL DE ROMANEIO TÉCNICO SPCI */}
      <OSRomaneioModal
        isOpen={isRomaneioOpen}
        onClose={() => setIsRomaneioOpen(false)}
        os={selectedOSForRomaneio}
        viatura={selectedOSForRomaneio?.viatura || viaturas.find(v => v.id === selectedOSForRomaneio?.viatura_id) || null}
        oficina={selectedOSForRomaneio?.oficina || oficinas.find(o => o.id === selectedOSForRomaneio?.oficina_id) || null}
        emitenteNome={selectedOSForRomaneio?.responsavel_abertura || 'Inspetor de Frotas SPCI'}
        aprovadorNome={userProfile?.name || currentUser?.displayName || 'Gestor Responsável SPCI'}
      />

      {/* MANUAL INTERATIVO 3D DE ORDENS DE SERVIÇO */}
      <ManualInterativoOSModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      <DockMinimizados
        minimizedWindows={minimizedWindows}
        onRestore={handleRestoreWindow}
        onClose={handleCloseMinimized}
      />

    </div>
  );
};

export default OrdensServicoView;
