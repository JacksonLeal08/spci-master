-- Migração: Prazos, Garantias, Mapa de Cotações e Ordens Recusadas
-- Complexo Carajás • SIGER Master Frotas & SPCI
-- Data: 2026-09-26

ALTER TABLE ordens_servico_frota 
  ADD COLUMN IF NOT EXISTS previsao_conclusao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS garantia_meses INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS garantia_km INTEGER,
  ADD COLUMN IF NOT EXISTS motivo_recusa TEXT,
  ADD COLUMN IF NOT EXISTS data_recusa TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responsavel_recusa TEXT,
  ADD COLUMN IF NOT EXISTS orcamentos_concorrentes_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS orcamentos_aditivos_json JSONB DEFAULT '[]'::jsonb;

-- Índices de performance para auditoria e filtros
CREATE INDEX IF NOT EXISTS idx_os_frota_previsao_conclusao ON ordens_servico_frota (previsao_conclusao);
CREATE INDEX IF NOT EXISTS idx_os_frota_data_recusa ON ordens_servico_frota (data_recusa);
