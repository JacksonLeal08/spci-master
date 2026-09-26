'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Printer, 
  Share2, 
  Mail, 
  Check, 
  Copy, 
  Wrench, 
  Truck, 
  Building2, 
  Calendar, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Layers, 
  Send,
  AlertTriangle,
  Download
} from 'lucide-react';
import { OrdemServicoFrota, Viatura, OficinaPrestador } from '@/lib/types/frota';
import { SubcomponenteSelecionado } from '@/lib/types/vehicleAnatomy';
import { 
  formatFriendlyRomaneioProtocol, 
  generateRomaneioPDF, 
  downloadRomaneioPDF, 
  shareRomaneioWhatsAppHybrid 
} from '@/lib/osRomaneioReports';
import { dispatchOSAlertsAction } from '@/app/actions/osWorkflowActions';
import { useSpci } from '@/app/context/SpciContext';

interface OSRomaneioModalProps {
  isOpen: boolean;
  onClose: () => void;
  os: OrdemServicoFrota | null;
  viatura?: Viatura | null;
  oficina?: OficinaPrestador | null;
  emitenteNome?: string;
  aprovadorNome?: string;
}

export const OSRomaneioModal: React.FC<OSRomaneioModalProps> = ({
  isOpen,
  onClose,
  os,
  viatura,
  oficina,
  emitenteNome = 'Inspetor de Frotas SPCI',
  aprovadorNome = 'Gestor Responsável SPCI'
}) => {
  const { triggerSuccessNotification } = useSpci();
  const [copied, setCopied] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  if (!isOpen || !os) return null;

  const proto = formatFriendlyRomaneioProtocol(
    os.id || os.numero_os,
    os.data_abertura || os.created_at,
    viatura?.prefixo_frota
  );

  const prioridade = (os.prioridade || 'NORMAL').toUpperCase();
  const componentes: SubcomponenteSelecionado[] = (os.itens_componentes_json || []) as SubcomponenteSelecionado[];

  const custoPecas = Number(os.custo_pecas || 0);
  const custoMaoObra = Number(os.custo_mao_de_obra || 0);
  const custoPneus = Number(os.custo_pneus || 0);
  const custoTotal = Number(os.custo_total || os.valor_estimado || (custoPecas + custoMaoObra + custoPneus));

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Disparo Híbrido de WhatsApp com Romaneio Anexado (Opções 1 + 2)
  const handleShareWhatsApp = async () => {
    if (!os?.id) return;
    setIsSendingAlert(true);
    try {
      const res = await shareRomaneioWhatsAppHybrid({
        os,
        viatura,
        oficina,
        emitenteNome,
        aprovadorNome
      });
      if (res.sharedVia === 'native_share') {
        triggerSuccessNotification('WhatsApp / Romaneio Aberto!', 'Arquivo PDF anexado no menu de compartilhamento do seu dispositivo.');
      } else {
        triggerSuccessNotification('Romaneio Baixado & WhatsApp Aberto!', `O arquivo ${res.filename} foi salvo em Downloads e a conversa foi iniciada.`);
      }
    } catch (e: any) {
      alert('Erro ao compartilhar via WhatsApp: ' + e?.message);
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Download direto do PDF no dispositivo
  const handleDownloadPDF = async () => {
    if (!os) return;
    try {
      setIsSendingAlert(true);
      const filename = await downloadRomaneioPDF({
        os,
        viatura,
        oficina,
        emitenteNome,
        aprovadorNome
      });
      triggerSuccessNotification('PDF Gerado!', `Arquivo ${filename} baixado com sucesso.`);
    } catch (e: any) {
      alert('Erro ao gerar download: ' + e?.message);
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Disparo manual de E-mail com o Romaneio
  const handleShareEmail = async () => {
    if (!os.id) return;
    setIsSendingAlert(true);
    try {
      const res = await dispatchOSAlertsAction(os.id, ['EMAIL']);
      if (res.success) {
        triggerSuccessNotification('E-mail do Romaneio Enviado!', 'Cópia executiva do Romaneio despachada para o aprovador.');
      } else {
        alert(res.error || 'Erro ao enviar e-mail com Romaneio.');
      }
    } catch (e: any) {
      alert('Erro: ' + e?.message);
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handlePrint = () => {
    generateRomaneioPDF({
      os,
      viatura,
      oficina,
      emitenteNome,
      aprovadorNome
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#1E2024] border border-slate-200 dark:border-[#3C3F45] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Barra Superior Executiva */}
        <div className="px-6 py-4 bg-slate-100 dark:bg-[#181A1E] border-b border-slate-200 dark:border-[#282A2F] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 font-mono">
                  RELATÓRIO EXECUTIVO DA O.S.
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono ${
                  prioridade === 'EMERGENCIA' 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : prioridade === 'URGENTE' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-emerald-600 text-white'
                }`}>
                  {prioridade}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase font-['Hanken_Grotesk'] tracking-tight">
                Romaneio de Encaminhamento & Vistoria
              </h2>
            </div>
          </div>

          {/* Protocolo Rastreável & Ações Rápidas */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/70 dark:bg-[#282A2F] border border-slate-300 dark:border-[#3C3F45] font-mono text-xs font-bold text-slate-800 dark:text-[#B7F365]">
              <span>{proto.shortCode}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(proto.shortCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                title="Copiar protocolo"
                className="hover:text-white transition cursor-pointer p-0.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isSendingAlert}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Baixar arquivo PDF no dispositivo"
            >
              <Download className="w-3.5 h-3.5 text-[#B7F365]" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Relatório com Estilo Visual Corporativo SPCI */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card Bilateral: Viatura vs Oficina Credenciada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco Viatura */}
            <div className="bg-slate-50 dark:bg-[#282A2F]/60 border border-slate-200 dark:border-[#3C3F45] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#3C3F45] pb-2">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-[#D5D9DC] flex items-center gap-1.5 font-mono">
                  <Truck className="w-4 h-4 text-red-500" />
                  1. Dados da Viatura
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {os.contrato_id || viatura?.contrato_id || 'PARAUAPEBAS'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">PREFIXO</span>
                  <span className="font-bold text-red-600 dark:text-red-400 text-sm font-mono">
                    {viatura?.prefixo_frota || 'VTR-01'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">PLACA</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {viatura?.placa || 'BRA2E19'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">MODELO / MARCA</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">
                    {viatura?.marca} {viatura?.modelo}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">ODÔMETRO DE ENTRADA</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {Number(os.odometro_km || viatura?.odometro_atual_km || 0).toLocaleString('pt-BR')} km
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco Oficina Credenciada */}
            <div className="bg-slate-50 dark:bg-[#282A2F]/60 border border-slate-200 dark:border-[#3C3F45] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#3C3F45] pb-2">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-[#D5D9DC] flex items-center gap-1.5 font-mono">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  2. Oficina Credenciada
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                  {os.tipo_os === 'INTERNA' ? 'BASE SIGER' : 'HOMOLOGADA'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block font-mono">ESTABELECIMENTO</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {oficina?.nome_fantasia || oficina?.razao_social || (os.tipo_os === 'INTERNA' ? 'Oficina Interna da Base SIGER' : 'Oficina Homologada Externa')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">CNPJ</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {oficina?.cnpj || 'Cadastrada no Contrato'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">CONTATO / FONE</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">
                    {oficina?.telefone || '(94) 99100-0000'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Componentes e Serviços */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-[#D5D9DC] flex items-center gap-2 font-mono">
                <Layers className="w-4 h-4 text-[#68D346]" />
                3. Componentes Flegados & Serviços a Manutenir ({componentes.length})
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                Árvore Anatômica 10 Macro-Sistemas
              </span>
            </div>

            <div className="border border-slate-200 dark:border-[#3C3F45] rounded-2xl overflow-hidden shadow-2xs">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#181A1E] text-[10px] uppercase font-mono text-slate-500 border-b border-slate-200 dark:border-[#3C3F45]">
                    <tr>
                      <th className="p-3">Sistema Macro</th>
                      <th className="p-3">Subcomponente</th>
                      <th className="p-3 text-center">Ação Requerida</th>
                      <th className="p-3 text-center">Posição</th>
                      <th className="p-3 text-center">Qtd</th>
                      <th className="p-3 text-right">Unitário Est.</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#282A2F]">
                    {componentes.length > 0 ? (
                      componentes.map((c, idx) => {
                        const subtotal = (c.quantidade || 1) * (c.valor_unitario_estimado || 0);
                        const isCritico = c.criticidade === 'EMERGENCIA';
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#282A2F]/40 transition">
                            <td className="p-3 font-bold text-slate-800 dark:text-zinc-200">
                              {c.nome_componente_macro}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-900 dark:text-white block">
                                {c.nome_subcomponente}
                              </span>
                              {c.observacao && (
                                <span className="text-[10px] text-slate-400 block">{c.observacao}</span>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                              {c.acao || 'SUBSTITUICAO'}
                            </td>
                            <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                              {c.posicao || 'COMPLETO'}
                            </td>
                            <td className="p-3 text-center font-bold font-mono">
                              {c.quantidade || 1}
                            </td>
                            <td className="p-3 text-right text-slate-600 dark:text-zinc-400 font-mono">
                              {c.valor_unitario_estimado ? formatBRL(c.valor_unitario_estimado) : 'A orçar'}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                              {subtotal > 0 ? formatBRL(subtotal) : 'A orçar'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          {os.resumo_anatomico || os.descricao_servico || 'Nenhum componente específico listado individualmente. Manutenção geral de acordo com escopo.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Resumo Financeiro & Rateio */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-[#282A2F] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Peças</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {formatBRL(custoPecas)}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-[#282A2F] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Mão de Obra</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {formatBRL(custoMaoObra)}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-[#282A2F] border border-slate-200 dark:border-[#3C3F45] rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Pneus</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {formatBRL(custoPneus)}
              </span>
            </div>
            <div className="bg-emerald-50 dark:bg-[#1C4E26]/40 border border-emerald-300 dark:border-[#68D346] rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-black text-emerald-700 dark:text-[#B7F365] block font-mono">Total Estimado</span>
              <span className="text-base font-black text-emerald-800 dark:text-[#68D346] font-mono">
                {formatBRL(custoTotal)}
              </span>
            </div>
          </div>

          {/* Relato Descritivo da Falha */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
              Relato Técnico do Solicitante / Diagnóstico:
            </span>
            <div className="bg-slate-50 dark:bg-[#181A1E] border border-slate-200 dark:border-[#282A2F] rounded-xl p-3 text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {os.descricao_motivo || os.descricao_servico || 'Manutenção geral programada para a viatura operacional.'}
            </div>
          </div>

          {/* Quadro de Assinaturas e Governança */}
          <div className="border-t border-slate-200 dark:border-[#3C3F45] pt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <div className="border-b border-slate-300 dark:border-[#475569] pb-1 font-bold text-xs text-slate-800 dark:text-white">
                {emitenteNome}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Emitente / Inspetor Solicitante</span>
            </div>
            <div className="space-y-1">
              <div className="border-b border-slate-300 dark:border-[#475569] pb-1 font-bold text-xs text-slate-800 dark:text-white">
                {oficina?.responsavel || oficina?.contato_responsavel || 'Responsável Técnico'}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Oficina Credenciada (Vistoria)</span>
            </div>
            <div className="space-y-1">
              <div className="border-b border-slate-300 dark:border-[#475569] pb-1 font-bold text-xs text-slate-800 dark:text-white">
                {aprovadorNome}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Gestor de Frota / Aprovador SPCI</span>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal com Compartilhamento Omnichannel */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#181A1E] border-t border-slate-200 dark:border-[#282A2F] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            Disponível para exportação e compartilhamento com a cadeia de aprovação.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isSendingAlert}
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-[#282A2F] hover:bg-slate-300 dark:hover:bg-[#3C3F45] text-slate-800 dark:text-[#D5D9DC] font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#68D346]" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSendingAlert}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="No celular anexa o PDF direto; no PC baixa o arquivo e abre a conversa"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar WhatsApp (com PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleShareEmail}
              disabled={isSendingAlert}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>E-mail com Romaneio</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-[#3C3F45] text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#282A2F] font-bold text-xs transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
