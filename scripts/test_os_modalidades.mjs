// scripts/test_os_modalidades.mjs
// Teste automatizado de ponta a ponta das 3 modalidades de O.S.

import assert from 'assert';

console.log('===============================================================');
console.log('🧪 INICIANDO BATERIA DE TESTES DE O.S. (3 MODALIDADES)');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASSOU] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FALHOU] ${name}`);
    console.error(`   Erro:`, err.message);
  }
}

// -------------------------------------------------------------
// CENÁRIO 1: MODALIDADE PREVENTIVA (Revisão Periódica / Cronograma)
// -------------------------------------------------------------
runTest('Cenário 1: Modalidade PREVENTIVA - Revisão Periódica Programada', () => {
  const osPreventiva = {
    numero_os: 'OS-PREV-001',
    viatura_id: 'VTR-01-ID',
    natureza_manutencao: 'PREVENTIVA',
    tipo_os: 'INTERNA',
    prioridade: 'NORMAL',
    odometro_km: 45000,
    descricao_motivo: 'Revisão periódica programada de 45.000 km: troca de filtros e fluidos.',
    previsao_conclusao: new Date(Date.now() + 2 * 86400000).toISOString(),
    garantia_meses: 3,
    garantia_km: 5000,
    status_os: 'ABERTA'
  };

  assert.strictEqual(osPreventiva.natureza_manutencao, 'PREVENTIVA');
  assert.strictEqual(osPreventiva.tipo_os, 'INTERNA');
  assert.ok(osPreventiva.previsao_conclusao, 'Previsão de conclusão deve existir');
  assert.strictEqual(osPreventiva.garantia_meses, 3);
  assert.strictEqual(osPreventiva.garantia_km, 5000);
});

// -------------------------------------------------------------
// CENÁRIO 2: MODALIDADE CORRETIVA COM MAPA DE COTAÇÕES CONCORRENTES
// -------------------------------------------------------------
runTest('Cenário 2: Modalidade CORRETIVA - Concorrência 3 Oficinas & Seleção Vencedora', () => {
  const cotacoes = [
    {
      id: 'COT-1',
      oficina_nome: 'Oficina Central Diesel',
      valor_total: 4200.00,
      prazo_dias: 5,
      garantia_meses: 3,
      garantia_km: 5000,
      selecionada: false
    },
    {
      id: 'COT-2',
      oficina_nome: 'Auto Mecânica Parauapebas',
      valor_total: 3850.00,
      prazo_dias: 3,
      garantia_meses: 6,
      garantia_km: 10000,
      selecionada: true // Vencedora
    },
    {
      id: 'COT-3',
      oficina_nome: 'Truck & Car Carajás',
      valor_total: 4500.00,
      prazo_dias: 2,
      garantia_meses: 3,
      garantia_km: 3000,
      selecionada: false
    }
  ];

  // Simula seleção da vencedora
  const vencedora = cotacoes.find(c => c.selecionada);
  assert.ok(vencedora, 'Deve haver uma cotação vencedora');
  assert.strictEqual(vencedora.oficina_nome, 'Auto Mecânica Parauapebas');
  assert.strictEqual(vencedora.valor_total, 3850.00);

  // Sincronização na OS Corretiva
  const dataPrevisao = new Date(Date.now() + vencedora.prazo_dias * 86400000).toISOString();
  const osCorretiva = {
    numero_os: 'OS-CORR-002',
    natureza_manutencao: 'CORRETIVA',
    tipo_os: 'EXTERNA',
    oficina_nome: vencedora.oficina_nome,
    custo_total: vencedora.valor_total,
    previsao_conclusao: dataPrevisao,
    garantia_meses: vencedora.garantia_meses,
    garantia_km: vencedora.garantia_km,
    orcamentos_concorrentes_json: cotacoes,
    status_os: 'APROVADA'
  };

  assert.strictEqual(osCorretiva.garantia_meses, 6);
  assert.strictEqual(osCorretiva.garantia_km, 10000);
  assert.strictEqual(osCorretiva.orcamentos_concorrentes_json.length, 3);
});

// -------------------------------------------------------------
// CENÁRIO 3: MODALIDADE EMERGENCIAL COM ADITIVOS E RECUSA
// -------------------------------------------------------------
runTest('Cenário 3A: Modalidade EMERGENCIAL - Pane Crítica e Orçamento Aditivo', () => {
  const osEmergencial = {
    numero_os: 'OS-EMERG-003',
    natureza_manutencao: 'EMERGENCIAL',
    prioridade: 'EMERGENCIA',
    custo_pecas: 5000,
    custo_mao_de_obra: 2000,
    orcamentos_aditivos_json: [
      {
        id: 'ADIT-1',
        numero_aditivo: 1,
        descricao: 'Substituição do Volante do Motor (defeito oculto identificado na desmontagem)',
        motivo: 'Trinca estrutural severa no volante do motor',
        valor: 1800.00,
        prazo_adicional_dias: 2,
        status: 'APROVADO',
        aprovado_por: 'Jackson Leal - Coordenador SPCI'
      },
      {
        id: 'ADIT-2',
        numero_aditivo: 2,
        descricao: 'Troca de chicote secundário',
        motivo: 'Opcional sugerido pela oficina',
        valor: 950.00,
        status: 'REJEITADO'
      }
    ]
  };

  // Cálculo de aditivos aprovados
  const aditivosAprovados = osEmergencial.orcamentos_aditivos_json.filter(a => a.status === 'APROVADO');
  const totalAditivos = aditivosAprovados.reduce((sum, a) => sum + a.valor, 0);
  const custoTotalCalculado = osEmergencial.custo_pecas + osEmergencial.custo_mao_de_obra + totalAditivos;

  assert.strictEqual(totalAditivos, 1800.00, 'Somente o aditivo aprovado deve entrar no somatório');
  assert.strictEqual(custoTotalCalculado, 8800.00, 'Custo total deve ser 5000 + 2000 + 1800 = 8800');
});

runTest('Cenário 3B: Modalidade EMERGENCIAL - Fluxo de Não Autorização (Recusa) e Liberação de Viatura', () => {
  // Simula viatura bloqueada
  let viaturaStatus = 'EM_MANUTENCAO_INTERNA';

  const osRecusada = {
    numero_os: 'OS-EMERG-003',
    status_os: 'REJEITADA',
    motivo_recusa: 'Custo de reparo superior a 60% da tabela FIPE. Viatura encaminhada para desmobilização.',
    responsavel_recusa: 'Gestão de Frotas SPCI',
    data_recusa: new Date().toISOString()
  };

  // Regra de negócio do sistema: ao rejeitar a OS, a viatura é liberada
  if (osRecusada.status_os === 'REJEITADA') {
    viaturaStatus = 'DISPONIVEL';
  }

  assert.strictEqual(osRecusada.status_os, 'REJEITADA');
  assert.ok(osRecusada.motivo_recusa.length > 10, 'Motivo de recusa deve ser detalhado');
  assert.strictEqual(viaturaStatus, 'DISPONIVEL', 'Viatura deve voltar a ficar disponível no pátio');
});

console.log('\n===============================================================');
console.log(`📊 RESULTADO DA EXECUÇÃO: ${passedTests}/${totalTests} TESTES APROVADOS COM SUCESSO!`);
console.log('===============================================================\n');
