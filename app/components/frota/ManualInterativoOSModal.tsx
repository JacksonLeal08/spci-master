'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Share2, 
  FileText, 
  Ban, 
  Check, 
  ChevronRight, 
  HelpCircle,
  Car,
  DollarSign,
  Maximize2,
  Minimize2,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ManualInterativoOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export const ManualInterativoOSModal: React.FC<ManualInterativoOSModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'MODALIDADES'
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [modalidadeSimulada, setModalidadeSimulada] = useState<'PREVENTIVA' | 'CORRETIVA' | 'EMERGENCIAL'>('CORRETIVA');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySummary = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`bg-[#0F1115] text-slate-100 rounded-3xl border border-[#232730] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 w-full ${
          isMaximized ? 'h-[98vh] max-w-[98vw]' : 'h-[90vh] max-w-6xl'
        }`}
      >
        {/* ==================================================================== */}
        {/* TOP BAR / HEADER COM ÍCONE 3D LUXUOSO E TITÂNIO METÁLICO             */}
        {/* ==================================================================== */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#14171E] via-[#1A1E26] to-[#121419] border-b border-[#262A34] flex items-center justify-between gap-4 select-none shrink-0">
          <div className="flex items-center gap-3.5">
            {/* Ícone 3D em Destaque */}
            <div className="relative group shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-br from-[#68D346] via-[#2A3B28] to-[#12151B] shadow-lg shadow-[#68D346]/20 border border-[#68D346]/40 transition-transform group-hover:scale-105">
                <img 
                  src="/images/manual_os_icon_3d.jpg" 
                  alt="Manual 3D de Ordem de Serviço"
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={(e) => {
                    // Fallback visual com ícone caso a imagem local demore
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-[#68D346] text-[#0A0D08] font-black text-[9px] uppercase tracking-wider shadow">
                3D GUIA
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1C4E26] text-[#B7F365] border border-[#68D346]/40">
                  DOCUMENTAÇÃO INTERATIVA • SIGER MASTER
                </span>
                <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
                  v2.5 • Frotas SPCI
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                Manual Operacional de Ordens de Serviço
              </h2>
              <p className="text-xs text-slate-400">
                Guia minucioso passo a passo: Modalidades, Cotações, Prazos de SLA, Garantias e Romaneio.
              </p>
            </div>
          </div>

          {/* Controles de Janela */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition border-none bg-transparent cursor-pointer"
              title={isMaximized ? 'Restaurar Janela' : 'Maximizar'}
            >
              {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition border-none bg-transparent cursor-pointer"
              title="Fechar Manual (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* BARRA DE NAVEGAÇÃO / ABAS INTERATIVAS & BUSCA RÁPIDA                 */}
        {/* ==================================================================== */}
        <div className="px-4 py-3 bg-[#111317] border-b border-[#21242C] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          {/* Abas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {[
              { id: 'MODALIDADES', label: '1. As 3 Modalidades', icon: Wrench },
              { id: 'PASSO_A_PASSO', label: '2. Passo a Passo', icon: BookOpen },
              { id: 'COTACOES', label: '3. Mapa 3 Oficinas', icon: Layers },
              { id: 'PRAZOS_GARANTIA', label: '4. SLA & Garantias', icon: Clock },
              { id: 'ADITIVOS', label: '5. Aditivos Ocultos', icon: DollarSign },
              { id: 'RECUSA', label: '6. Não Autorizadas', icon: Ban },
              { id: 'ROMANEIO_WPP', label: '7. Romaneio & WhatsApp', icon: Share2 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-gradient-to-r from-[#1C4E26] to-[#122A17] text-[#B7F365] border-[#68D346] shadow-sm shadow-[#68D346]/20'
                      : 'bg-[#181B22] text-slate-400 border-[#262A34] hover:text-white hover:bg-[#20242D]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar no manual (ex: garantia, recusa)..."
              className="w-full bg-[#181B22] border border-[#282C37] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#68D346] transition"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white border-none bg-transparent cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* CORPO DO MANUAL: CONTEÚDO MINUCIOSO E INTERATIVO                      */}
        {/* ==================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gradient-to-b from-[#0F1115] via-[#101217] to-[#0A0C0E]">

          {/* ================================================================== */}
          {/* ABA 1: AS TRÊS MODALIDADES TÉCNICAS DE O.S. (COM SIMULADOR AO VIVO)  */}
          {/* ================================================================== */}
          {activeTab === 'MODALIDADES' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
              {/* Card de Boas-Vindas */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#172019] via-[#151A22] to-[#12151B] border border-[#2C4A28] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#B7F365] font-mono text-xs font-bold uppercase">
                    <Sparkles className="w-4 h-4" /> Matriz Operacional de Manutenção
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Qual das 3 modalidades você deve selecionar?
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    A seleção da modalidade afeta diretamente a prioridade de atendimento da oficina, o bloqueio ou disponibilidade da viatura no pátio e o prazo estipulado para devolução.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopySummary(
                    'MODALIDADES DE OS:\n1. PREVENTIVA: Revisão por tempo/KM (Óleo, filtros). Viatura mantida em operação até o agendamento.\n2. CORRETIVA: Reparo de anomalias pontuais (freios, suspensão).\n3. EMERGENCIAL: Quebra crítica ou sinistro (motor, câmbio). Bloqueia viatura imediatamente.',
                    'modalidades'
                  )}
                  className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-[#1C4E26] hover:bg-[#68D346] hover:text-slate-950 text-[#B7F365] transition border border-[#68D346]/40 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedSection === 'modalidades' ? 'Copiado!' : 'Copiar Resumo'}
                </button>
              </div>

              {/* Seletor do Simulador Interativo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Simulador Interativo: Selecione uma modalidade para ver o comportamento do sistema
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Botão Modalidade 1 */}
                  <div 
                    onClick={() => setModalidadeSimulada('PREVENTIVA')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      modalidadeSimulada === 'PREVENTIVA'
                        ? 'bg-emerald-950/30 border-[#68D346] ring-2 ring-[#68D346]/40 shadow-lg shadow-[#68D346]/10'
                        : 'bg-[#15181F] border-[#262A34] hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        MODALIDADE 01
                      </span>
                      <CheckCircle2 className={`w-4 h-4 ${modalidadeSimulada === 'PREVENTIVA' ? 'text-[#68D346]' : 'text-slate-600'}`} />
                    </div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      🟢 Preventiva Programada
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Manutenção periódica baseada em hodômetro (KM) ou calendário contratual.
                    </p>
                  </div>

                  {/* Botão Modalidade 2 */}
                  <div 
                    onClick={() => setModalidadeSimulada('CORRETIVA')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      modalidadeSimulada === 'CORRETIVA'
                        ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                        : 'bg-[#15181F] border-[#262A34] hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        MODALIDADE 02
                      </span>
                      <CheckCircle2 className={`w-4 h-4 ${modalidadeSimulada === 'CORRETIVA' ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      🟡 Corretiva Programada
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Reparo de desgastes e anomalias que permitem o agendamento prévio da oficina.
                    </p>
                  </div>

                  {/* Botão Modalidade 3 */}
                  <div 
                    onClick={() => setModalidadeSimulada('EMERGENCIAL')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      modalidadeSimulada === 'EMERGENCIAL'
                        ? 'bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/10'
                        : 'bg-[#15181F] border-[#262A34] hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        MODALIDADE 03
                      </span>
                      <CheckCircle2 className={`w-4 h-4 ${modalidadeSimulada === 'EMERGENCIAL' ? 'text-rose-400' : 'text-slate-600'}`} />
                    </div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      🔴 Emergencial (Pane Crítica)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Quebra súbita ou sinistro que impede totalmente o veículo de continuar operando.
                    </p>
                  </div>
                </div>
              </div>

              {/* Painel do Simulador com Detalhes da Modalidade Selecionada */}
              <div className="p-5 rounded-2xl bg-[#141820] border border-[#272D3B] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#232834]">
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    {modalidadeSimulada === 'PREVENTIVA' && '📋 Diagnóstico do Sistema para Modalidade: PREVENTIVA'}
                    {modalidadeSimulada === 'CORRETIVA' && '📋 Diagnóstico do Sistema para Modalidade: CORRETIVA'}
                    {modalidadeSimulada === 'EMERGENCIAL' && '📋 Diagnóstico do Sistema para Modalidade: EMERGENCIAL'}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    Regra Automática SPCI
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#222632] space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Impacto na Viatura</span>
                    <p className="font-bold text-slate-200">
                      {modalidadeSimulada === 'PREVENTIVA' && 'Permanece DISPONÍVEL até data agendada'}
                      {modalidadeSimulada === 'CORRETIVA' && 'Permanece DISPONÍVEL ou aguardando peças'}
                      {modalidadeSimulada === 'EMERGENCIAL' && '⛔ Bloqueio IMEDIATO no Pátio (EM_MANUTENCAO)'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#222632] space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Prazo Padrão (SLA)</span>
                    <p className="font-bold text-slate-200">
                      {modalidadeSimulada === 'PREVENTIVA' && '1 a 2 dias úteis'}
                      {modalidadeSimulada === 'CORRETIVA' && '2 a 5 dias úteis (conforme peças)'}
                      {modalidadeSimulada === 'EMERGENCIAL' && '⚡ Atendimento Máximo em 24h'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#222632] space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Garantia Recomendada</span>
                    <p className="font-bold text-slate-200">
                      {modalidadeSimulada === 'PREVENTIVA' && '3 meses ou 5.000 km'}
                      {modalidadeSimulada === 'CORRETIVA' && '3 a 6 meses ou 10.000 km'}
                      {modalidadeSimulada === 'EMERGENCIAL' && '🛡️ Mínimo 6 a 12 meses (motor/câmbio)'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#222632] space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Mapa de Cotações</span>
                    <p className="font-bold text-slate-200">
                      {modalidadeSimulada === 'PREVENTIVA' && 'Opcional (tabela contratual fixa)'}
                      {modalidadeSimulada === 'CORRETIVA' && 'Recomendado 3 Oficinas Concorrentes'}
                      {modalidadeSimulada === 'EMERGENCIAL' && 'Oficina mais próxima ou homologada'}
                    </p>
                  </div>
                </div>

                {/* Exemplo Real de Preenchimento */}
                <div className="p-3.5 rounded-xl bg-[#0F1218] border border-dashed border-[#31394B] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] font-bold">
                    <HelpCircle className="w-3.5 h-3.5 text-[#68D346]" />
                    Exemplo Real de Preenchimento no Formulário:
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    {modalidadeSimulada === 'PREVENTIVA' && '"Revisão periódica dos 50.000 km conforme plano de manutenção. Substituição de óleo lubrificante do motor 5W30, filtro de óleo, filtro de combustível, filtro de ar e conferência dos níveis de fluido de freio e arrefecimento."'}
                    {modalidadeSimulada === 'CORRETIVA' && '"Motorista relatou chiado agudo ao acionar os freios dianteiros e vibração na direção acima de 60 km/h. Verificado desgaste excessivo das pastilhas e empenamento leve dos discos de freio ventilados."'}
                    {modalidadeSimulada === 'EMERGENCIAL' && '"Pane mecânica durante ronda na mina: superaquecimento com rompimento de mangueira superior do radiador e perda total do líquido de arrefecimento. Veículo rebocado de guincho até a oficina credenciada."'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* ABA 2: PASSO A PASSO DETALHADO DO FORMULÁRIO                       */}
          {/* ================================================================== */}
          {activeTab === 'PASSO_A_PASSO' && (
            <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-[#14171E] border border-[#262C38] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">Fluxo Completo de Abertura (Passo a Passo)</h3>
                  <p className="text-xs text-slate-400">Siga as 4 etapas estruturadas dentro do Modal da Ordem de Serviço.</p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#1C4E26] text-[#B7F365] border border-[#68D346]">
                  4 ETAPAS INTEGRADAS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Passo 1 */}
                <div className="p-4 rounded-2xl bg-[#13161D] border border-[#242935] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#68D346] text-slate-950 font-black text-xs flex items-center justify-center">1</span>
                    <h4 className="text-sm font-bold text-white">Aba DADOS: Viatura & Cronograma</h4>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                    <li><strong>Selecione a Viatura:</strong> O sistema puxa automaticamente placa, modelo e hodômetro atual.</li>
                    <li><strong>Defina a Natureza:</strong> Escolha Preventiva, Corretiva ou Emergencial.</li>
                    <li><strong>Hodômetro de Entrada:</strong> Confirme a quilometragem exibida no painel.</li>
                    <li><strong>Data Prevista de Conclusão:</strong> Estipule o dia e a hora de término prometida.</li>
                    <li><strong>Garantia Assegurada:</strong> Cadastre a garantia geral (ex: 3 meses ou 5.000 km).</li>
                  </ul>
                </div>

                {/* Passo 2 */}
                <div className="p-4 rounded-2xl bg-[#13161D] border border-[#242935] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#68D346] text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                    <h4 className="text-sm font-bold text-white">Aba ANATOMIA VEICULAR: Peças & Serviços</h4>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                    <li><strong>Navegue pelos Sistemas:</strong> Motor, Freios, Suspensão, Câmbio, Elétrica, etc.</li>
                    <li><strong>Marque o Subcomponente:</strong> Selecione a peça exata que sofrerá intervenção.</li>
                    <li><strong>Defina a Ação Técnica:</strong> Substituição, Reparo, Retífica ou Ajuste.</li>
                    <li><strong>Estipule Quantidade e Valor Unitário:</strong> Facilita o rateio e o controle orçamentário.</li>
                  </ul>
                </div>

                {/* Passo 3 */}
                <div className="p-4 rounded-2xl bg-[#13161D] border border-[#242935] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#68D346] text-slate-950 font-black text-xs flex items-center justify-center">3</span>
                    <h4 className="text-sm font-bold text-white">Aba ORÇAMENTOS: Mapa de Cotações</h4>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                    <li><strong>Cadastre até 3 Propostas:</strong> Nome da oficina, valor total, dias de prazo e garantia.</li>
                    <li><strong>Compare Lado a Lado:</strong> O sistema coloca as 3 opções numa grade comparativa clara.</li>
                    <li><strong>Clique em Escolher Proposta:</strong> Sincroniza o fornecedor vencedor, a data e a garantia com a O.S. principal.</li>
                  </ul>
                </div>

                {/* Passo 4 */}
                <div className="p-4 rounded-2xl bg-[#13161D] border border-[#242935] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#68D346] text-slate-950 font-black text-xs flex items-center justify-center">4</span>
                    <h4 className="text-sm font-bold text-white">Salvar & Gerar Romaneio Oficial</h4>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                    <li><strong>Clique em Salvar e Gerar O.S.:</strong> A O.S. é gravada e a viatura é atualizada no pátio.</li>
                    <li><strong>Abra o Romaneio Oficial:</strong> Folha técnica pronta para impressão ou PDF vetorial.</li>
                    <li><strong>Envie por WhatsApp:</strong> Dispare a mensagem estruturada com link e PDF anexo para o prestador.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* ABA 3: MAPA COMPARATIVO DE COTAÇÕES (ATÉ 3 OFICINAS)                */}
          {/* ================================================================== */}
          {activeTab === 'COTACOES' && (
            <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-[#141820] border border-[#282F3E] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">Mapa Comparativo de Cotações Concorrentes</h3>
                  <p className="text-xs text-slate-400">Como comparar Preço, Prazo e Período de Garantia entre até 3 oficinas.</p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-blue-950/60 text-blue-400 border border-blue-600/40">
                  CONCORRÊNCIA TRANSPARENTE
                </span>
              </div>

              {/* Simulação Visual de 3 Cards Lado a Lado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#14161D] border border-[#282C38] space-y-2 opacity-80">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Oficina 01</span>
                    <span className="text-slate-500">Candidata</span>
                  </div>
                  <h5 className="font-bold text-white text-xs">Mecânica Central Diesel</h5>
                  <p className="text-base font-black font-mono text-slate-300">R$ 4.200,00</p>
                  <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800 pt-1.5">
                    <div>Prazo: <strong>5 dias úteis</strong></div>
                    <div>Garantia: <strong>3 meses (5.000 km)</strong></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#17251B] to-[#121B15] border-2 border-[#68D346] space-y-2 shadow-lg shadow-[#68D346]/10">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#B7F365] font-bold">Oficina 02</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#68D346] text-slate-950 font-bold uppercase text-[8.5px]">🏆 Vencedora</span>
                  </div>
                  <h5 className="font-bold text-white text-xs">Auto Mecânica Parauapebas</h5>
                  <p className="text-base font-black font-mono text-[#68D346]">R$ 3.850,00</p>
                  <div className="text-[10px] text-slate-300 space-y-0.5 border-t border-emerald-900/60 pt-1.5">
                    <div>Prazo: <strong>3 dias úteis</strong> (Menor Prazo!)</div>
                    <div>Garantia: <strong className="text-[#B7F365]">6 meses (10.000 km)</strong> (Melhor Garantia!)</div>
                  </div>
                  <div className="text-[9px] font-mono text-emerald-400 pt-1">
                    ✓ Sincronizado automaticamente na O.S.
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#14161D] border border-[#282C38] space-y-2 opacity-80">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Oficina 03</span>
                    <span className="text-slate-500">Candidata</span>
                  </div>
                  <h5 className="font-bold text-white text-xs">Truck Carajás Reparos</h5>
                  <p className="text-base font-black font-mono text-slate-300">R$ 4.500,00</p>
                  <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800 pt-1.5">
                    <div>Prazo: <strong>2 dias úteis</strong></div>
                    <div>Garantia: <strong>3 meses (3.000 km)</strong></div>
                  </div>
                </div>
              </div>

              {/* Dica Operacional */}
              <div className="p-4 rounded-xl bg-[#12151D] border border-blue-900/40 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Regra de Compliance & Escolha da Proposta
                </div>
                <p>
                  Ao clicar em <strong>"Escolher Proposta"</strong>, o SIGER Master não olha apenas o menor preço: ele copia os dias de prazo para calcular automaticamente a <strong>Data Prevista de Conclusão</strong> e vincula o <strong>Período de Garantia</strong> na ficha da O.S. e no Romaneio.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* ABA 4: GESTÃO DE PRAZOS, SLA E GARANTIAS POR COMPONENTE            */}
          {/* ================================================================== */}
          {activeTab === 'PRAZOS_GARANTIA' && (
            <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-[#141820] border border-[#282F3E] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">Controle de SLA & Garantia de Peças Críticas</h3>
                  <p className="text-xs text-slate-400">Como evitar atrasos de oficina e garantir a cobertura de peças no pós-reparo.</p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-600/40">
                  MONITORAMENTO ATIVO
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SLA Atrasado */}
                <div className="p-4 rounded-2xl bg-[#14161D] border border-rose-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 animate-bounce" /> Alerta Visual de SLA Atrasado
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sempre que a <strong>Previsão de Conclusão</strong> expirar e a O.S. ainda estiver em status <em>Aberta</em>, <em>Em Execução</em> ou <em>Aguardando Peças</em>:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                    <li>O card no Kanban recebe uma tarja vermelha pulsante <strong>SLA ATRASADO</strong>.</li>
                    <li>No cabeçalho do Romaneio e no modal, a data fica estampada em vermelho com advertência.</li>
                    <li>O gestor tem subsídio para acionar o encarregado da oficina imediatamente.</li>
                  </ul>
                </div>

                {/* Garantia de Peças Críticas */}
                <div className="p-4 rounded-2xl bg-[#14161D] border border-emerald-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-[#68D346] font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" /> Garantia Geral vs Subcomponentes
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Você pode estipular a garantia em dois níveis complementares:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                    <li><strong>Garantia Geral da O.S.:</strong> Cobertura para toda a mão de obra da ordem (ex: 3 meses).</li>
                    <li><strong>Garantia de Componentes Críticos:</strong> Ao adicionar componentes no motor, câmbio ou bomba injetora, informe prazos estendidos (ex: 12 meses ou 20.000 km) para resguardar a empresa em caso de nova falha prematura.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* ABA 5: ORÇAMENTOS ADITIVOS PARA DEFEITOS OCULTOS                   */}
          {/* ================================================================== */}
          {activeTab === 'ADITIVOS' && (
            <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-[#141820] border border-[#282F3E] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">Orçamentos Complementares (Aditivos da O.S.)</h3>
                  <p className="text-xs text-slate-400">O que fazer quando a oficina desmonta o veículo e encontra novos problemas?</p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-600/40">
                  DEFEITOS OCULTOS
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#13161D] border border-[#242935] space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  🛠️ Fluxo de Solicitação e Aprovação de Aditivo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#20242F] space-y-1">
                    <span className="font-mono text-[#68D346] font-bold">Passo 1: Lançar</span>
                    <p className="text-slate-300">Acesse a aba <strong>Rateio & Notas</strong> e localize a seção <em>Orçamentos Complementares / Aditivos</em>.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#20242F] space-y-1">
                    <span className="font-mono text-[#68D346] font-bold">Passo 2: Justificar</span>
                    <p className="text-slate-300">Descreva o defeito oculto (ex: <em>"Volante do motor trincado após retirar o câmbio"</em>), o valor adicional e o acréscimo de dias.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#20242F] space-y-1">
                    <span className="font-mono text-[#68D346] font-bold">Passo 3: Aprovar</span>
                    <p className="text-slate-300">O gestor seleciona <strong>Aprovado</strong> ou <strong>Rejeitado</strong>. Somente os aditivos aprovados são somados ao custo total.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* ABA 6: ORDENS NÃO AUTORIZADAS / RECUSADAS                         */}
          {/* ================================================================== */}
          {activeTab === 'RECUSA' && (
            <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/60 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-rose-400">Controle de Ordens Não Autorizadas / Recusadas</h3>
                  <p className="text-xs text-rose-300/80">Procedimento de compliance quando o orçamento for reprovado pela gestão.</p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-rose-900/60 text-rose-300 border border-rose-700/60">
                  ETAPA 07 • AUDITORIA
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#14161D] border border-rose-900/40 space-y-3 text-xs text-slate-300">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  ⛔ O que acontece quando você clica em "Não Autorizar OS"?
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#20242F] space-y-1">
                    <span className="font-bold text-rose-400 font-mono">1. Justificativa Obrigatória</span>
                    <p className="text-slate-400">O sistema exige o preenchimento detalhado do motivo da recusa (ex: <em>"Preço abusivo"</em>, <em>"Veículo em fase de desmobilização"</em>).</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#20242F] space-y-1">
                    <span className="font-bold text-emerald-400 font-mono">2. Liberação da Viatura</span>
                    <p className="text-slate-400">O veículo deixa de estar bloqueado em manutenção e volta imediatamente para status <strong>OPERACIONAL / DISPONÍVEL</strong> no pátio.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0D0F14] border border-[#20242F] space-y-1">
                    <span className="font-bold text-blue-400 font-mono">3. Auditoria Permanente</span>
                    <p className="text-slate-400">A ordem vai para o filtro <strong>07 - Não Autorizadas</strong>, mantendo carimbo com o nome do gestor que recusou e a data.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* ABA 7: ROMANEIO OFICIAL & ENVIO VIA WHATSAPP                       */}
          {/* ================================================================== */}
          {activeTab === 'ROMANEIO_WPP' && (
            <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-[#141820] border border-[#282F3E] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">Romaneio Oficial & Compartilhamento Híbrido</h3>
                  <p className="text-xs text-slate-400">Como imprimir a folha formal e enviar o documento em PDF pelo WhatsApp.</p>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#1C4E26] text-[#B7F365] border border-[#68D346]">
                  PDF VETORIAL + WHATSAPP
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#13161D] border border-[#242935] space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <FileText className="w-4 h-4 text-emerald-400" /> Folha do Romaneio de Encaminhamento
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    O Romaneio é o documento oficial que acompanha o motorista até a oficina. Ele contém:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                    <li>Código do Protocolo e identificação da viatura.</li>
                    <li>Tabela detalhada de componentes anatômicos requeridos.</li>
                    <li>Previsão de término prometida e termo de garantia assegurada.</li>
                    <li>Seção de 3 assinaturas bilaterais (Inspetor Emitente, Oficina e Gestor).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#13161D] border border-[#242935] space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Share2 className="w-4 h-4 text-emerald-400" /> Envio Híbrido pelo WhatsApp
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ao clicar no botão de WhatsApp do Romaneio:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                    <li><strong>No Celular (Mobile):</strong> O sistema anexa o arquivo PDF oficial diretamente na conversa via compartilhamento nativo.</li>
                    <li><strong>No Computador (Desktop):</strong> O sistema baixa o PDF instantaneamente no seu PC e abre o WhatsApp Web com a mensagem estruturada e link para consulta.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ==================================================================== */}
        {/* RODAPÉ DO MANUAL COM BOTÃO DE FECHAR E DICA                          */}
        {/* ==================================================================== */}
        <div className="p-4 bg-[#111317] border-t border-[#232731] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#68D346]" />
            <span>Documentação técnica conforme Diretrizes de Gestão de Frotas SPCI & Complexo Carajás.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-mono font-black uppercase bg-[#68D346] hover:bg-[#B7F365] text-slate-950 transition border-none cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#68D346]/20"
          >
            <Check className="w-4 h-4" />
            Entendido / Fechar Manual
          </button>
        </div>
      </div>
    </div>
  );
};
