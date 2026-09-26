'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  OrdemServicoFrota, 
  Viatura 
} from '@/lib/types/frota';
import { 
  ETAPAS_WORKFLOW_OS, 
  CRITICIDADE_INFO, 
  EtapaOS, 
  CriticidadeOS,
  OSHistoricoEtapa 
} from '@/lib/types/osWorkflow';
import { 
  processOSWorkflowTransitionAction, 
  quickApproveOSAction,
  listOSAuditHistoryAction,
  dispatchOSAlertsAction 
} from '@/app/actions/osWorkflowActions';
import { saveOrdemServicoAction } from '@/app/actions/frotaActions';
import { useSpci } from '@/app/context/SpciContext';
import { 
  Wrench, 
  Truck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  User, 
  Share2, 
  Mail, 
  Phone, 
  Minus, 
  Maximize2, 
  X, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  Check, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  History,
  Send,
  Printer,
  Layers,
  Receipt,
  Ban,
  CalendarCheck,
  Award,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { OSRomaneioModal } from './OSRomaneioModal';
import { shareRomaneioWhatsAppHybrid } from '@/lib/osRomaneioReports';

interface OSDetailModalProps {
  os: OrdemServicoFrota | null;
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: (os: OrdemServicoFrota) => void;
  onOSUpdated?: (updated: OrdemServicoFrota) => void;
}

export const OSDetailModal: React.FC<OSDetailModalProps> = ({
  os,
  isOpen,
  onClose,
  onMinimize,
  onOSUpdated
}) => {
  const { userProfile, currentUser, triggerSuccessNotification } = useSpci();

  const [activeTab, setActiveTab] = useState<'workflow' | 'financeiro' | 'auditoria'>('workflow');
  const [auditLogs, setAuditLogs] = useState<OSHistoricoEtapa[]>([]);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isRomaneioOpen, setIsRomaneioOpen] = useState<boolean>(false);

  // Controle de Recusa / Não Autorização
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [motivoRecusaInput, setMotivoRecusaInput] = useState<string>('');

  // Carrega trilha de auditoria
  useEffect(() => {
    if (os?.id && isOpen) {
      setLoadingAudit(true);
      listOSAuditHistoryAction(os.id)
        .then(res => {
          if (res.success && res.data) {
            setAuditLogs(res.data);
          }
        })
        .finally(() => setLoadingAudit(false));
    }
  }, [os?.id, isOpen]);

  if (!isOpen || !os) return null;

  const prioridade = (os.prioridade || 'NORMAL').toUpperCase() as CriticidadeOS;
  const critConfig = CRITICIDADE_INFO[prioridade] || CRITICIDADE_INFO.NORMAL;
  const etapaAtual = (os.etapa_atual || '1_ABERTURA_TRIAGEM') as EtapaOS;
  const etapaNumeroAtual = os.numero_etapa || 1;

  const isRecusada = os.status_os === 'REJEITADA' || os.status === 'REJEITADA';

  // Verifica atraso de SLA
  const isAtrasada = Boolean(
    os.previsao_conclusao && 
    new Date(os.previsao_conclusao).getTime() < Date.now() &&
    !['CONCLUIDA', 'REJEITADA', 'CANCELADA'].includes(os.status_os || os.status)
  );

  const viatura: Viatura = os.viatura || {
    id: os.viatura_id,
    prefixo_frota: 'VTR-01',
    placa: 'BRA2E19',
    marca: 'Toyota',
    modelo: 'Hilux 4x4',
    tipo_veiculo: 'CAMINHONETE',
    tipo_combustivel: 'DIESEL_S10',
    odometro_atual_km: os.odometro_km || 0,
    status_operacional: 'EM_MANUTENCAO_INTERNA',
    contrato_id: os.contrato_id
  };

  const valorTotal = Number(os.valor_estimado || os.custo_total || (Number(os.custo_pecas || 0) + Number(os.custo_mao_de_obra || 0) + Number(os.custo_pneus || 0)));

  // Ação de não autorizar / recusar a OS
  const handleRejectOS = async () => {
    if (!motivoRecusaInput.trim()) {
      alert('Por favor, informe a justificativa técnica para não autorizar ou recusar a Ordem de Serviço.');
      return;
    }

    setIsProcessing(true);
    const responsavel = userProfile?.name || currentUser?.displayName || 'Gestor de Frota SPCI';
    try {
      const res = await saveOrdemServicoAction({
        id: os.id,
        status: 'REJEITADA',
        status_os: 'REJEITADA',
        motivo_recusa: motivoRecusaInput.trim(),
        data_recusa: new Date().toISOString(),
        responsavel_recusa: responsavel,
        numero_os: os.numero_os,
        contrato_id: os.contrato_id,
        viatura_id: os.viatura_id,
        tipo_os: os.tipo_os,
        natureza_manutencao: os.natureza_manutencao,
        prioridade: os.prioridade
      });

      if (res.success && res.data) {
        if (onOSUpdated) onOSUpdated(res.data);
        triggerSuccessNotification('Ordem Recusada / Não Autorizada!', `A OS #${os.numero_os} foi rejeitada e a viatura liberada.`);
        setIsRejectModalOpen(false);
        const aud = await listOSAuditHistoryAction(os.id);
        if (aud.data) setAuditLogs(aud.data);
      } else {
        alert(res.error || 'Erro ao rejeitar Ordem de Serviço.');
      }
    } catch (e: any) {
      alert('Falha: ' + e?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Ação de aprovar
  const handleApprove = async () => {
    setIsProcessing(true);
    const responsavel = userProfile?.name || currentUser?.displayName || 'Aprovador Autorizado';
    try {
      const res = await quickApproveOSAction(os.id, responsavel, undefined, 'Aprovado pelo Modal de Detalhes da OS');
      if (res.success && res.data) {
        if (onOSUpdated) onOSUpdated(res.data);
        triggerSuccessNotification('Ordem de Serviço Aprovada!', `OS #${os.numero_os} agora está em execução na oficina.`);
        // Recarrega auditoria
        const aud = await listOSAuditHistoryAction(os.id);
        if (aud.data) setAuditLogs(aud.data);
      } else {
        alert(res.error || 'Erro ao aprovar OS');
      }
    } catch (e: any) {
      alert('Falha: ' + e?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Ação de transicionar para a próxima etapa
  const handleNextStep = async () => {
    const nextIdx = etapaNumeroAtual; // index no array é numero
    if (nextIdx >= ETAPAS_WORKFLOW_OS.length) return;
    const nextEtapa = ETAPAS_WORKFLOW_OS[nextIdx].etapa;

    setIsProcessing(true);
    const responsavel = userProfile?.name || currentUser?.displayName || 'Operador SIGER';

    try {
      const res = await processOSWorkflowTransitionAction(os.id, nextEtapa, {
        responsavelNome: responsavel,
        observacao: `Avanço manual de etapa para ${ETAPAS_WORKFLOW_OS[nextIdx].titulo}`
      });

      if (res.success && res.data) {
        if (onOSUpdated) onOSUpdated(res.data);
        triggerSuccessNotification('Etapa Atualizada!', `OS avançou para ${ETAPAS_WORKFLOW_OS[nextIdx].titulo}`);
        const aud = await listOSAuditHistoryAction(os.id);
        if (aud.data) setAuditLogs(aud.data);
      } else {
        alert(res.error || 'Não foi possível avançar a etapa');
      }
    } catch (e: any) {
      alert('Falha: ' + e?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Disparo manual de WhatsApp com Romaneio Anexado (Abordagem Híbrida)
  const handleSendWhatsApp = async () => {
    if (!os?.id) return;
    setIsProcessing(true);
    try {
      const res = await dispatchOSAlertsAction(os.id, ['WHATSAPP']);
      if (res.success) {
        const shareRes = await shareRomaneioWhatsAppHybrid({
          os,
          viatura: os.viatura,
          oficina: os.oficina,
          recipientPhone: res.whatsAppPayload?.recipientNumber,
          customMessage: res.whatsAppPayload?.text
        });

        if (shareRes.sharedVia === 'native_share') {
          triggerSuccessNotification('WhatsApp / Romaneio Aberto!', 'Arquivo PDF anexado no menu de compartilhamento do seu dispositivo.');
        } else {
          triggerSuccessNotification('Alerta WhatsApp & Romaneio Gerado!', `PDF ${shareRes.filename} baixado e conversa aberta no WhatsApp.`);
        }
      } else {
        alert(res.error || 'Erro ao gerar alerta WhatsApp');
      }
    } catch (e: any) {
      alert('Erro: ' + e?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Disparo manual de E-mail
  const handleSendEmail = async () => {
    setIsProcessing(true);
    try {
      const res = await dispatchOSAlertsAction(os.id, ['EMAIL']);
      if (res.success) {
        triggerSuccessNotification('E-mail Despachado!', 'Notificação corporativa com layout JIMMP despachada com sucesso.');
      } else {
        alert(res.error || 'Erro ao disparar e-mail.');
      }
    } catch (e: any) {
      alert('Erro: ' + e?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans transition-all duration-200 ${
          isMaximized ? 'h-[96vh] max-w-[98vw]' : 'max-h-[90vh] max-w-4xl'
        }`}
      >
        {/* Barra de Título Superior Estilo Janela Executiva */}
        <div className="p-4 bg-slate-50 dark:bg-[#181A1E] border-b border-slate-150 dark:border-[#282A2F] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white font-['Hanken_Grotesk'] tracking-wide">
                  Ordem de Serviço #{os.numero_os || 'OS-PENDENTE'}
                </h3>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border ${critConfig.badge}`}>
                  {critConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                  Aberta em {os.data_abertura ? new Date(os.data_abertura).toLocaleString('pt-BR') : 'Data não informada'} • Viatura {viatura.prefixo_frota} ({viatura.placa})
                </p>

                {os.previsao_conclusao && (
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 ${
                    isAtrasada
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {isAtrasada ? '⚠️ SLA ATRASADO: ' : 'Previsão: '}
                    {new Date(os.previsao_conclusao).toLocaleDateString('pt-BR')}
                  </span>
                )}

                {(os.garantia_meses || os.garantia_km) && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#1C4E26] text-[#B7F365] border border-[#68D346] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Garantia: {os.garantia_meses ? `${os.garantia_meses}m` : ''} {os.garantia_km ? `${os.garantia_km}km` : ''}
                  </span>
                )}

                {isRecusada && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-600 text-white uppercase flex items-center gap-1">
                    <Ban className="w-3 h-3" /> Não Autorizada
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controles de Janela (Minimizar, Maximizar, Fechar) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsRomaneioOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282A2F] transition-colors cursor-pointer border border-slate-300 dark:border-[#3C3F45] bg-slate-100 dark:bg-[#282A2F]/50 flex items-center gap-1.5 text-[11px] font-bold font-mono uppercase mr-1"
              title="Visualizar e Imprimir Romaneio Oficial"
            >
              <Printer className="w-3.5 h-3.5 text-red-500" />
              <span>Romaneio</span>
            </button>

            {onMinimize && (
              <button
                type="button"
                onClick={() => onMinimize(os)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282A2F] transition-colors cursor-pointer border-none bg-transparent"
                title="Minimizar para o Dock"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#282A2F] transition-colors cursor-pointer border-none bg-transparent"
              title={isMaximized ? 'Restaurar tamanho' : 'Maximizar'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer border-none bg-transparent"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEPPER VISUAL DAS 6 ETAPAS DO WORKFLOW                                    */}
        {/* ========================================================================= */}
        <div className="p-4 bg-slate-100/50 dark:bg-[#121418] border-b border-slate-200 dark:border-[#282A2F] shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[620px] max-w-3xl mx-auto relative">
            {/* Linha de Conexão de Fundo */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 bg-slate-200 dark:bg-[#282A2F] z-0" />
            
            {/* Linha Ativa com Progresso Dinâmico */}
            <div 
              className="absolute top-1/2 left-4 h-0.5 -translate-y-1/2 bg-[#68D346] z-0 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, ((etapaNumeroAtual - 1) / 5) * 100))}%` }}
            />

            {ETAPAS_WORKFLOW_OS.map((def) => {
              const isPast = def.numero < etapaNumeroAtual;
              const isCurrent = def.numero === etapaNumeroAtual;
              const isFuture = def.numero > etapaNumeroAtual;

              return (
                <div key={def.etapa} className="flex flex-col items-center relative z-10 text-center group cursor-default">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-black transition-all ${
                    isPast 
                      ? 'bg-[#1C4E26] text-[#B7F365] border-2 border-[#68D346]' 
                      : isCurrent 
                        ? 'bg-gradient-to-tr from-[#1C4E26] to-[#68D346] text-white border-2 border-[#B7F365] shadow-[0_0_12px_#68D346] scale-110' 
                        : 'bg-slate-200 dark:bg-[#282A2F] text-slate-400 dark:text-zinc-500 border border-slate-300 dark:border-[#3C3F45]'
                  }`}>
                    {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : def.numero}
                  </div>

                  <span className={`text-[9px] font-mono mt-1 font-bold truncate max-w-[85px] ${
                    isCurrent ? 'text-slate-900 dark:text-[#B7F365]' : 'text-slate-400 dark:text-zinc-500'
                  }`}>
                    {def.titulo.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Abas Internas: Workflow, Custos, Trilha de Auditoria */}
        <div className="flex border-b border-slate-150 dark:border-[#282A2F] bg-slate-50 dark:bg-[#181A1E] text-xs font-mono shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('workflow')}
            className={`py-2.5 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workflow'
                ? 'border-[#68D346] text-[#1C4E26] dark:text-[#B7F365] bg-white dark:bg-[#1E2024]'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Workflow & Ações</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financeiro')}
            className={`py-2.5 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'financeiro'
                ? 'border-[#68D346] text-[#1C4E26] dark:text-[#B7F365] bg-white dark:bg-[#1E2024]'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Orçamento & Peças</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('auditoria')}
            className={`py-2.5 px-4 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'auditoria'
                ? 'border-[#68D346] text-[#1C4E26] dark:text-[#B7F365] bg-white dark:bg-[#1E2024]'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Trilha de Auditoria ({auditLogs.length})</span>
          </button>
        </div>

        {/* Corpo do Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs scrollbar-thin">

          {/* TAB 1: WORKFLOW & AÇÕES */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              {/* Banner de O.S. Não Autorizada / Recusada */}
              {isRecusada && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-400 dark:border-rose-900 shadow-md space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-mono">
                      <Ban className="w-4 h-4" />
                      ORDEM DE SERVIÇO NÃO AUTORIZADA / REJEITADA
                    </span>
                    <span className="text-[10px] font-mono text-rose-600 dark:text-rose-300 font-bold">
                      Viatura Liberada no Pátio
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Motivo da Recusa: <span className="font-normal italic">"{os.motivo_recusa || 'Não justificado'}"</span>
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                    Decidido por: <strong>{os.responsavel_recusa || 'Gestor Autorizado'}</strong>
                    {os.data_recusa ? ` em ${new Date(os.data_recusa).toLocaleString('pt-BR')}` : ''}
                  </p>
                </div>
              )}

              {/* Destaque da Etapa Atual */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 dark:from-[#181A1E] to-transparent border border-slate-200 dark:border-[#3C3F45] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#68D346] font-bold block">
                    Etapa {etapaNumeroAtual} de 6 • {ETAPAS_WORKFLOW_OS[etapaNumeroAtual - 1]?.titulo}
                  </span>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {ETAPAS_WORKFLOW_OS[etapaNumeroAtual - 1]?.descricao}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Status Atual: <strong>{os.status_os || os.status}</strong> | Aprovação: <strong>{os.status_aprovacao || 'PENDENTE'}</strong>
                  </p>
                </div>

                {/* Botões de Ação na Etapa */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {etapaAtual === '3_AGUARDANDO_APROVACAO' && !isRecusada && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleApprove}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1C4E26] to-[#68D346] hover:brightness-110 active:scale-95 text-white font-mono font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer border-none disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isProcessing ? 'Aprovando...' : 'Aprovar Agora (1 Clique)'}</span>
                    </button>
                  )}

                  {etapaNumeroAtual < 6 && etapaAtual !== '3_AGUARDANDO_APROVACAO' && !isRecusada && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleNextStep}
                      className="px-4 py-2 rounded-xl bg-[#282A2F] hover:bg-[#3C3F45] text-white font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer border border-[#3C3F45] disabled:opacity-50"
                    >
                      <span>Avançar Etapa</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {!['CONCLUIDA', 'REJEITADA', 'CANCELADA'].includes(os.status_os || os.status) && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setIsRejectModalOpen(true)}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Não autorizar continuidade dos reparos"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Não Autorizar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid 2 Colunas: Dados da Viatura & Alertas Omnichannel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Coluna 1: Dados da Viatura */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181A1E] border border-slate-200 dark:border-[#3C3F45] space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#282A2F]">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      Dados da Viatura
                    </span>
                    <span className="text-[10px] font-mono text-[#68D346] font-bold">
                      {viatura.contrato_id || 'ONÇA PUMA'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-mono uppercase">Prefixo:</span>
                      <span className="font-bold text-slate-800 dark:text-zinc-200">{viatura.prefixo_frota}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[9px] font-mono uppercase">Placa:</span>
                      <span className="font-bold text-slate-800 dark:text-zinc-200">{viatura.placa}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[9px] font-mono uppercase">Modelo:</span>
                      <span className="font-bold text-slate-800 dark:text-zinc-200">{viatura.marca} {viatura.modelo}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[9px] font-mono uppercase">Odômetro:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-zinc-200">
                        {Number(viatura.odometro_atual_km || 0).toLocaleString('pt-BR')} km
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#282A2F]">
                    <span className="text-slate-400 block text-[9px] font-mono uppercase">Diagnóstico / Defeito:</span>
                    <p className="text-slate-700 dark:text-zinc-300 text-xs mt-0.5 leading-relaxed">
                      "{os.descricao_motivo || os.descricao_servico || 'Não informado'}"
                    </p>
                  </div>
                </div>

                {/* Coluna 2: Disparo de Alertas Omnichannel */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181A1E] border border-slate-200 dark:border-[#3C3F45] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#282A2F]">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-[#68D346]" />
                        Alertas Externos Omnichannel
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">
                        WhatsApp & E-mail
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                      Dispare notificações instantâneas com o resumo executivo, link direto de aprovação e destaque cromático da criticidade.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleSendWhatsApp}
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#68D346] border border-emerald-500/30 font-mono font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="Enviar alerta estruturado via WhatsApp"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Direto</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleSendEmail}
                      className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="Enviar e-mail executivo com layout JIMMP"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>E-mail Corporativo</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Card de Componentes & Subcomponentes Flegados (Anatomia do Veículo) */}
              {os.resumo_anatomico && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181A1E] border border-slate-200 dark:border-[#3C3F45] space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#282A2F]">
                    <span className="text-[10px] font-mono uppercase text-[#68D346] font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#68D346]" />
                      Detalhamento Anatômico dos Subcomponentes Flegados
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Natureza: <strong>{os.tipo_manutencao || os.natureza_manutencao || 'CORRETIVA'}</strong>
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-zinc-200 font-mono whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-[#121418] p-3 rounded-xl border border-slate-200/60 dark:border-[#282A2F]">
                    {os.resumo_anatomico}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORÇAMENTO & PEÇAS */}
          {activeTab === 'financeiro' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181A1E] border border-slate-200 dark:border-[#3C3F45]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Custo Peças</span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-1 block">
                    {Number(os.custo_pecas || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181A1E] border border-slate-200 dark:border-[#3C3F45]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Custo Mão de Obra</span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-1 block">
                    {Number(os.custo_mao_de_obra || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181A1E] border border-slate-200 dark:border-[#3C3F45]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Custo Pneus</span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-1 block">
                    {Number(os.custo_pneus || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-[#B7F365] uppercase block font-bold">Valor Total OS</span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-[#68D346] mt-1 block">
                    {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Peças Substituídas */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#181A1E] border border-slate-200 dark:border-[#3C3F45] space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white font-mono">
                  Peças & Componentes Substituídos:
                </h4>
                {os.pecas_substituidas_json && os.pecas_substituidas_json.length > 0 ? (
                  <div className="space-y-1">
                    {os.pecas_substituidas_json.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-[#121418] text-xs">
                        <span>{p.quantidade}x {p.peca}</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                          {p.valor_unitario ? Number(p.valor_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">Nenhuma peça discriminada individualmente.</p>
                )}
              </div>

              {/* Mapa de Cotações Concorrentes Registradas */}
              {os.orcamentos_concorrentes_json && os.orcamentos_concorrentes_json.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181A1E] border border-slate-200 dark:border-[#3C3F45] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#282A2F]">
                    <span className="text-[10px] font-mono uppercase text-amber-500 font-bold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      Cotações Concorrentes Comparadas ({os.orcamentos_concorrentes_json.length})
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Concorrência de Preço e Prazos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {os.orcamentos_concorrentes_json.map((cot, idx) => (
                      <div
                        key={cot.id || idx}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          cot.selecionada
                            ? 'bg-[#1C4E26]/20 border-[#68D346] shadow-2xs'
                            : 'bg-slate-50 dark:bg-[#121418] border-slate-200 dark:border-[#282A2F]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-zinc-200 truncate">{cot.oficina_nome}</span>
                          {cot.selecionada && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono bg-[#68D346] text-slate-950 uppercase">
                              🏆 Vencedora
                            </span>
                          )}
                        </div>
                        <p className="font-mono font-black text-sm text-emerald-600 dark:text-[#68D346]">
                          {Number(cot.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <div className="text-[10px] text-slate-500 font-mono flex justify-between pt-1 border-t border-slate-200/60 dark:border-[#282A2F]">
                          <span>Prazo: {cot.prazo_dias ? `${cot.prazo_dias}d` : '-'}</span>
                          <span>Garantia: {cot.garantia_meses ? `${cot.garantia_meses}m` : '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orçamentos Aditivos / Complementares Registrados */}
              {os.orcamentos_aditivos_json && os.orcamentos_aditivos_json.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181A1E] border border-slate-200 dark:border-[#3C3F45] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#282A2F]">
                    <span className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Orçamentos Complementares / Aditivos ({os.orcamentos_aditivos_json.length})
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Defeitos identificados durante os reparos
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {os.orcamentos_aditivos_json.map((adit, idx) => (
                      <div
                        key={adit.id || idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#282A2F] flex items-center justify-between text-xs gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                            #{adit.numero_aditivo} • {adit.descricao}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Motivo: <em>{adit.motivo}</em>
                            {adit.prazo_adicional_dias ? ` • +${adit.prazo_adicional_dias} dias` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-black text-emerald-600 dark:text-[#68D346]">
                            + {Number(adit.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            adit.status === 'APROVADO'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : adit.status === 'REJEITADO'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {adit.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRILHA DE AUDITORIA */}
          {activeTab === 'auditoria' && (
            <div className="space-y-3">
              {loadingAudit ? (
                <div className="py-8 text-center text-xs font-mono text-slate-400 animate-pulse">
                  Carregando histórico de auditoria...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs font-sans text-slate-400">
                  Nenhum registro de transição gravado para esta OS ainda.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#282A2F]">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative text-xs">
                      {/* Ponto indicador */}
                      <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#1C4E26] border-2 border-[#68D346]" />
                      
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181A1E] border border-slate-200 dark:border-[#282A2F] space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="font-black text-[#68D346]">
                            {log.etapa_nova}
                          </span>
                          <span className="text-slate-400">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-zinc-300 font-bold">
                          {log.observacao || 'Transição de etapa executada.'}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono">
                          Responsável: <strong>{log.responsavel_nome}</strong> • Tipo: {log.tipo_transicao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Rodapé da Janela */}
        <div className="p-4 bg-slate-50 dark:bg-[#181A1E] border-t border-slate-150 dark:border-[#282A2F] flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#68D346]" />
            <span>Assinatura Digital & Trilha Imutável Ativa</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRomaneioOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Romaneio Oficial</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#282A2F] hover:bg-slate-300 dark:hover:bg-[#3C3F45] text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer border-none"
            >
              Fechar
            </button>
          </div>
        </div>
      </motion.div>

      {/* MODAL DE CONFIRMAÇÃO PARA NÃO AUTORIZAR / RECUSAR OS */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#1E2024] border border-rose-300 dark:border-rose-900 rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-rose-200 dark:border-rose-900/50">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold shrink-0">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-rose-700 dark:text-rose-400 font-mono">
                    Não Autorizar / Recusar O.S. #{os.numero_os}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400">
                    A viatura será liberada no pátio e a justificativa gravada na auditoria.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-700 dark:text-zinc-300 mb-1">
                  Justificativa / Motivo da Não Autorização *
                </label>
                <textarea
                  rows={3}
                  value={motivoRecusaInput}
                  onChange={(e) => setMotivoRecusaInput(e.target.value)}
                  placeholder="Informe detalhadamente por que a manutenção não foi aprovada (ex: orçamento acima do teto orçamentário, viatura em desmobilização, inviabilidade técnica)..."
                  className="w-full bg-slate-50 dark:bg-[#121418] border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-rose-600"
                  required
                />
              </div>

              <div className="flex justify-end items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 uppercase cursor-pointer border-none bg-transparent"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRejectOS}
                  disabled={isProcessing || !motivoRecusaInput.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer border-none disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Gravando Recusa...' : 'Confirmar Não Autorização'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DO RELATÓRIO EXECUTIVO DA OS (ROMANEIO) */}
      <OSRomaneioModal
        isOpen={isRomaneioOpen}
        onClose={() => setIsRomaneioOpen(false)}
        os={os}
        viatura={viatura}
        oficina={os.oficina || null}
        emitenteNome={os.responsavel_abertura || 'Inspetor de Frotas SPCI'}
        aprovadorNome={userProfile?.name || currentUser?.displayName || 'Gestor Responsável SPCI'}
      />
    </div>
  );
};

export default OSDetailModal;
