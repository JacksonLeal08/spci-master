# Plano de Implementação: Prazos, Garantias, Mapa de Cotações e Ordens Recusadas

Este plano estrutura a evolução incremental da gestão de Ordens de Serviço (O.S.) no SIGER Master, cobrindo:
1. **Prazos & SLA:** Campo de Previsão de Conclusão dos Reparos e alertas visuais de atraso.
2. **Garantia de Serviços e Componentes Críticos:** Período de garantia em meses e quilometragem limite (com destaque para Motor, Câmbio, Freios e Bomba de Incêndio).
3. **Orçamento Complementar (Aditivo):** Registro de serviços adicionais durante a execução com preservação do orçamento original.
4. **Controle Separado de Ordens Recusadas / Não Autorizadas:** Aba dedicada e registro obrigatório do motivo da recusa.
5. **Mapa Comparativo de Cotações:** Registro de até 3 propostas de oficinas credenciadas para concorrência de preço, prazo e garantia.

---

## 📋 Etapas de Execução

### Fase 1: Modelagem e Tipagem
- [x] Migração SQL `20260926150000_os_prazos_garantias_cotacoes.sql` com colunas de prazos, garantias, recusa, cotações e aditivos.
- [x] Atualização de interfaces TypeScript em `lib/types/frota.ts` e `lib/types/vehicleAnatomy.ts`.
- [x] Atualização da Server Action `saveOrdemServicoAction` em `app/actions/frotaActions.ts` para persistir os novos campos.

### Fase 2: Interface de Edição de OS (`OrdemServicoModal.tsx`)
- [x] Adicionar campos de **Previsão de Conclusão / Entrega** (`previsao_conclusao`) e **Garantia** (`garantia_meses` e `garantia_km`).
- [x] Adicionar aba/card de **Mapa de Cotações (3 Oficinas)** comparando Preço, Prazo e Garantia com seleção da proposta vencedora.
- [x] Adicionar seção de **Orçamentos Complementares (Aditivos)** na aba de rateio.

### Fase 3: Detalhes, Workflow e Recusa (`OSDetailModal.tsx`)
- [x] Exibição de cards de **Prazo Prometido / SLA** e **Garantia Vigente**.
- [x] Ação de **Recusar / Não Autorizar OS** com modal para justificativa técnica.
- [x] Ação de **Lançar Aditivo / Orçamento Complementar**.

### Fase 4: Visão Geral e Filtros (`OrdensServicoView.tsx`)
- [x] Adicionar aba/filtro **"Não Autorizadas / Recusadas"** (`REJEITADA`).
- [x] Badge de alerta de **SLA Atrasado** se a data prevista expirou.
- [x] Badge de **Garantia Ativa** nos registros aplicáveis.

### Fase 5: Romaneio & Exportação (`osRomaneioReports.ts` e `OSRomaneioModal.tsx`)
- [x] Incluir no PDF e no modal do Romaneio o campo de **Previsão de Entrega Prometida** e o **Certificado/Termo de Garantia**.
- [x] No caso de OS Recusada, estampar a tarja de auditoria com o motivo e responsável pela recusa.

### Fase 6: Validação & Build
- [x] Verificação de integridade TypeScript (`npx tsc --noEmit`).
- [x] Teste de build do Next.js (`npm run build`).
- [x] Commit e push no GitHub seguindo o padrão oficial.
