import { OrdemServicoFrota, Viatura, OficinaPrestador } from '@/lib/types/frota';
import { SubcomponenteSelecionado } from '@/lib/types/vehicleAnatomy';

/**
 * Formata um identificador técnico de OS em um protocolo amigável e rastreável de Romaneio
 * Padrão Rastreabilidade SPCI: ROM-OS-AAMM-CODIGO (Ex: ROM-OS-2609-001234)
 */
export function formatFriendlyRomaneioProtocol(
  osId?: string,
  dateStr?: string | Date,
  prefixoViatura?: string
): {
  shortCode: string;
  fullId: string;
  dateFormatted: string;
  timeFormatted: string;
} {
  const fullId = osId || '';
  const d = dateStr ? new Date(dateStr) : new Date();
  const validDate = !isNaN(d.getTime()) ? d : new Date();

  const year = String(validDate.getFullYear()).slice(-2);
  const month = String(validDate.getMonth() + 1).padStart(2, '0');

  let codePart = '';
  if (fullId) {
    const clean = fullId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    codePart = clean.length >= 6 ? clean.slice(-6) : clean.padStart(6, '0');
  } else if (prefixoViatura) {
    codePart = prefixoViatura.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  } else {
    codePart = '001001';
  }

  const shortCode = `ROM-OS-${year}${month}-${codePart}`;
  const dateFormatted = validDate.toLocaleDateString('pt-BR');
  const timeFormatted = validDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return {
    shortCode,
    fullId,
    dateFormatted,
    timeFormatted
  };
}

export interface GenerateRomaneioPDFOptions {
  os: OrdemServicoFrota;
  viatura?: Viatura | null;
  oficina?: OficinaPrestador | null;
  emitenteNome?: string;
  emitenteCargo?: string;
  aprovadorNome?: string;
  aprovadorCargo?: string;
}

/**
 * Constrói a estrutura HTML de alta fidelidade visual do Romaneio da O.S.
 */
export function buildRomaneioHTML({
  os,
  viatura,
  oficina,
  emitenteNome = 'Inspetor de Frotas SPCI',
  emitenteCargo = 'Técnico Operacional de Frotas',
  aprovadorNome = 'Gestor Responsável SPCI',
  aprovadorCargo = 'Coordenador de Manutenção & Ativos'
}: GenerateRomaneioPDFOptions): string {

  const proto = formatFriendlyRomaneioProtocol(
    os.id || os.numero_os,
    os.data_abertura || os.created_at,
    viatura?.prefixo_frota
  );

  const prioridade = (os.prioridade || 'NORMAL').toUpperCase();
  const prioridadeCor = prioridade === 'EMERGENCIA' ? '#b91c1c' : prioridade === 'URGENTE' ? '#d97706' : '#15803d';
  const prioridadeBg = prioridade === 'EMERGENCIA' ? '#fef2f2' : prioridade === 'URGENTE' ? '#fffbeb' : '#f0fdf4';

  const custoPecas = Number(os.custo_pecas || 0);
  const custoMaoObra = Number(os.custo_mao_de_obra || 0);
  const custoPneus = Number(os.custo_pneus || 0);
  const custoTotal = Number(os.custo_total || os.valor_estimado || (custoPecas + custoMaoObra + custoPneus));

  const valorFormatado = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Componentes e itens anatômicos
  const componentes: SubcomponenteSelecionado[] = (os.itens_componentes_json || []) as SubcomponenteSelecionado[];

  // Renderização das linhas da tabela de componentes
  let componentesRowsHtml = '';
  if (componentes.length > 0) {
    componentesRowsHtml = componentes.map((c, idx) => {
      const subtotal = (c.quantidade || 1) * (c.valor_unitario_estimado || 0);
      const isCritico = c.criticidade === 'EMERGENCIA';
      return `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${c.nome_componente_macro || 'Macro-Sistema'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
            <strong>${c.nome_subcomponente}</strong>
            ${c.observacao ? `<div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Obs: ${c.observacao}</div>` : ''}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #2563eb; text-align: center;">${c.acao || 'SUBSTITUICAO'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569;">${c.posicao || 'COMPLETO'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">${c.quantidade || 1}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">${c.valor_unitario_estimado ? valorFormatado(c.valor_unitario_estimado) : 'A orçar'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a;">${subtotal > 0 ? valorFormatado(subtotal) : 'A orçar'}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${isCritico ? '#fee2e2' : '#f1f5f9'}; color: ${isCritico ? '#b91c1c' : '#475569'};">
              ${c.criticidade || 'NORMAL'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    componentesRowsHtml = `
      <tr>
        <td colspan="8" style="padding: 12px; text-align: center; color: #64748b; font-style: italic; border-bottom: 1px solid #e2e8f0;">
          ${os.resumo_anatomico || os.descricao_servico || 'Nenhum componente específico listado individualmente. Manutenção geral de acordo com o escopo descritivo.'}
        </td>
      </tr>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Romaneio de O.S. - ${proto.shortCode}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 8mm 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 10px;
          line-height: 1.35;
          padding: 6px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2.5px solid #af101a;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        .brand-title {
          font-size: 15px;
          font-weight: 900;
          color: #af101a;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 8.5px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          margin-top: 1px;
        }
        .doc-code {
          font-family: monospace;
          font-size: 11px;
          font-weight: 800;
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          color: #af101a;
          display: inline-block;
        }
        .section-title {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0f172a;
          margin-top: 8px;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f8fafc;
          padding: 3px 6px;
          border-left: 3px solid #af101a;
          border-radius: 2px;
        }
        .two-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 6px;
        }
        .card-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px;
          background: #ffffff;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
        }
        .meta-table td {
          padding: 2.5px 4px;
          border-bottom: 1px solid #f1f5f9;
        }
        .meta-table td.label {
          font-weight: 700;
          color: #64748b;
          width: 38%;
        }
        .meta-table td.val {
          font-weight: 600;
          color: #0f172a;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          margin-top: 4px;
          margin-bottom: 6px;
        }
        .items-table th {
          background: #1e293b;
          color: #ffffff;
          font-weight: 800;
          text-transform: uppercase;
          padding: 5px 6px;
          font-size: 8px;
          letter-spacing: 0.5px;
          text-align: left;
        }
        .financial-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-top: 4px;
          margin-bottom: 6px;
        }
        .financial-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px;
          text-align: center;
          background: #f8fafc;
        }
        .financial-box.highlight {
          border-color: #15803d;
          background: #f0fdf4;
        }
        .financial-box .lbl {
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
        }
        .financial-box .val {
          font-size: 11px;
          font-weight: 900;
          color: #0f172a;
          margin-top: 2px;
        }
        .financial-box.highlight .val {
          color: #15803d;
        }
        .desc-box {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 8px;
          background: #fcfcfc;
          font-size: 9px;
          color: #334155;
          margin-bottom: 6px;
          white-space: pre-wrap;
          line-height: 1.4;
        }
        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
          page-break-inside: avoid;
        }
        .sign-box {
          border-top: 1.5px solid #475569;
          text-align: center;
          padding-top: 4px;
        }
        .sign-title {
          font-size: 8.5px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
        }
        .sign-sub {
          font-size: 7.5px;
          color: #64748b;
          margin-top: 1px;
        }
        .footer {
          margin-top: 10px;
          padding-top: 4px;
          border-top: 1px solid #e2e8f0;
          font-size: 7.5px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body {
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Ações na tela (escondidas ao imprimir) -->
      <div class="no-print" style="margin-bottom: 10px; padding: 8px; background: #0f172a; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; color: white;">
        <span style="font-weight: 700; font-size: 11px;">Prévia do Romaneio Oficial de Encaminhamento</span>
        <button onclick="window.print()" style="background: #af101a; color: white; border: none; padding: 6px 16px; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer;">
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      <!-- CABEÇALHO CORPORATIVO -->
      <div class="header">
        <div>
          <div class="brand-title">SIGER Master • SISTEMA DE GESTÃO DE FROTAS & SPCI</div>
          <div class="brand-sub">ROMANEIO TÉCNICO DE ENCAMINHAMENTO DE VIATURA • GRUPO OMG / CARAJÁS</div>
        </div>
        <div style="text-align: right;">
          <div class="doc-code">${proto.shortCode}</div>
          <div style="font-size: 8px; color: #64748b; font-family: monospace; margin-top: 2px;">OS Oficial: #${os.numero_os || 'PENDENTE'}</div>
          <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">Emissão: ${proto.dateFormatted} às ${proto.timeFormatted}</div>
        </div>
      </div>

      <!-- BLOCO BILATERAL: VEÍCULO & OFICINA DESTINO -->
      <div class="two-cols">
        <!-- Bloco Veículo -->
        <div class="card-box">
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #af101a; margin-bottom: 4px; display: flex; justify-content: space-between;">
            <span>🚓 1. DADOS DA VIATURA</span>
            <span style="color: ${prioridadeCor}; background: ${prioridadeBg}; padding: 1px 5px; border-radius: 3px; font-size: 8px;">
              CRITICIDADE: ${prioridade}
            </span>
          </div>
          <table class="meta-table">
            <tr>
              <td class="label">Prefixo da Frota:</td>
              <td class="val" style="font-weight: 800; color: #af101a;">${viatura?.prefixo_frota || 'VTR-01'}</td>
            </tr>
            <tr>
              <td class="label">Placa Mercosul:</td>
              <td class="val" style="font-family: monospace; font-weight: 800;">${viatura?.placa || 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Marca / Modelo:</td>
              <td class="val">${viatura?.marca || ''} ${viatura?.modelo || 'Veículo Operacional'}</td>
            </tr>
            <tr>
              <td class="label">Tipo de Veículo:</td>
              <td class="val">${viatura?.tipo_veiculo || 'CAMINHONETE'}</td>
            </tr>
            <tr>
              <td class="label">Odômetro de Entrada:</td>
              <td class="val">${Number(os.odometro_km || viatura?.odometro_atual_km || 0).toLocaleString('pt-BR')} KM</td>
            </tr>
            <tr>
              <td class="label">Base / Contrato:</td>
              <td class="val">${os.contrato_id || viatura?.contrato_id || 'PARAUAPEBAS'}</td>
            </tr>
          </table>
        </div>

        <!-- Bloco Oficina Destino -->
        <div class="card-box">
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #2563eb; margin-bottom: 4px; display: flex; justify-content: space-between;">
            <span>🏢 2. DESTINO & EXECUÇÃO</span>
            <span style="color: #475569; font-size: 8px;">ORIGEM: ${os.tipo_os || 'EXTERNA'}</span>
          </div>
          <table class="meta-table">
            <tr>
              <td class="label">Oficina / Estabelecimento:</td>
              <td class="val" style="font-weight: 800; color: #1e293b;">${oficina?.nome_fantasia || oficina?.razao_social || (os.tipo_os === 'INTERNA' ? 'Oficina Interna da Base SIGER' : 'Oficina Homologada Externa')}</td>
            </tr>
            <tr>
              <td class="label">CNPJ / Identificação:</td>
              <td class="val" style="font-family: monospace;">${oficina?.cnpj || 'Homologada no Contrato'}</td>
            </tr>
            <tr>
              <td class="label">Contato / Telefone:</td>
              <td class="val">${oficina?.telefone || '(94) 99100-0000'}</td>
            </tr>
            <tr>
              <td class="label">Natureza da Manutenção:</td>
              <td class="val" style="font-weight: 700;">${os.tipo_manutencao || os.natureza_manutencao || 'CORRETIVA'}</td>
            </tr>
            <tr>
              <td class="label">Status da Ordem:</td>
              <td class="val" style="font-weight: 800; color: #15803d;">${os.status_os || os.status || 'ABERTA'}</td>
            </tr>
            <tr>
              <td class="label">Etapa do Workflow:</td>
              <td class="val">Etapa ${os.numero_etapa || 1}/6 — ${os.etapa_atual || '1_ABERTURA_TRIAGEM'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- SEÇÃO 3: ANATOMIA VEICULAR: COMPONENTES & SERVIÇOS REQUERIDOS -->
      <div class="section-title">🔩 3. ANATOMIA VEICULAR: COMPONENTES & SERVIÇOS A MANUTENIR</div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 15%;">Sistema Macro</th>
            <th style="width: 28%;">Subcomponente / Peça</th>
            <th style="width: 13%; text-align: center;">Ação</th>
            <th style="width: 11%; text-align: center;">Posição</th>
            <th style="width: 6%; text-align: center;">Qtd</th>
            <th style="width: 11%; text-align: right;">Unit. Est.</th>
            <th style="width: 10%; text-align: right;">Subtotal</th>
            <th style="width: 6%; text-align: center;">Risco</th>
          </tr>
        </thead>
        <tbody>
          ${componentesRowsHtml}
        </tbody>
      </table>

      <!-- SEÇÃO 4: RESUMO FINANCEIRO & RATEIO -->
      <div class="section-title">💰 4. ESTIMATIVA ORÇAMENTÁRIA & RATEIO DE CUSTOS</div>
      <div class="financial-grid">
        <div class="financial-box">
          <div class="lbl">Peças & Componentes</div>
          <div class="val">${valorFormatado(custoPecas)}</div>
        </div>
        <div class="financial-box">
          <div class="lbl">Mão de Obra Especializada</div>
          <div class="val">${valorFormatado(custoMaoObra)}</div>
        </div>
        <div class="financial-box">
          <div class="lbl">Pneus & Borracharia</div>
          <div class="val">${valorFormatado(custoPneus)}</div>
        </div>
        <div class="financial-box highlight">
          <div class="lbl">Total Estimado da O.S.</div>
          <div class="val">${valorFormatado(custoTotal)}</div>
        </div>
      </div>

      <!-- SEÇÃO 5: ESCOPO DESCRITIVO & DIAGNÓSTICO -->
      <div class="section-title">📝 5. ESCOPO DO SERVIÇO & DIAGNÓSTICO DO SOLICITANTE</div>
      <div class="desc-box">
${os.descricao_motivo || os.descricao_servico || 'Manutenção geral programada para a viatura operacional.'}
      </div>

      <!-- SEÇÃO 6: TERMO DE ENCAMINHAMENTO & ASSINATURAS BILATERAIS -->
      <div class="section-title">✍️ 6. FORMALIZAÇÃO, TRAMITAÇÃO E ASSINATURAS</div>
      <div style="font-size: 8px; color: #64748b; margin-bottom: 6px; line-height: 1.3;">
        O presente Romaneio autoriza o recebimento e início da vistoria técnica pela oficina credenciada. A execução efetiva fica condicionada à emissão do orçamento e validação da alçada de aprovação conforme matriz corporativa SIGER Master.
      </div>

      <div class="signatures-grid">
        <!-- Emitente -->
        <div class="sign-box">
          <div style="height: 28px;"></div>
          <div class="sign-title">${emitenteNome}</div>
          <div class="sign-sub">${emitenteCargo}</div>
          <div class="sign-sub">Emitente / Inspetor Solicitante</div>
        </div>

        <!-- Oficina Credenciada -->
        <div class="sign-box">
          <div style="height: 28px;"></div>
          <div class="sign-title">${oficina?.responsavel || oficina?.contato_responsavel || 'Responsável Técnico da Oficina'}</div>
          <div class="sign-sub">${oficina?.nome_fantasia || oficina?.razao_social || 'Oficina Credenciada Homologada'}</div>
          <div class="sign-sub">Recebimento & Vistoria Técnica</div>
        </div>

        <!-- Aprovador -->
        <div class="sign-box">
          <div style="height: 28px;"></div>
          <div class="sign-title">${aprovadorNome}</div>
          <div class="sign-sub">${aprovadorCargo}</div>
          <div class="sign-sub">Aprovador / Gestor de Frota SPCI</div>
        </div>
      </div>

      <!-- RODAPÉ CORPORATIVO -->
      <div class="footer">
        <span>SIGER Master • Sistema de Gestão Contra Incêndio & Frotas • Complexo Carajás</span>
        <span>Autenticação: ${os.id ? `UUID-${os.id.slice(0, 8)}` : 'SISTEMA-INTEGRADO'}</span>
        <span>Página 1 de 1</span>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Abre a janela de impressão nativa do navegador com o Romaneio estruturado
 */
export function generateRomaneioPDF(options: GenerateRomaneioPDFOptions) {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, autorize popups no seu navegador para visualizar e imprimir o Romaneio da O.S.');
    return;
  }

  const html = buildRomaneioHTML(options);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Gera o documento binário PDF de alta fidelidade visual (vetorial puro via jsPDF)
 * Retorna o Blob, o objeto File (para Web Share API) e o nome do arquivo.
 */
export async function generateRomaneioPDFBlob(
  options: GenerateRomaneioPDFOptions
): Promise<{ blob: Blob; file: File; filename: string }> {
  const { jsPDF } = await import('jspdf');

  const {
    os,
    viatura,
    oficina,
    emitenteNome = 'Inspetor de Frotas SPCI',
    emitenteCargo = 'Técnico Operacional de Frotas',
    aprovadorNome = 'Gestor Responsável SPCI',
    aprovadorCargo = 'Coordenador de Manutenção & Ativos'
  } = options;

  const proto = formatFriendlyRomaneioProtocol(
    os.id || os.numero_os,
    os.data_abertura || os.created_at,
    viatura?.prefixo_frota
  );

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  let y = 10;

  // Header Box Escuro
  doc.setFillColor(30, 32, 36);
  doc.rect(10, y, w - 20, 20, 'F');

  doc.setTextColor(183, 243, 101);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGER MASTER • GESTÃO DE FROTAS & SPCI • GRUPO OMG', 14, y + 6);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.text('ROMANEIO DE ENCAMINHAMENTO DA O.S.', 14, y + 12);

  doc.setFontSize(7);
  doc.setTextColor(213, 217, 220);
  doc.setFont('helvetica', 'normal');
  doc.text('VISTORIA TÉCNICA, RATEIO DE COMPONENTES & APROVAÇÃO', 14, y + 16.5);

  // Bloco de Protocolo & Informações à Direita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(183, 243, 101);
  doc.text('PROTOCOLO:', w - 65, y + 6);
  doc.setTextColor(255, 255, 255);
  doc.text(proto.shortCode, w - 43, y + 6);

  const prioridade = (os.prioridade || 'NORMAL').toUpperCase();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(213, 217, 220);
  doc.text(`EMISSÃO: ${proto.dateFormatted} ${proto.timeFormatted}`, w - 65, y + 11);
  doc.text(`CRITICIDADE: ${prioridade}`, w - 65, y + 15.5);

  y += 20;
  // Faixa de destaque verde SIGER
  doc.setDrawColor(104, 211, 70);
  doc.setLineWidth(0.8);
  doc.line(10, y, w - 10, y);
  y += 4;

  // Grid 2 Colunas: Viatura e Oficina
  const colW = (w - 20 - 4) / 2;
  const col1X = 10;
  const col2X = 10 + colW + 4;
  const cardH = 28;

  // Card 1: Viatura
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(col1X, y, colW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. DADOS DA VIATURA & OPERAÇÃO', col1X + 4, y + 5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Prefixo: ', col1X + 4, y + 10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(viatura?.prefixo_frota || 'VIATURA', col1X + 16, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Placa: ', col1X + 45, y + 10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(viatura?.placa || 'N/A', col1X + 54, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const modeloTxt = `${viatura?.marca || ''} ${viatura?.modelo || ''}`.trim() || 'Não especificado';
  doc.text(`Modelo: ${modeloTxt.slice(0, 35)}`, col1X + 4, y + 15);
  const odomTxt = Number(os.odometro_km || viatura?.odometro_atual_km || 0).toLocaleString('pt-BR');
  doc.text(`Odômetro Entrada: ${odomTxt} km`, col1X + 4, y + 20);
  doc.text(`Base Operacional: ${viatura?.contrato_id || os.contrato_id || 'PARAUAPEBAS'}`, col1X + 4, y + 25);

  // Card 2: Oficina
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, colW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. DESTINO & EXECUÇÃO', col2X + 4, y + 5);

  const ofcNome = oficina?.nome_fantasia || oficina?.razao_social || (os.tipo_os === 'INTERNA' ? 'Oficina Interna da Base SIGER' : 'Oficina Homologada Externa');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Estabelecimento:', col2X + 4, y + 10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(ofcNome.slice(0, 32), col2X + 27, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`CNPJ: ${oficina?.cnpj || 'Cadastrada no Contrato'}`, col2X + 4, y + 15);
  doc.text(`Contato: ${oficina?.telefone || '(94) 99100-0000'}`, col2X + 4, y + 20);
  const natTxt = os.tipo_manutencao || os.natureza_manutencao || 'CORRETIVA';
  doc.text(`Natureza: ${natTxt} (${os.tipo_os || 'EXTERNA'})`, col2X + 4, y + 25);

  y += cardH + 4;

  // Título Seção 3
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, w - 20, 6, 'F');
  doc.setDrawColor(175, 16, 26);
  doc.setLineWidth(0.8);
  doc.line(10, y, 10, y + 6);

  const componentes: SubcomponenteSelecionado[] = (os.itens_componentes_json || []) as SubcomponenteSelecionado[];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`3. COMPONENTES & SERVIÇOS A MANUTENIR (${componentes.length} ITENS)`, 13, y + 4.2);

  y += 7;

  // Cabeçalho da Tabela
  doc.setFillColor(30, 41, 59);
  doc.rect(10, y, w - 20, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('MACRO-SISTEMA', 12, y + 3.8);
  doc.text('SUBCOMPONENTE', 55, y + 3.8);
  doc.text('AÇÃO REQUERIDA', 110, y + 3.8);
  doc.text('POSIÇÃO', 140, y + 3.8);
  doc.text('QTD', 165, y + 3.8);
  doc.text('VALOR EST.', 180, y + 3.8);

  y += 5.5;

  // Linhas da Tabela
  if (componentes.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(10, y, w - 20, 6, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.text('Nenhum subcomponente anatômico flegado especificamente. Verifique o relato descritivo abaixo.', 12, y + 4);
    y += 6;
  } else {
    componentes.slice(0, 12).forEach((c, idx) => {
      const rowBg = idx % 2 === 0 ? 255 : 248;
      doc.setFillColor(rowBg, rowBg, rowBg);
      doc.rect(10, y, w - 20, 5.5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);
      doc.text((c.nome_componente_macro || 'Macro').slice(0, 24), 12, y + 3.8);

      doc.setFont('helvetica', 'bold');
      doc.text((c.nome_subcomponente || 'Subcomponente').slice(0, 32), 55, y + 3.8);

      doc.setTextColor(37, 99, 235);
      doc.text((c.acao || 'SUBSTITUICAO').slice(0, 18), 110, y + 3.8);

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text((c.posicao || 'PADRAO').slice(0, 14), 140, y + 3.8);
      doc.text(`${c.quantidade || 1}`, 165, y + 3.8);

      const subtotal = (c.quantidade || 1) * (c.valor_unitario_estimado || 0);
      const valTxt = subtotal > 0 ? subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'A orçar';
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(valTxt, 180, y + 3.8);

      y += 5.5;
    });

    if (componentes.length > 12) {
      doc.setFillColor(241, 245, 249);
      doc.rect(10, y, w - 20, 5, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6);
      doc.text(`... e mais ${componentes.length - 12} subcomponentes listados no sistema.`, 12, y + 3.5);
      y += 5;
    }
  }

  y += 3;

  // Relato da Falha / Sintomas
  const relato = os.descricao_motivo || os.descricao_servico || 'Não especificado na abertura.';
  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, y, w - 20, 14, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('RELATO DO PROBLEMA / SINTOMAS REGISTRADOS:', 13, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  const splitRelato = doc.splitTextToSize(relato, w - 26);
  doc.text(splitRelato.slice(0, 2), 13, y + 8.5);

  y += 17;

  // Resumo Financeiro
  const fBoxW = (w - 20 - 9) / 4;
  const custoPecas = Number(os.custo_pecas || 0);
  const custoMaoObra = Number(os.custo_mao_de_obra || 0);
  const custoPneus = Number(os.custo_pneus || 0);
  const custoTotal = Number(os.custo_total || os.valor_estimado || (custoPecas + custoMaoObra + custoPneus));

  const fBoxes = [
    { lbl: 'PEÇAS', val: custoPecas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
    { lbl: 'MÃO DE OBRA', val: custoMaoObra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
    { lbl: 'PNEUS', val: custoPneus.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
    { lbl: 'TOTAL ESTIMADO', val: custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), highlight: true }
  ];

  fBoxes.forEach((b, i) => {
    const bx = 10 + (fBoxW + 3) * i;
    doc.setFillColor(b.highlight ? 240 : 248, b.highlight ? 253 : 250, b.highlight ? 244 : 252);
    doc.setDrawColor(b.highlight ? 21 : 203, b.highlight ? 128 : 213, b.highlight ? 61 : 225);
    doc.roundedRect(bx, y, fBoxW, 11, 1.5, 1.5, 'FD');

    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(b.lbl, bx + fBoxW / 2, y + 3.8, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(b.highlight ? 21 : 15, b.highlight ? 128 : 23, b.highlight ? 61 : 42);
    doc.text(b.val, bx + fBoxW / 2, y + 8.5, { align: 'center' });
  });

  y += 15;

  // Assinaturas Formais
  const sBoxW = (w - 20 - 10) / 3;
  const signs = [
    { title: emitenteNome, sub: emitenteCargo, role: 'Emitente / Inspetor Solicitante' },
    { title: oficina?.responsavel || oficina?.contato_responsavel || 'Responsável Técnico', sub: ofcNome.slice(0, 24), role: 'Oficina Credenciada (Vistoria)' },
    { title: aprovadorNome, sub: aprovadorCargo, role: 'Aprovador / Gestor de Frota SPCI' }
  ];

  signs.forEach((s, i) => {
    const sx = 10 + (sBoxW + 5) * i;
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.3);
    doc.line(sx, y + 8, sx + sBoxW, y + 8);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(s.title.slice(0, 28), sx + sBoxW / 2, y + 11.5, { align: 'center' });

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(s.sub.slice(0, 32), sx + sBoxW / 2, y + 14.5, { align: 'center' });
    doc.text(s.role, sx + sBoxW / 2, y + 17.5, { align: 'center' });
  });

  // Footer Corporativo
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text('SIGER Master • Sistema de Gestão Contra Incêndio & Frotas • Complexo Carajás', 10, 290);
  doc.text(`Autenticação: ${os.id ? `UUID-${os.id.slice(0, 8)}` : 'SISTEMA-INTEGRADO'}`, w / 2, 290, { align: 'center' });
  doc.text('Página 1 de 1', w - 12, 290, { align: 'right' });

  const blob = doc.output('blob');
  const filename = `Romaneio_OS_${proto.shortCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  const file = new File([blob], filename, { type: 'application/pdf' });

  return { blob, file, filename };
}

/**
 * Dispara o download direto do PDF do Romaneio na máquina do usuário
 */
export async function downloadRomaneioPDF(options: GenerateRomaneioPDFOptions): Promise<string> {
  const { blob, filename } = await generateRomaneioPDFBlob(options);
  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  return filename;
}

/**
 * Compartilhamento Híbrido via WhatsApp (Opções 1 + 2):
 * - Mobile: Anexa o arquivo PDF fisicamente na conversa via Web Share API (navigator.share)
 * - Desktop: Baixa o PDF no computador e abre o WhatsApp com a mensagem estruturada + link online
 */
export async function shareRomaneioWhatsAppHybrid(
  options: GenerateRomaneioPDFOptions & {
    recipientPhone?: string;
    customMessage?: string;
    baseUrl?: string;
  }
): Promise<{
  sharedVia: 'native_share' | 'download_and_whatsapp';
  filename: string;
  whatsAppUrl: string;
}> {
  const {
    os,
    viatura,
    oficina,
    recipientPhone,
    customMessage,
    baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://spci-master.vercel.app'
  } = options;

  const proto = formatFriendlyRomaneioProtocol(
    os.id || os.numero_os,
    os.data_abertura || os.created_at,
    viatura?.prefixo_frota
  );

  const { blob, file, filename } = await generateRomaneioPDFBlob(options);

  const prioridadeEmoji = os.prioridade === 'EMERGENCIA' ? '🔴' : os.prioridade === 'URGENTE' ? '🟡' : '🟢';
  const viaturaLabel = viatura ? `${viatura.prefixo_frota || ''} • Placa ${viatura.placa || ''}` : 'Viatura Operacional';
  const oficinaNome = oficina?.nome_fantasia || oficina?.razao_social || (os.tipo_os === 'INTERNA' ? 'Oficina Interna Base SIGER' : 'Oficina Homologada');
  const valorTotal = Number(os.custo_total || os.valor_estimado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const linkRomaneio = `${baseUrl}/frota/os?id=${os.id || os.numero_os}&view=romaneio`;
  const linkAprovacao = `${baseUrl}/frota/os?id=${os.id || os.numero_os}&action=approve`;

  const baseText = customMessage || `🚨 *ORDEM DE SERVIÇO & ROMANEIO - SIGER MASTER*
📋 *Protocolo:* ${proto.shortCode}
🚒 *Viatura:* ${viaturaLabel}
${prioridadeEmoji} *Criticidade:* ${os.prioridade || 'NORMAL'}
🏢 *Oficina:* ${oficinaNome}
💰 *Orçamento Estimado:* ${valorTotal}

📄 *Visualizar Romaneio Online:*
👉 ${linkRomaneio}

✅ *Aprovar ou Gerenciar O.S.:*
👉 ${linkAprovacao}`;

  // 1. Tenta compartilhamento nativo com o arquivo PDF (Mobile Android / iOS)
  const canShareFiles = typeof navigator !== 'undefined' && 
    typeof navigator.canShare === 'function' && 
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: `Romaneio de O.S. - ${proto.shortCode}`,
        text: baseText
      });
      return { sharedVia: 'native_share', filename, whatsAppUrl: '' };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { sharedVia: 'native_share', filename, whatsAppUrl: '' };
      }
      console.warn('[shareRomaneioWhatsAppHybrid] Fallback para download + WhatsApp:', err);
    }
  }

  // 2. Fallback para Desktop (PC):
  // Faz o download automático do PDF para a máquina do usuário
  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // Abre a conversa no WhatsApp com o link e a nota instruindo a arrastar o PDF anexado
  const textWithNote = `${baseText}

📎 *ARQUIVO EM ANEXO:* O PDF oficial *${filename}* foi baixado no seu dispositivo. Arraste-o para esta conversa para anexar o documento formal.`;

  const cleanPhone = recipientPhone ? recipientPhone.replace(/\D/g, '') : '';
  const waUrl = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textWithNote)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(textWithNote)}`;

  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank');
  }

  return { sharedVia: 'download_and_whatsapp', filename, whatsAppUrl: waUrl };
}

