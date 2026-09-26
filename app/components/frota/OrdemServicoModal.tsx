'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Viatura, 
  OrdemServicoFrota, 
  OficinaPrestador, 
  TipoOrdemServico, 
  NaturezaManutencao, 
  StatusOrdemServico,
  ItemChecklistOs,
  NotaFiscalAnexo,
  DocumentoAnexo,
  OrcamentoConcorrente,
  OrcamentoAditivo
} from '@/lib/types/frota';
import { saveOrdemServicoAction, listOficinasAction } from '@/app/actions/frotaActions';
import { soundNotificationService } from '@/lib/soundNotificationService';
import { compressImage } from '@/lib/imageCompressor';
import { 
  Wrench, 
  Minus, 
  Maximize2, 
  Minimize2, 
  X, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  DollarSign,
  FileText,
  Upload,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Truck,
  Disc,
  Clock,
  Check,
  ChevronRight,
  Camera,
  Sparkles,
  Paperclip,
  Layers,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Award,
  Ban,
  TrendingUp,
  PlusCircle,
  CalendarCheck
} from 'lucide-react';
import { VehicleAnatomySelector } from './VehicleAnatomySelector';
import { SubcomponenteSelecionado, formatarResumoAnatomico } from '@/lib/types/vehicleAnatomy';
import { CriticidadeOS } from '@/lib/types/osWorkflow';
import { OSRomaneioModal } from './OSRomaneioModal';
import { useSpci } from '@/app/context/SpciContext';

interface OrdemServicoModalProps {
  isOpen: boolean;
  viatura?: Viatura | null;
  viaturas?: Viatura[];
  contratoId: string;
  osToEdit?: OrdemServicoFrota | null;
  onClose: () => void;
  onMinimize?: () => void;
  onSuccess: (saved: OrdemServicoFrota) => void;
}

const ETAPAS_STATUS: { id: StatusOrdemServico; label: string; desc: string; icon: any; color: string }[] = [
  { id: 'ABERTA', label: 'Aberta', desc: 'Triagem inicial', icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  { id: 'EM_ORCAMENTO', label: 'Em Orçamento', desc: 'Coleta de cotações', icon: FileSpreadsheet, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  { id: 'APROVADA', label: 'Aprovada', desc: 'Autorizada p/ execução', icon: CheckCircle2, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' },
  { id: 'EM_EXECUCAO', label: 'Em Execução', desc: 'Na oficina / base', icon: Wrench, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
  { id: 'CONCLUIDA', label: 'Concluída', desc: 'Notas e rateio ok', icon: Receipt, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'REJEITADA', label: 'Não Autorizada', desc: 'Reparos recusados', icon: Ban, color: 'text-rose-600 bg-rose-600/10 border-rose-600/30' },
];

export const OrdemServicoModal: React.FC<OrdemServicoModalProps> = ({
  isOpen,
  viatura,
  viaturas = [],
  contratoId,
  osToEdit,
  onClose,
  onMinimize,
  onSuccess
}) => {
  const { userProfile, currentUser } = useSpci();
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [oficinas, setOficinas] = useState<OficinaPrestador[]>([]);
  const [modalTab, setModalTab] = useState<'DADOS' | 'ORCAMENTOS' | 'RATEIO_NOTAS'>('DADOS');

  // Viatura Selecionada
  const [selectedViaturaId, setSelectedViaturaId] = useState<string>('');

  // Form states
  const [numeroOs, setNumeroOs] = useState(`OS-${Date.now().toString().slice(-6)}`);
  const [dataAbertura, setDataAbertura] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [tipoOs, setTipoOs] = useState<TipoOrdemServico>('EXTERNA');
  const [oficinaId, setOficinaId] = useState<string>('');
  const [natureza, setNatureza] = useState<NaturezaManutencao>('PREVENTIVA');
  const [odometro, setOdometro] = useState<string>('0');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<StatusOrdemServico>('ABERTA');
  
  // Governança, Criticidade e Anatomia Veicular
  const [prioridade, setPrioridade] = useState<CriticidadeOS>('NORMAL');
  const [subcomponentes, setSubcomponentes] = useState<SubcomponenteSelecionado[]>([]);
  const [resumoAnatomico, setResumoAnatomico] = useState<string>('');
  const [isRomaneioOpen, setIsRomaneioOpen] = useState<boolean>(false);

  // Prazo de Término e Garantia Geral do Serviço
  const [previsaoConclusao, setPrevisaoConclusao] = useState<string>('');
  const [garantiaMeses, setGarantiaMeses] = useState<string>('');
  const [garantiaKm, setGarantiaKm] = useState<string>('');
  const [motivoRecusa, setMotivoRecusa] = useState<string>('');

  // Mapa Comparativo de Cotações (Até 3 Oficinas)
  const [orcamentosConcorrentes, setOrcamentosConcorrentes] = useState<OrcamentoConcorrente[]>([]);
  const [novaCotFornecedor, setNovaCotFornecedor] = useState<string>('');
  const [novaCotValor, setNovaCotValor] = useState<string>('');
  const [novaCotPrazoDias, setNovaCotPrazoDias] = useState<string>('');
  const [novaCotGarantiaMeses, setNovaCotGarantiaMeses] = useState<string>('');
  const [novaCotGarantiaKm, setNovaCotGarantiaKm] = useState<string>('');
  const [novaCotCondicoes, setNovaCotCondicoes] = useState<string>('');

  // Orçamentos Complementares / Aditivos
  const [orcamentosAditivos, setOrcamentosAditivos] = useState<OrcamentoAditivo[]>([]);
  const [novoAditDescricao, setNovoAditDescricao] = useState<string>('');
  const [novoAditValor, setNovoAditValor] = useState<string>('');
  const [novoAditPrazoDias, setNovoAditPrazoDias] = useState<string>('');
  const [novoAditMotivo, setNovoAditMotivo] = useState<string>('');

  // Rateio de Custos
  const [custoPecas, setCustoPecas] = useState<string>('0');
  const [custoMaoObra, setCustoMaoObra] = useState<string>('0');
  const [custoPneus, setCustoPneus] = useState<string>('0');

  // Anexos
  const [orcamentos, setOrcamentos] = useState<DocumentoAnexo[]>([]);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscalAnexo[]>([]);
  const [comprovantesUrls, setComprovantesUrls] = useState<string[]>([]);
  const fotoEvidenciaRef = useRef<HTMLInputElement>(null);

  // Novo Orçamento Form
  const [novoOrcTitulo, setNovoOrcTitulo] = useState('');
  const [novoOrcValor, setNovoOrcValor] = useState('');
  const orcFileInputRef = useRef<HTMLInputElement>(null);

  // Nova NF Form
  const [novaNfTipo, setNovaNfTipo] = useState<'SERVICO' | 'PECA' | 'PNEU' | 'GERAL'>('SERVICO');
  const [novaNfNumero, setNovaNfNumero] = useState('');
  const [novaNfValor, setNovaNfValor] = useState('');
  const nfFileInputRef = useRef<HTMLInputElement>(null);

  // Checklist de itens
  const [checklist, setChecklist] = useState<ItemChecklistOs[]>([
    { id: '1', descricao: 'Substituição de óleo lubrificante e filtros', concluido: true },
    { id: '2', descricao: 'Revisão das pastilhas e discos de freio', concluido: false },
    { id: '3', descricao: 'Verificação do sistema elétrico e iluminação de emergência', concluido: false }
  ]);
  const [novoItemDesc, setNovoItemDesc] = useState('');

  // Viatura ativa efetiva
  const activeViatura = useMemo(() => {
    if (viatura) return viatura;
    return viaturas.find(v => v.id === selectedViaturaId) || null;
  }, [viatura, viaturas, selectedViaturaId]);

  useEffect(() => {
    listOficinasAction(contratoId).then(res => {
      if (res.success && res.data) {
        setOficinas(res.data);
        if (res.data.length > 0 && !oficinaId) {
          setOficinaId(res.data[0].id);
        }
      }
    });
  }, [contratoId]);

  useEffect(() => {
    if (osToEdit) {
      setNumeroOs(osToEdit.numero_os);
      setDataAbertura(osToEdit.data_abertura ? new Date(osToEdit.data_abertura).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
      setSelectedViaturaId(osToEdit.viatura_id);
      setTipoOs(osToEdit.tipo_os || 'EXTERNA');
      setOficinaId(osToEdit.oficina_id || '');
      setNatureza(osToEdit.natureza_manutencao || 'PREVENTIVA');
      setPrioridade(((osToEdit.prioridade || 'NORMAL').toUpperCase()) as CriticidadeOS);
      setSubcomponentes((osToEdit as any).itens_componentes_json || []);
      setResumoAnatomico(osToEdit.resumo_anatomico || '');
      setOdometro(String(osToEdit.odometro_km || 0));
      setDescricao(osToEdit.descricao_servico || osToEdit.descricao_motivo || '');
      setCustoPecas(String(osToEdit.custo_pecas || 0));
      setCustoMaoObra(String(osToEdit.custo_mao_de_obra || 0));
      setCustoPneus(String(osToEdit.custo_pneus || 0));
      
      const s = (osToEdit.status_os || osToEdit.status || 'ABERTA') as StatusOrdemServico;
      setStatus(s === 'EM_ANDAMENTO' ? 'EM_EXECUCAO' : s);
      setChecklist(osToEdit.itens_checklist || []);
      setOrcamentos(osToEdit.orcamentos_json || []);
      setNotasFiscais(osToEdit.notas_fiscais_json || []);
      setComprovantesUrls(osToEdit.comprovantes_urls || []);

      // Prazos, Garantias e Concorrência
      setPrevisaoConclusao(osToEdit.previsao_conclusao ? new Date(osToEdit.previsao_conclusao).toISOString().slice(0, 16) : '');
      setGarantiaMeses(osToEdit.garantia_meses ? String(osToEdit.garantia_meses) : '');
      setGarantiaKm(osToEdit.garantia_km ? String(osToEdit.garantia_km) : '');
      setMotivoRecusa(osToEdit.motivo_recusa || '');
      setOrcamentosConcorrentes(osToEdit.orcamentos_concorrentes_json || []);
      setOrcamentosAditivos(osToEdit.orcamentos_aditivos_json || []);
    } else {
      setNumeroOs(`OS-${Date.now().toString().slice(-6)}`);
      setDataAbertura(new Date().toISOString().slice(0, 16));
      setSelectedViaturaId(viatura?.id || (viaturas.length > 0 ? viaturas[0].id : ''));
      setTipoOs('EXTERNA');
      setNatureza('PREVENTIVA');
      setPrioridade('NORMAL');
      setSubcomponentes([]);
      setResumoAnatomico('');
      setOdometro(String(viatura?.odometro_atual_km || 0));
      setDescricao('');
      setCustoPecas('0');
      setCustoMaoObra('0');
      setCustoPneus('0');
      setStatus('ABERTA');
      setOrcamentos([]);
      setNotasFiscais([]);
      setComprovantesUrls([]);

      // Prazos e Garantias padrão
      setPrevisaoConclusao('');
      setGarantiaMeses('');
      setGarantiaKm('');
      setMotivoRecusa('');
      setOrcamentosConcorrentes([]);
      setOrcamentosAditivos([]);
    }
  }, [osToEdit, isOpen, viatura, viaturas]);

  const totalAditivosAprovados = useMemo(() => {
    return orcamentosAditivos
      .filter(a => a.status === 'APROVADO')
      .reduce((acc, a) => acc + (Number(a.valor) || 0), 0);
  }, [orcamentosAditivos]);

  const custoTotal = useMemo(() => {
    const p = parseFloat(custoPecas) || 0;
    const m = parseFloat(custoMaoObra) || 0;
    const pn = parseFloat(custoPneus) || 0;
    return (p + m + pn + totalAditivosAprovados).toFixed(2);
  }, [custoPecas, custoMaoObra, custoPneus, totalAditivosAprovados]);

  if (!isOpen) return null;

  // Processamento de Upload de Documentos (PDF ou Imagem)
  const processFileUpload = async (file: File): Promise<string> => {
    if (file.type.startsWith('image/')) {
      const res = await compressImage(file, { maxWidth: 1280, quality: 0.75 });
      return res.base64;
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Adicionar Orçamento
  const handleAddOrcamento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const dataUrl = await processFileUpload(file);
      const novoOrc: DocumentoAnexo = {
        id: Date.now().toString(),
        tipo: 'ORCAMENTO',
        titulo: novoOrcTitulo.trim() || file.name,
        valor_estimado: parseFloat(novoOrcValor) || undefined,
        url: dataUrl,
        nome_arquivo: file.name,
        data_upload: new Date().toISOString()
      };
      setOrcamentos(prev => [...prev, novoOrc]);
      setNovoOrcTitulo('');
      setNovoOrcValor('');
      if (orcFileInputRef.current) orcFileInputRef.current.value = '';
      soundNotificationService.playSuccessSound();
    } catch (err) {
      console.error(err);
      alert('Falha ao processar arquivo do orçamento.');
    }
  };

  // Adicionar Foto de Evidência / Avaria
  const handleAddEvidenciaFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const dataUrl = await processFileUpload(files[0]);
      setComprovantesUrls(prev => [...prev, dataUrl]);
      if (fotoEvidenciaRef.current) fotoEvidenciaRef.current.value = '';
      soundNotificationService.playSuccessSound();
    } catch (err) {
      console.error(err);
      alert('Falha ao processar foto de evidência.');
    }
  };

  // Adicionar Nota Fiscal
  const handleAddNotaFiscal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!novaNfNumero.trim()) {
      alert('Informe o Número da Nota Fiscal antes de anexar o documento.');
      if (nfFileInputRef.current) nfFileInputRef.current.value = '';
      return;
    }

    try {
      const dataUrl = await processFileUpload(file);
      const novaNf: NotaFiscalAnexo = {
        id: Date.now().toString(),
        tipo: novaNfTipo,
        numero_nf: novaNfNumero.trim(),
        valor: parseFloat(novaNfValor) || 0,
        url: dataUrl,
        nome_arquivo: file.name,
        data_upload: new Date().toISOString()
      };
      setNotasFiscais(prev => [...prev, novaNf]);
      setNovaNfNumero('');
      setNovaNfValor('');
      if (nfFileInputRef.current) nfFileInputRef.current.value = '';
      soundNotificationService.playSuccessSound();
    } catch (err) {
      console.error(err);
      alert('Falha ao processar arquivo da Nota Fiscal.');
    }
  };

  // Sincronizar Rateio a partir das Notas Fiscais
  const handleSincronizarRateioComNfs = () => {
    let totServicos = 0;
    let totPecas = 0;
    let totPneus = 0;

    notasFiscais.forEach(nf => {
      const val = Number(nf.valor) || 0;
      if (nf.tipo === 'SERVICO') totServicos += val;
      else if (nf.tipo === 'PECA') totPecas += val;
      else if (nf.tipo === 'PNEU') totPneus += val;
      else totPecas += val; // Geral aloca em peças por padrão
    });

    setCustoMaoObra(totServicos.toFixed(2));
    setCustoPecas(totPecas.toFixed(2));
    setCustoPneus(totPneus.toFixed(2));
    soundNotificationService.playSuccessSound();
  };

  const handleAddItem = () => {
    if (!novoItemDesc.trim()) return;
    setChecklist([
      ...checklist,
      { id: Date.now().toString(), descricao: novoItemDesc.trim(), concluido: false }
    ]);
    setNovoItemDesc('');
  };

  const handleToggleItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, concluido: !item.concluido } : item));
  };

  const handleRemoveItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handlePrintRomaneio = () => {
    setIsRomaneioOpen(true);
  };

  // Handlers para Mapa Comparativo de Cotações
  const handleAddCotacao = () => {
    if (!novaCotFornecedor.trim()) {
      alert('Informe o nome da oficina ou prestador concorrente.');
      return;
    }
    const val = parseFloat(novaCotValor) || 0;
    if (val <= 0) {
      alert('Informe o valor total proposto pela oficina.');
      return;
    }

    if (orcamentosConcorrentes.length >= 3) {
      alert('Limite de até 3 cotações concorrentes atingido para esta O.S.');
      return;
    }

    const nova: OrcamentoConcorrente = {
      id: Date.now().toString(),
      oficina_nome: novaCotFornecedor.trim(),
      valor_total: val,
      prazo_dias: parseInt(novaCotPrazoDias) || undefined,
      previsao_entrega: novaCotPrazoDias ? new Date(Date.now() + (parseInt(novaCotPrazoDias) * 86400000)).toISOString().slice(0, 10) : undefined,
      garantia_meses: parseInt(novaCotGarantiaMeses) || undefined,
      garantia_km: parseInt(novaCotGarantiaKm) || undefined,
      condicoes_pagamento: novaCotCondicoes.trim() || undefined,
      selecionada: orcamentosConcorrentes.length === 0 // Primeira cotação fica pré-selecionada por padrão
    };

    setOrcamentosConcorrentes(prev => [...prev, nova]);
    setNovaCotFornecedor('');
    setNovaCotValor('');
    setNovaCotPrazoDias('');
    setNovaCotGarantiaMeses('');
    setNovaCotGarantiaKm('');
    setNovaCotCondicoes('');
    soundNotificationService.playSuccessSound();
  };

  const handleSelectVencedora = (cotacaoId?: string) => {
    if (!cotacaoId) return;
    const atualizadas = orcamentosConcorrentes.map(c => ({
      ...c,
      selecionada: c.id === cotacaoId
    }));
    setOrcamentosConcorrentes(atualizadas);

    const vencedora = atualizadas.find(c => c.id === cotacaoId);
    if (vencedora) {
      // Sincroniza garantia e prazo na OS principal
      if (vencedora.garantia_meses) setGarantiaMeses(String(vencedora.garantia_meses));
      if (vencedora.garantia_km) setGarantiaKm(String(vencedora.garantia_km));
      if (vencedora.prazo_dias) {
        const d = new Date(Date.now() + vencedora.prazo_dias * 86400000);
        setPrevisaoConclusao(d.toISOString().slice(0, 16));
      }
      // Se houver oficina correspondente cadastrada no sistema, vincula
      const matchOficina = oficinas.find(o => 
        o.razao_social.toLowerCase().includes(vencedora.oficina_nome.toLowerCase()) ||
        (o.nome_fantasia && o.nome_fantasia.toLowerCase().includes(vencedora.oficina_nome.toLowerCase()))
      );
      if (matchOficina) setOficinaId(matchOficina.id);

      soundNotificationService.playSuccessSound();
    }
  };

  const handleRemoveCotacao = (cotacaoId?: string) => {
    if (!cotacaoId) return;
    setOrcamentosConcorrentes(prev => prev.filter(c => c.id !== cotacaoId));
  };

  // Handlers para Orçamentos Aditivos / Complementares
  const handleAddAditivo = () => {
    if (!novoAditDescricao.trim()) {
      alert('Informe a descrição do serviço adicional / defeito complementar identificado.');
      return;
    }
    const val = parseFloat(novoAditValor) || 0;
    if (val <= 0) {
      alert('Informe o valor adicional deste aditivo.');
      return;
    }

    const novoAditivo: OrcamentoAditivo = {
      id: Date.now().toString(),
      numero_aditivo: orcamentosAditivos.length + 1,
      descricao: novoAditDescricao.trim(),
      valor: val,
      prazo_adicional_dias: parseInt(novoAditPrazoDias) || 0,
      motivo: novoAditMotivo.trim() || 'Defeito oculto identificado durante a desmontagem dos componentes.',
      data_solicitacao: new Date().toISOString(),
      status: 'APROVADO',
      aprovado_por: userProfile?.name || currentUser?.displayName || 'Gestor de Frota SPCI'
    };

    setOrcamentosAditivos(prev => [...prev, novoAditivo]);
    setNovoAditDescricao('');
    setNovoAditValor('');
    setNovoAditPrazoDias('');
    setNovoAditMotivo('');
    soundNotificationService.playSuccessSound();
  };

  const handleToggleAditivoStatus = (aditivoId?: string, novoStatus: 'SOLICITADO' | 'APROVADO' | 'REJEITADO' | 'PENDENTE' = 'APROVADO') => {
    if (!aditivoId) return;
    setOrcamentosAditivos(prev => prev.map(a => {
      if (a.id === aditivoId) {
        return {
          ...a,
          status: novoStatus,
          aprovado_por: novoStatus === 'APROVADO' ? (userProfile?.name || currentUser?.displayName || 'Gestor de Frota SPCI') : undefined,
          data_aprovacao: novoStatus === 'APROVADO' ? new Date().toISOString() : undefined
        };
      }
      return a;
    }));
  };

  const handleRemoveAditivo = (aditivoId?: string) => {
    if (!aditivoId) return;
    setOrcamentosAditivos(prev => prev.filter(a => a.id !== aditivoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert('Informe a descrição do serviço a ser realizado.');
      return;
    }

    const viatId = activeViatura?.id || selectedViaturaId;
    if (!viatId) {
      alert('Selecione uma viatura para vincular a esta Ordem de Serviço.');
      return;
    }

    // Validação obrigatória de justificativa de recusa
    if (status === 'REJEITADA' && !motivoRecusa.trim()) {
      alert('Atenção: Para marcar a O.S. como NÃO AUTORIZADA / RECUSADA, é obrigatório informar o motivo e a justificativa da recusa.');
      setModalTab('DADOS');
      return;
    }

    // Validação suave para conclusão da OS
    if (status === 'CONCLUIDA') {
      const totalNum = parseFloat(custoTotal) || 0;
      if (totalNum === 0) {
        const prosseguir = confirm('Atenção: Nenhum valor de custo foi rateado nesta O.S. (Custo Total R$ 0,00). Deseja concluir a O.S. mesmo assim?');
        if (!prosseguir) {
          setModalTab('RATEIO_NOTAS');
          return;
        }
      }
      if (notasFiscais.length === 0) {
        const prosseguirNf = confirm('Atenção: Nenhuma cópia de Nota Fiscal foi anexada para esta O.S. concluída. Recomendamos anexar as NFS-e / NF-e para auditoria. Deseja prosseguir?');
        if (!prosseguirNf) {
          setModalTab('RATEIO_NOTAS');
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const res = await saveOrdemServicoAction({
        id: osToEdit?.id,
        contrato_id: contratoId || activeViatura?.contrato_id || 'ONÇA PUMA',
        numero_os: numeroOs,
        viatura_id: viatId,
        oficina_id: tipoOs === 'EXTERNA' ? (oficinaId || null) : null,
        tipo_os: tipoOs,
        natureza_manutencao: natureza,
        tipo_manutencao: natureza === 'PREVENTIVA' ? 'PREVENTIVA' : 'CORRETIVA',
        prioridade: prioridade,
        resumo_anatomico: resumoAnatomico,
        itens_componentes_json: subcomponentes as any,
        valor_estimado: parseFloat(custoTotal) || 0,
        odometro_km: parseFloat(odometro) || 0,
        descricao_servico: descricao,
        custo_pecas: parseFloat(custoPecas) || 0,
        custo_mao_de_obra: parseFloat(custoMaoObra) || 0,
        custo_pneus: parseFloat(custoPneus) || 0,
        custo_total: parseFloat(custoTotal) || 0,
        status: status,
        status_os: status,
        itens_checklist: checklist,
        orcamentos_json: orcamentos,
        notas_fiscais_json: notasFiscais,
        comprovantes_urls: comprovantesUrls,
        responsavel_abertura: osToEdit?.responsavel_abertura || userProfile?.name || currentUser?.displayName || 'Inspetor de Frotas',
        data_abertura: dataAbertura ? new Date(dataAbertura).toISOString() : (osToEdit?.data_abertura || new Date().toISOString()),
        data_conclusao: status === 'CONCLUIDA' ? (osToEdit?.data_conclusao || new Date().toISOString()) : null,
        // Prazos, Garantias, Recusa e Cotações
        previsao_conclusao: previsaoConclusao ? new Date(previsaoConclusao).toISOString() : null,
        garantia_meses: parseInt(garantiaMeses) || null,
        garantia_km: parseInt(garantiaKm) || null,
        motivo_recusa: motivoRecusa.trim() || null,
        data_recusa: status === 'REJEITADA' ? (osToEdit?.data_recusa || new Date().toISOString()) : null,
        responsavel_recusa: status === 'REJEITADA' ? (osToEdit?.responsavel_recusa || userProfile?.name || currentUser?.displayName || 'Gestor de Frota SPCI') : null,
        orcamentos_concorrentes_json: orcamentosConcorrentes,
        orcamentos_aditivos_json: orcamentosAditivos
      });

      if (res.success && res.data) {
        soundNotificationService.playSuccessSound();
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.error || 'Falha ao gravar Ordem de Serviço.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao salvar OS.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[94vh]'
        }`}
      >
        {/* ==================================================================== */}
        {/* CABEÇALHO DO MODAL */}
        {/* ==================================================================== */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Ordem de Serviço: {numeroOs}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  prioridade === 'EMERGENCIA' 
                    ? 'bg-red-600 text-white shadow-[0_0_10px_#ef4444] animate-pulse' 
                    : prioridade === 'URGENTE' 
                      ? 'bg-amber-500 text-white font-black' 
                      : 'bg-[#1C4E26] text-[#B7F365] border border-[#68D346]'
                }`}>
                  {prioridade}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                <Truck className="w-3 h-3 text-slate-400" />
                {activeViatura ? (
                  <span>
                    Viatura: <strong>{activeViatura.prefixo_frota}</strong> • {activeViatura.modelo} ({activeViatura.placa})
                  </span>
                ) : (
                  <span className="text-amber-500">Selecione uma viatura abaixo</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrintRomaneio}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent flex items-center gap-1 text-[10px] font-bold uppercase mr-1"
              title="Imprimir Romaneio de Encaminhamento"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Romaneio</span>
            </button>
            {onMinimize && (
              <button
                type="button"
                onClick={onMinimize}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
                title="Minimizar"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
              title={isMaximized ? 'Restaurar' : 'Maximizar'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer border-none bg-transparent"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* STEPPER VISUAL DO STATUS DA OS */}
        {/* ==================================================================== */}
        <div className="bg-slate-50 dark:bg-slate-950/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {ETAPAS_STATUS.map((step, idx) => {
            const isCurrent = status === step.id;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setStatus(step.id)}
                className={`flex-1 min-w-[120px] p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-left ${
                  isCurrent 
                    ? `${step.color} shadow-xs font-black ring-1 ring-offset-1 ring-current`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isCurrent ? 'bg-current/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase truncate leading-tight">
                    {idx + 1}. {step.label}
                  </p>
                  <p className="text-[9px] text-slate-400 truncate leading-tight">
                    {step.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ==================================================================== */}
        {/* SUB-ABAS DE NAVEGAÇÃO DO MODAL */}
        {/* ==================================================================== */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setModalTab('DADOS')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              modalTab === 'DADOS'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Dados da O.S. & Escopo
          </button>

          <button
            type="button"
            onClick={() => setModalTab('ORCAMENTOS')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              modalTab === 'ORCAMENTOS'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Orçamentos & Cotações ({orcamentos.length})
          </button>

          <button
            type="button"
            onClick={() => setModalTab('RATEIO_NOTAS')}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              modalTab === 'RATEIO_NOTAS'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Rateio de Custos & Notas Fiscais ({notasFiscais.length})
          </button>
        </div>

        {/* ==================================================================== */}
        {/* CORPO DO FORMULÁRIO */}
        {/* ==================================================================== */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ================= ABA 1: DADOS GERAIS & ESCOPO ================= */}
          {modalTab === 'DADOS' && (
            <div className="space-y-4">
              {/* ==================================================================== */}
              {/* PAINEL EXPLÍCITO NO TOPO: DATA DE ABERTURA & TIPO DA ORDEM */}
              {/* ==================================================================== */}
              <div className="bg-slate-50 dark:bg-[#181A1E] border border-slate-200 dark:border-[#282A2F] rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-[#282A2F] pb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Identificação & Governança da O.S.
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Protocolo: #{numeroOs}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Campo 1: Data e Hora de Abertura */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Data e Hora de Abertura da O.S. *
                    </label>
                    <input
                      type="datetime-local"
                      value={dataAbertura}
                      onChange={(e) => setDataAbertura(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                      required
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Permite registro retroativo ou horário oficial da triagem.
                    </span>
                  </div>

                  {/* Campo 2: Classificação de Criticidade / Tipo da Ordem */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        Tipo da Ordem / Criticidade *
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {subcomponentes.some(s => s.criticidade === 'EMERGENCIA') ? '⚡ Emergência detectada' : 'Manual / Automático'}
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrioridade('NORMAL')}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase font-mono border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          prioridade === 'NORMAL'
                            ? 'bg-[#1C4E26] text-[#B7F365] border-[#68D346] shadow-xs ring-1 ring-[#68D346]'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <span className="text-[10.5px]">🟢 NORMAL</span>
                        <span className="text-[7.5px] opacity-80 font-normal">SLA Rotina</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrioridade('URGENTE')}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase font-mono border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          prioridade === 'URGENTE'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-1 ring-amber-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <span className="text-[10.5px]">🟠 URGENTE</span>
                        <span className="text-[7.5px] opacity-90 font-normal">SLA 2 Horas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrioridade('EMERGENCIA')}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase font-mono border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          prioridade === 'EMERGENCIA'
                            ? 'bg-red-600 text-white border-red-700 shadow-md ring-1 ring-red-400 animate-pulse'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        <span className="text-[10.5px]">🔴 EMERGÊNCIA</span>
                        <span className="text-[7.5px] opacity-90 font-normal">Interdição</span>
                      </button>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Define a alçada de aprovação e aciona a Matriz de Notificações.
                    </span>
                  </div>
                </div>
              </div>

              {/* Seleção de Viatura (se não pré-fixada) */}
              {!viatura && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Viatura Vinculada *
                  </label>
                  <select
                    value={selectedViaturaId}
                    onChange={(e) => {
                      setSelectedViaturaId(e.target.value);
                      const v = viaturas.find(x => x.id === e.target.value);
                      if (v) setOdometro(String(v.odometro_atual_km || 0));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer focus:border-red-600"
                    required
                  >
                    <option value="">Selecione o Veículo...</option>
                    {viaturas.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.prefixo_frota} • {v.modelo} (Placa: {v.placa})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Classificação da OS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Origem da Execução *
                  </label>
                  <select
                    value={tipoOs}
                    onChange={(e) => setTipoOs(e.target.value as TipoOrdemServico)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="EXTERNA">Oficina Externa Credenciada</option>
                    <option value="INTERNA">Oficina Interna da Base SIGER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Natureza da Manutenção *
                  </label>
                  <select
                    value={natureza}
                    onChange={(e) => setNatureza(e.target.value as NaturezaManutencao)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="PREVENTIVA">Preventiva Programada</option>
                    <option value="CORRETIVA">Corretiva</option>
                    <option value="EMERGENCIAL">Emergencial / Socorro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Odômetro de Entrada (KM) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={odometro}
                    onChange={(e) => setOdometro(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold outline-none focus:border-red-600"
                    required
                  />
                </div>
              </div>

              {/* Oficina Credenciada */}
              {tipoOs === 'EXTERNA' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Oficina Credenciada Vinculada *
                  </label>
                  <select
                    value={oficinaId}
                    onChange={(e) => setOficinaId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer focus:border-red-600"
                    required
                  >
                    <option value="">Selecione a Oficina Credenciada...</option>
                    {oficinas.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.razao_social} {o.cnpj ? `(${o.cnpj})` : ''} - {o.especialidades?.join(', ') || 'Geral'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Local de Execução
                  </label>
                  <input
                    type="text"
                    value="Base / Oficina Mecânica Interna da Brigada SIGER"
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-500"
                  />
                </div>
              )}

              {/* Seletor Anatômico de Componentes Principais e Subcomponentes */}
              <div className="pt-2">
                <VehicleAnatomySelector
                  natureza={natureza === 'PREVENTIVA' ? 'PREVENTIVA' : 'CORRETIVA'}
                  onNaturezaChange={(novaNatureza) => setNatureza(novaNatureza)}
                  selectedItems={subcomponentes}
                  onItemsChange={(newItems, valorTotal, prioridadeSugerida) => {
                    setSubcomponentes(newItems);
                    setPrioridade(prioridadeSugerida);
                    const resumo = formatarResumoAnatomico(newItems);
                    setResumoAnatomico(resumo);
                    if (valorTotal > 0) {
                      setCustoPecas(valorTotal.toFixed(2));
                    }
                    // Se a descrição estiver vazia, pré-preenche com o resumo dos itens
                    if (!descricao.trim() && newItems.length > 0) {
                      setDescricao(`Manutenção veicular: ${newItems.map(i => i.nome_subcomponente).join(', ')}`);
                    }
                  }}
                />
              </div>

              {/* Escopo dos Serviços */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Escopo e Descrição dos Serviços Solicitados *
                </label>
                <textarea
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva minuciosamente os sintomas, serviços e peças a serem revisados nesta O.S..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-red-600"
                  required
                />
              </div>

              {/* Checklist de Itens da Manutenção */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Checklist Operacional de Serviços e Peças
                  </h4>
                  <span className="text-[9px] font-mono text-slate-400">
                    {checklist.filter(c => c.concluido).length} de {checklist.length} concluídos
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {checklist.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.concluido}
                          onChange={() => handleToggleItem(item.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <span className={`truncate text-[11px] ${item.concluido ? 'line-through text-slate-400' : 'font-bold text-slate-700 dark:text-slate-200'}`}>
                          {item.descricao}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Adicionar serviço (ex: Troca do filtro de ar do motor)"
                    value={novoItemDesc}
                    onChange={(e) => setNovoItemDesc(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border-none"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
              </div>

              {/* ==================================================================== */}
              {/* PAINEL DE CRONOGRAMA, PRAZOS & TERMO DE GARANTIA DOS SERVIÇOS        */}
              {/* ==================================================================== */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181A1E] border border-slate-200 dark:border-[#282A2F] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-[#282A2F] pb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-[#B7F365] font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#68D346]" />
                    Cronograma, Prazos & Garantia do Serviço
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    SLA & Proteção Pós-Entrega
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Prazo Previsto de Conclusão */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-500" />
                      Previsão de Término / Entrega
                    </label>
                    <input
                      type="datetime-local"
                      value={previsaoConclusao}
                      onChange={(e) => setPrevisaoConclusao(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#68D346]"
                    />
                    <span className="text-[8.5px] text-slate-400 mt-1 block">
                      Prazo prometido no orçamento aprovado.
                    </span>
                  </div>

                  {/* Garantia em Meses */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <CalendarCheck className="w-3 h-3 text-emerald-500" />
                      Garantia do Serviço (Meses)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 3, 6, 12 meses"
                      value={garantiaMeses}
                      onChange={(e) => setGarantiaMeses(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#68D346]"
                    />
                    <span className="text-[8.5px] text-slate-400 mt-1 block">
                      Cobertura legal ou estendida da oficina.
                    </span>
                  </div>

                  {/* Garantia em Quilometragem */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-blue-500" />
                      Garantia por Quilometragem (KM)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 5000, 10000 km"
                      value={garantiaKm}
                      onChange={(e) => setGarantiaKm(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#68D346]"
                    />
                    <span className="text-[8.5px] text-slate-400 mt-1 block">
                      Limite de km rodados sob cobertura.
                    </span>
                  </div>
                </div>

                {/* Destaque se o SLA de entrega estiver atrasado */}
                {previsaoConclusao && new Date(previsaoConclusao).getTime() < Date.now() && status !== 'CONCLUIDA' && status !== 'REJEITADA' && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                    <span>
                      <strong>Atenção ao SLA:</strong> A data prevista de conclusão informada expirou ({new Date(previsaoConclusao).toLocaleString('pt-BR')}). Cobrar posicionamento da oficina.
                    </span>
                  </div>
                )}
              </div>

              {/* ==================================================================== */}
              {/* PAINEL DE CONTROLE DE RECUSA / NÃO AUTORIZAÇÃO (STATUS = REJEITADA)   */}
              {/* ==================================================================== */}
              {status === 'REJEITADA' && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-900/70 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-rose-200 dark:border-rose-900/50">
                    <span className="text-xs font-black uppercase text-rose-700 dark:text-rose-400 flex items-center gap-2">
                      <Ban className="w-4 h-4" />
                      Auditoria de Não Autorização / Recusa da O.S.
                    </span>
                    <span className="text-[9px] font-mono text-rose-600 dark:text-rose-400 font-bold">
                      Liberação da Viatura no Pátio
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300 mb-1">
                      Justificativa Técnica / Motivo da Não Autorização *
                    </label>
                    <textarea
                      rows={2}
                      value={motivoRecusa}
                      onChange={(e) => setMotivoRecusa(e.target.value)}
                      placeholder="Ex: Cotação acima do teto orçamentário; veículo aguardando desmobilização; reparos considerados inviáveis pela diretoria..."
                      className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-rose-600 text-rose-950 dark:text-rose-100"
                      required={status === 'REJEITADA'}
                    />
                    <span className="text-[9px] text-rose-600 dark:text-rose-400 block mt-1">
                      Este motivo constará formalmente nos relatórios de auditoria e no Romaneio como justificativa do cancelamento.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= ABA 2: ORÇAMENTOS & COTAÇÕES ================= */}
          {modalTab === 'ORCAMENTOS' && (
            <div className="space-y-4">

              {/* ==================================================================== */}
              {/* MAPA COMPARATIVO DE COTAÇÕES (CONCORRÊNCIA EM ATÉ 3 OFICINAS)        */}
              {/* ==================================================================== */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#181A1E] border border-slate-200 dark:border-[#282A2F] shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-[#282A2F]">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                      <Award className="w-4 h-4 text-amber-500" />
                      Mapa Comparativo de Cotações ({orcamentosConcorrentes.length}/3 Oficinas)
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-zinc-400">
                      Compare Preço, Prazo e Período de Garantia entre até 3 oficinas concorrentes para eleger a melhor proposta.
                    </p>
                  </div>
                  {orcamentosConcorrentes.some(c => c.selecionada) && (
                    <span className="px-2.5 py-1 rounded-lg text-[9.5px] font-mono font-bold bg-[#1C4E26] text-[#B7F365] border border-[#68D346] flex items-center gap-1 self-start sm:self-auto">
                      <CheckCircle2 className="w-3 h-3" /> Proposta Vencedora Definida
                    </span>
                  )}
                </div>

                {/* Cards das Cotações Lado a Lado */}
                {orcamentosConcorrentes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121418] border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                    <p className="text-xs text-slate-500 font-bold">Nenhuma cotação concorrente registrada ainda.</p>
                    <p className="text-[11px] text-slate-400">Preencha o formulário abaixo para registrar os orçamentos de até 3 oficinas distintas.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {orcamentosConcorrentes.map((cot, idx) => (
                      <div
                        key={cot.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative ${
                          cot.selecionada
                            ? 'bg-emerald-50/50 dark:bg-[#1C4E26]/20 border-[#68D346] shadow-sm ring-1 ring-[#68D346]'
                            : 'bg-slate-50 dark:bg-[#121418] border-slate-200 dark:border-[#282A2F]'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-mono font-bold text-slate-400">
                              Oficina 0{idx + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              {cot.selecionada ? (
                                <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono bg-[#68D346] text-slate-950 uppercase">
                                  🏆 Vencedora
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSelectVencedora(cot.id)}
                                  className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent"
                                >
                                  Selecionar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveCotacao(cot.id)}
                                className="text-slate-400 hover:text-red-500 p-0.5 border-none bg-transparent cursor-pointer"
                                title="Excluir Cotação"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={cot.oficina_nome}>
                              {cot.oficina_nome}
                            </h5>
                            <p className="text-base font-black font-mono text-emerald-600 dark:text-[#68D346] mt-0.5">
                              {Number(cot.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1 border-t border-slate-200/60 dark:border-[#282A2F]">
                            <div>
                              <span className="text-slate-400 block font-mono text-[8.5px]">Prazo Entrega:</span>
                              <span className="font-bold text-slate-700 dark:text-zinc-200">
                                {cot.prazo_dias ? `${cot.prazo_dias} dias úteis` : 'A combinar'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-mono text-[8.5px]">Garantia:</span>
                              <span className="font-bold text-slate-700 dark:text-zinc-200">
                                {cot.garantia_meses ? `${cot.garantia_meses} meses` : 'Padrão'} {cot.garantia_km ? `(${cot.garantia_km} km)` : ''}
                              </span>
                            </div>
                          </div>

                          {cot.condicoes_pagamento && (
                            <p className="text-[9.5px] text-slate-500 italic truncate">
                              Condição: {cot.condicoes_pagamento}
                            </p>
                          )}
                        </div>

                        {!cot.selecionada && (
                          <button
                            type="button"
                            onClick={() => handleSelectVencedora(cot.id)}
                            className="mt-3 w-full py-1.5 px-2 rounded-xl text-[10px] font-bold font-mono uppercase bg-slate-200 dark:bg-[#282A2F] hover:bg-[#68D346] hover:text-slate-950 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer border-none flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Escolher Proposta
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulário de Adição de Cotação Concorrente (até 3) */}
                {orcamentosConcorrentes.length < 3 && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121418] border border-slate-200/70 dark:border-[#282A2F] space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono block">
                      + Adicionar Cotação Concorrente ({orcamentosConcorrentes.length + 1} de 3)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Oficina / Prestador *</label>
                        <input
                          type="text"
                          placeholder="Ex: Mecânica Silva ou Oficina Modelo"
                          value={novaCotFornecedor}
                          onChange={(e) => setNovaCotFornecedor(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Valor Proposto (R$) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Ex: 3400.00"
                          value={novaCotValor}
                          onChange={(e) => setNovaCotValor(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs font-mono font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Prazo (Dias Úteis)</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Ex: 3"
                          value={novaCotPrazoDias}
                          onChange={(e) => setNovaCotPrazoDias(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs font-mono font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Garantia (Meses)</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Ex: 6 meses"
                          value={novaCotGarantiaMeses}
                          onChange={(e) => setNovaCotGarantiaMeses(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs font-mono outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Garantia (KM)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Ex: 10000 km"
                          value={novaCotGarantiaKm}
                          onChange={(e) => setNovaCotGarantiaKm(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs font-mono outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Condições de Pagamento</label>
                        <input
                          type="text"
                          placeholder="Ex: Faturado 28 dias"
                          value={novaCotCondicoes}
                          onChange={(e) => setNovaCotCondicoes(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddCotacao}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-[#282A2F] dark:hover:bg-[#3C3F45] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Proposta ao Mapa
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ANEXOS & PROPOSTAS COMERCIAIS */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Anexar Novo Orçamento ou Proposta Comercial
                </h4>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-400">
                  Faça o upload do documento em PDF ou foto (JPEG/PNG) enviado pela oficina para fins de aprovação prévia.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Identificação / Oficina
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Orçamento Inicial - Oficina Salobo"
                      value={novoOrcTitulo}
                      onChange={(e) => setNovoOrcTitulo(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Valor Estimado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1450.00"
                      value={novoOrcValor}
                      onChange={(e) => setNovoOrcValor(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <input
                    ref={orcFileInputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={handleAddOrcamento}
                    className="hidden"
                    id="orc-file-input"
                  />
                  <label
                    htmlFor="orc-file-input"
                    className="w-full py-3 px-4 border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-500 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all text-xs font-bold text-blue-600 dark:text-blue-400"
                  >
                    <Upload className="w-4 h-4" />
                    Selecionar Arquivo de Orçamento (PDF ou Foto)
                  </label>
                </div>
              </div>

              {/* Lista de Orçamentos Anexados */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Orçamentos Anexados ({orcamentos.length})
                </h4>

                {orcamentos.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                    <FileSpreadsheet className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Nenhum orçamento anexado a esta O.S.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orcamentos.map((orc) => (
                      <div
                        key={orc.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {orc.titulo}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                              <span>{orc.nome_arquivo}</span>
                              {orc.valor_estimado && (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  R$ {orc.valor_estimado.toFixed(2)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={orc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Ver
                          </a>
                          <button
                            type="button"
                            onClick={() => setOrcamentos(orcamentos.filter(x => x.id !== orc.id))}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fotos e Evidências Fotográficas de Avaria */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-orange-500" />
                      Evidências Fotográficas & Avarias ({comprovantesUrls.length})
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Fotos do defeito enviadas pelo operador ou registradas durante vistoria
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fotoEvidenciaRef}
                      onChange={handleAddEvidenciaFoto}
                      className="hidden"
                      id="evidencia-foto-input"
                    />
                    <label
                      htmlFor="evidencia-foto-input"
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Foto
                    </label>
                  </div>
                </div>

                {comprovantesUrls.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Nenhuma foto anexada a esta ordem de serviço.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {comprovantesUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video flex items-center justify-center">
                        <img src={url} alt={`Evidência ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white text-slate-900 rounded-lg shadow-xs hover:scale-105 transition-transform"
                            title="Visualizar em tamanho real"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setComprovantesUrls(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 bg-red-600 text-white rounded-lg shadow-xs hover:scale-105 transition-transform border-none cursor-pointer"
                            title="Remover foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= ABA 3: RATEIO DE CUSTOS & NOTAS FISCAIS ================= */}
          {modalTab === 'RATEIO_NOTAS' && (
            <div className="space-y-4">
              {/* Cards de Rateio Contábil */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Rateio Contábil de Custos da Ordem de Serviço
                  </h4>
                  {notasFiscais.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSincronizarRateioComNfs}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      Preencher com base nas NFs
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Mão de Obra / Serviços (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custoMaoObra}
                      onChange={(e) => setCustoMaoObra(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Peças Trocadas (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custoPecas}
                      onChange={(e) => setCustoPecas(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Pneus / Desgaste (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custoPneus}
                      onChange={(e) => setCustoPneus(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-mono font-bold outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Custo Total Consolidado
                    </label>
                    <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>R$</span>
                      <span>{custoTotal}</span>
                    </div>
                    {totalAditivosAprovados > 0 && (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
                        + R$ {totalAditivosAprovados.toFixed(2)} em aditivos aprovados
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ==================================================================== */}
              {/* ORÇAMENTOS COMPLEMENTARES / ADITIVOS DE REPARO                       */}
              {/* ==================================================================== */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-amber-200/70 dark:border-amber-900/50">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Orçamentos Complementares / Aditivos ({orcamentosAditivos.length})
                  </h4>
                  <span className="text-[9px] text-amber-700 dark:text-amber-400 font-mono">
                    Defeitos ocultos surgidos durante a execução dos reparos
                  </span>
                </div>

                {orcamentosAditivos.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">
                    Nenhum orçamento complementar / aditivo solicitado para esta ordem.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orcamentosAditivos.map((adit) => (
                      <div
                        key={adit.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                              Aditivo #{adit.numero_aditivo}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {adit.descricao}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Motivo: <em>{adit.motivo}</em>
                            {adit.prazo_adicional_dias ? ` • +${adit.prazo_adicional_dias} dias de prazo` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="font-mono font-black text-xs text-emerald-600 dark:text-[#68D346]">
                            + {Number(adit.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>

                          <select
                            value={adit.status}
                            onChange={(e) => handleToggleAditivoStatus(adit.id, e.target.value as any)}
                            className={`text-[9.5px] font-bold font-mono py-1 px-2 rounded-lg border cursor-pointer outline-none ${
                              adit.status === 'APROVADO'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : adit.status === 'REJEITADO'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300'
                            }`}
                          >
                            <option value="APROVADO">Aprovado</option>
                            <option value="SOLICITADO">Pendente</option>
                            <option value="REJEITADO">Rejeitado</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveAditivo(adit.id)}
                            className="p-1 text-slate-400 hover:text-red-500 border-none bg-transparent cursor-pointer"
                            title="Excluir Aditivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulário de Novo Aditivo */}
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-dashed border-amber-300 dark:border-amber-900/60 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 font-mono block">
                    + Solicitar Orçamento Complementar / Aditivo
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Descrição do Defeito / Peça Extra *</label>
                      <input
                        type="text"
                        placeholder="Ex: Troca do atuador da embreagem identificado na desmontagem"
                        value={novoAditDescricao}
                        onChange={(e) => setNovoAditDescricao(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs font-medium outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Valor Adicional (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ex: 650.00"
                        value={novoAditValor}
                        onChange={(e) => setNovoAditValor(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs font-mono font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Prazo Extra (Dias)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ex: 2"
                        value={novoAditPrazoDias}
                        onChange={(e) => setNovoAditPrazoDias(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Justificativa Técnica</label>
                    <input
                      type="text"
                      placeholder="Ex: Peça apresentou trinca estrutural visível apenas após retirada do conjunto"
                      value={novoAditMotivo}
                      onChange={(e) => setNovoAditMotivo(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddAditivo}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Incluir Aditivo
                    </button>
                  </div>
                </div>
              </div>

              {/* Seção de Anexo de Notas Fiscais */}
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Anexar Nota Fiscal (NFS-e de Serviços ou NF-e de Peças/Pneus)
                </h4>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                  Vincule a cópia do documento fiscal para auditoria e composição do relatório financeiro consolidado.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Tipo de Nota
                    </label>
                    <select
                      value={novaNfTipo}
                      onChange={(e) => setNovaNfTipo(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="SERVICO">NFS-e (Mão de Obra / Serviço)</option>
                      <option value="PECA">NF-e (Peças e Componentes)</option>
                      <option value="PNEU">NF-e (Pneus e Borracharia)</option>
                      <option value="GERAL">NF Conjugada (Peças + Serviço)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Número da NF *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 001.428"
                      value={novaNfNumero}
                      onChange={(e) => setNovaNfNumero(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Valor da Nota (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 850.00"
                      value={novaNfValor}
                      onChange={(e) => setNovaNfValor(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <input
                    ref={nfFileInputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={handleAddNotaFiscal}
                    className="hidden"
                    id="nf-file-input"
                  />
                  <label
                    htmlFor="nf-file-input"
                    className="w-full py-3 px-4 border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    <Upload className="w-4 h-4" />
                    Carregar Arquivo da Nota Fiscal (PDF ou Foto)
                  </label>
                </div>
              </div>

              {/* Lista de Notas Fiscais Anexadas */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Notas Fiscais Homologadas ({notasFiscais.length})
                </h4>

                {notasFiscais.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                    <Receipt className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Nenhuma Nota Fiscal anexada até o momento.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notasFiscais.map((nf) => (
                      <div
                        key={nf.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 font-black text-xs">
                            NF
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              NF Nº {nf.numero_nf} • <span className="text-slate-500">{nf.tipo}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                              <span>{nf.nome_arquivo}</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                R$ {Number(nf.valor || 0).toFixed(2)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={nf.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Ver
                          </a>
                          <button
                            type="button"
                            onClick={() => setNotasFiscais(notasFiscais.filter(x => x.id !== nf.id))}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* RODAPÉ E BOTÕES DE AÇÃO */}
          {/* ==================================================================== */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">
                Total: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">R$ {custoTotal}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[11px] text-slate-500">
                {orcamentos.length} orçamento(s) • {notasFiscais.length} NF(s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Wrench className="w-4 h-4" />
                {isSaving ? 'Gravando O.S...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* MODAL DE ROMANEIO CORPORATIVO SPCI */}
      <OSRomaneioModal
        isOpen={isRomaneioOpen}
        onClose={() => setIsRomaneioOpen(false)}
        os={{
          ...(osToEdit || {}),
          id: osToEdit?.id || 'temp-preview',
          numero_os: numeroOs,
          data_abertura: dataAbertura ? new Date(dataAbertura).toISOString() : new Date().toISOString(),
          prioridade: prioridade,
          tipo_os: tipoOs,
          natureza_manutencao: natureza,
          tipo_manutencao: natureza === 'PREVENTIVA' ? 'PREVENTIVA' : 'CORRETIVA',
          status: status,
          status_os: status,
          odometro_km: parseFloat(odometro) || 0,
          descricao_servico: descricao,
          custo_pecas: parseFloat(custoPecas) || 0,
          custo_mao_de_obra: parseFloat(custoMaoObra) || 0,
          custo_pneus: parseFloat(custoPneus) || 0,
          custo_total: parseFloat(custoTotal) || 0,
          valor_estimado: parseFloat(custoTotal) || 0,
          resumo_anatomico: resumoAnatomico,
          itens_componentes_json: subcomponentes as any,
          contrato_id: contratoId || activeViatura?.contrato_id || 'PARAUAPEBAS',
          viatura_id: activeViatura?.id || selectedViaturaId,
          responsavel_abertura: osToEdit?.responsavel_abertura || userProfile?.name || currentUser?.displayName || 'Inspetor de Frotas SPCI',
          previsao_conclusao: previsaoConclusao ? new Date(previsaoConclusao).toISOString() : null,
          garantia_meses: parseInt(garantiaMeses) || null,
          garantia_km: parseInt(garantiaKm) || null,
          motivo_recusa: motivoRecusa || null,
          orcamentos_concorrentes_json: orcamentosConcorrentes,
          orcamentos_aditivos_json: orcamentosAditivos
        } as any}
        viatura={activeViatura}
        oficina={oficinas.find(o => o.id === oficinaId) || null}
        emitenteNome={userProfile?.name || currentUser?.displayName || 'Inspetor de Frotas SPCI'}
      />
    </div>
  );
};
