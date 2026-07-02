import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import './App.css'; 

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Estados do Formulário
  const [placa, setPlaca] = useState('');
  const [pesoDinamico, setPesoDinamico] = useState('');
  const [eixos, setEixos] = useState('');
  const [velocidade, setVelocidade] = useState('');
  
  // Estados de Funcionalidades Principais
  const [resultados, setResultados] = useState([]);
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Estados dos Filtros do Histórico
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Controle das linhas expandidas do Histórico (detalhes da simulação)
  const [expandedRows, setExpandedRows] = useState({});
  const toggleRow = (key) => setExpandedRows(prev => ({ ...prev, [key]: !prev[key] }));

  // Sistema de Notificações (Toasts)
  const [toasts, setToasts] = useState([]);

  const [stats, setStats] = useState({ total_passagens: 0, distribuicao_acoes: {}, velocidade_media_kmh: 0, fluxo_horario: [], agrupamento: 'hora' });
  const [historicoData, setHistoricoData] = useState([]);

  // Filtro de periodo do Dashboard (diario / semanal / mensal)
  const [dashPeriodo, setDashPeriodo] = useState('mensal');

  const [regForm, setRegForm] = useState({ cnpj: '', placa: '', nfe: '', protocolo: '', justificativa: '' });
  const [regStatus, setRegStatus] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (activeTab === 'dashboard') carregarEstatisticas();
    if (activeTab === 'historico') carregarHistorico();
  }, [activeTab, resultados, simulating, dashPeriodo]);

  const carregarEstatisticas = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/estatisticas', {
        params: { periodo: dashPeriodo }
      });
      setStats(res.data);
    } catch (error) {
      console.error("Erro ao carregar estatisticas", error);
    }
  };

  const carregarHistorico = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/historico');
      setHistoricoData(res.data.registros);
    } catch (error) {
      console.error("Erro ao carregar historico", error);
    }
  };

  // Função Auxiliar: Adicionar Notificação Flutuante
  const triggerToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    
    // Remove o toast automaticamente após 4 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const realizarPesagem = async () => {
    setLoading(true);
    setErro(null);
    setAviso(null);
    
    try {
      const res = await axios.post('http://localhost:8000/api/analisar_hswim', {
        placa: placa,
        peso_dinamico_kg: parseFloat(pesoDinamico),
        velocidade_kmh: parseFloat(velocidade),
        eixos_lidos: parseInt(eixos)
      });
      
      if (res.data.status === "ERRO") {
        setErro(res.data.mensagem);
      } else if (res.data.status === "AVISO") {
        setAviso(res.data.mensagem);
      } else {
        setResultados(prev => [res.data, ...prev]);
        
        // Dispara o Toast se for uma infração
        const acaoUpper = res.data.acao.toUpperCase();
        if (acaoUpper.includes('AUTUA') || acaoUpper.includes('RETER')) {
          triggerToast(`Alerta de Fraude: Matricula ${res.data.placa} intercetada!`);
        }
      }
    } catch (error) {
      setErro("Falha de conexao com a API.");
    } finally {
      setLoading(false);
    }
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const gerarSimulacoesAutomaticas = async () => {
    setSimulating(true);
    setErro(null);
    setAviso(null);

    const isInfraction = [true, true, false, false, false, false, false, false, false, false].sort(() => Math.random() - 0.5);

    const gerarPlacaAleatoria = () => {
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const l1 = letras[Math.floor(Math.random()*26)];
      const l2 = letras[Math.floor(Math.random()*26)];
      const l3 = letras[Math.floor(Math.random()*26)];
      const n1 = Math.floor(Math.random()*10);
      const l4 = letras[Math.floor(Math.random()*26)];
      const n2 = Math.floor(Math.random()*10);
      const n3 = Math.floor(Math.random()*10);
      return `${l1}${l2}${l3}${n1}${l4}${n2}${n3}`;
    };

    for(let i = 0; i < 10; i++) {
      const placaSim = gerarPlacaAleatoria();
      let velocidadeSim = Math.floor(Math.random() * 15) + 70; 
      
      const perfisNormais = [
        { eixos: 2, peso: 14000 },
        { eixos: 3, peso: 21000 },
        { eixos: 6, peso: 49000 },
        { eixos: 9, peso: 69000 }
      ];
      
      let perfil = perfisNormais[Math.floor(Math.random() * perfisNormais.length)];
      let eixosSim = perfil.eixos;
      let pesoSim = perfil.peso;

      if (isInfraction[i]) {
          const tipoInfracao = Math.floor(Math.random() * 2);
          if (tipoInfracao === 0) {
             eixosSim = 6;
             pesoSim = 70000;
          } else {
             eixosSim = 2;
             pesoSim = 45000; 
          }
      }

      setPlaca(placaSim);
      setEixos(eixosSim);
      setVelocidade(velocidadeSim);
      setPesoDinamico(pesoSim);

      try {
        const res = await axios.post('http://localhost:8000/api/analisar_hswim', {
          placa: placaSim,
          peso_dinamico_kg: pesoSim,
          velocidade_kmh: velocidadeSim,
          eixos_lidos: eixosSim
        });
        
        if (res.data.status === "ERRO") {
          setErro(res.data.mensagem);
        } else if (res.data.status === "AVISO") {
          setAviso(res.data.mensagem);
        } else {
          setResultados(prev => [res.data, ...prev]);

          // Dispara o Toast Flutuante se a simulação atual for uma infração
          const acaoUpper = res.data.acao.toUpperCase();
          if (acaoUpper.includes('AUTUA') || acaoUpper.includes('RETER')) {
            triggerToast(`Alerta de Segurança: Matricula ${res.data.placa} com irregularidades.`);
          }
        }
      } catch (e) {
        console.error("Falha na simulacao automatica", e);
      }

      await delay(2500);
    }
    
    setSimulating(false);
  };

  const solicitarDesbloqueio = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/solicitar_desbloqueio', {
        cnpj: regForm.cnpj,
        placa: regForm.placa,
        nfe_numero: regForm.nfe,
        protocolo_detran: regForm.protocolo,
        justificativa: regForm.justificativa
      });
      setRegStatus(res.data);
      setRegForm({ cnpj: '', placa: '', nfe: '', protocolo: '', justificativa: '' });
    } catch (error) {
      setRegStatus({ status: "ERRO", mensagem: "Erro ao comunicar com o servidor." });
    }
  };

  const exportarRelatorioCSV = () => {
    if (historicoData.length === 0) return;

    let csvContent = "Data/Hora;Placa;Veiculo;Ano;Classe DNIT;Transportador;CNPJ;Carga;Rota;Rodovia (Trecho RS);Velocidade (km/h);Peso Estatico Calculado (kg);Status (Acao)\n";

    historicoData.forEach(row => {
      const veiculo = (row.fabricante || row.modelo) ? `${row.fabricante || ''} ${row.modelo || ''}`.trim() : 'N/D';
      const classe = row.classe_qfv ? `${row.classe_qfv}${row.descricao_classe ? ' (' + row.descricao_classe + ')' : ''}` : 'N/D';
      const rota = (row.origem || row.destino) ? `${row.origem || '?'} - ${row.destino || '?'}` : 'N/D';
      const linha = [
        row.timestamp,
        row.placa,
        veiculo,
        row.ano || 'N/D',
        classe,
        row.transportadora || 'N/D',
        row.empresa_cnpj || 'N/D',
        row.carga || 'N/D',
        rota,
        row.rodovia || 'N/D',
        row.velocidade_kmh || 0,
        row.peso_estatico_estimado_kg || 0,
        row.status
      ].join(";");
      csvContent += linha + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_Pesagens_ShieldWIM_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeClass = (acao) => {
    if (!acao) return '';
    const upperAcao = acao.toUpperCase();
    if (upperAcao.includes('LIBERADO')) return 'badge-success';
    if (upperAcao.includes('AUTUA') || upperAcao.includes('BLOQUEAR')) return 'badge-danger';
    if (upperAcao.includes('RETER')) return 'badge-warning';
    return 'badge-neutral';
  };

  const renderDashboard = () => {
    let infracoesCount = 0;
    Object.entries(stats.distribuicao_acoes).forEach(([name, count]) => {
        const n = name.toUpperCase();
        if (n.includes('AUTUA') || n.includes('BLOQUEAR') || n.includes('RETER')) {
            infracoesCount += count;
        }
    });

    const taxaConformidade = stats.total_passagens > 0 
      ? (((stats.total_passagens - infracoesCount) / stats.total_passagens) * 100).toFixed(1) 
      : 100;

    // AGRUPADOR INTELIGENTE DO GRÁFICO (Agora com PT-BR perfeito e acentuado)
    const dadosAgrupados = {
      'Trânsito Liberado': 0,
      'Autuação Fiscal/Pesagem': 0,
      'Retido para Aferição': 0
    };

    Object.entries(stats.distribuicao_acoes).forEach(([name, count]) => {
      const text = name.toUpperCase();
      if (text.includes('LIBERADO')) dadosAgrupados['Trânsito Liberado'] += count;
      else if (text.includes('AUTUA') || text.includes('BLOQUEAR')) dadosAgrupados['Autuação Fiscal/Pesagem'] += count;
      else if (text.includes('RETER')) dadosAgrupados['Retido para Aferição'] += count;
    });

    // MAPA DE CORES FIXAS (Com as chaves acentuadas)
    const colorMap = {
      'Trânsito Liberado': '#10b981',
      'Autuação Fiscal/Pesagem': '#ef4444',
      'Retido para Aferição': '#f59e0b'
    };

    const pieData = Object.entries(dadosAgrupados)
      .filter(([_, valor]) => valor > 0)
      .map(([name, value]) => ({ 
        name, 
        value, 
        fill: colorMap[name]
      }));

    const barData = stats.fluxo_horario && stats.fluxo_horario.length > 0 
      ? stats.fluxo_horario 
      : [{ hora: 'Sem Dados', passagens: 0 }];

    return (
      <div className="view-container animate-fade">
        <div className="view-header glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2>Dashboard Operacional</h2>
            <p>Visao analitica em tempo real da rede HS-WIM</p>
          </div>
          <div className="period-filter">
            {[
              { key: 'diario', label: 'Diário' },
              { key: 'semanal', label: 'Semanal' },
              { key: 'mensal', label: 'Mensal' }
            ].map(opt => (
              <button
                key={opt.key}
                className={`period-btn ${dashPeriodo === opt.key ? 'active' : ''}`}
                onClick={() => setDashPeriodo(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card glass-panel">
            <div className="kpi-data">
              <span className="kpi-label">Passagens Registadas</span>
              <h3>{stats.total_passagens}</h3>
            </div>
          </div>
          <div className="kpi-card glass-panel">
            <div className="kpi-data">
              <span className="kpi-label">Velocidade Media</span>
              <h3>{stats.velocidade_media_kmh} <small>km/h</small></h3>
            </div>
          </div>
          <div className="kpi-card glass-panel">
            <div className="kpi-data">
              <span className="kpi-label">Taxa de Conformidade</span>
              <h3 className={taxaConformidade < 90 ? 'text-danger' : 'text-success'}>{taxaConformidade}%</h3>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card glass-panel">
            <h3 className="chart-title">Distribuicao de Ocorrencias</h3>
            <div className="chart-wrapper">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} /> 
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">A aguardar dados operacionais...</div>
              )}
            </div>
          </div>

          <div className="chart-card glass-panel">
            <h3 className="chart-title">Fluxo Volumetrico (Passagens/{stats.agrupamento === 'dia' ? 'Dia' : 'Hora'})</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="hora" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="passagens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSimulador = () => (
    <div className="view-container animate-fade">
      <div className="view-header glass-panel">
        <h2>Portico Free-Flow</h2>
        <p>Monitorização de Borda (Edge Computing)</p>
      </div>

      <div className="form-card glass-panel">
        <div className="form-row">
          <div className="input-group">
            <label>Placa OCR</label>
            <input type="text" value={placa} onChange={e => setPlaca(e.target.value)} placeholder="XYZ9876" />
          </div>
          <div className="input-group">
            <label>Eixos (LiDAR)</label>
            <input type="number" value={eixos} onChange={e => setEixos(e.target.value)} placeholder="Ex: 6" />
          </div>
          <div className="input-group">
            <label>Velocidade (km/h)</label>
            <input type="number" value={velocidade} onChange={e => setVelocidade(e.target.value)} placeholder="80" />
          </div>
          <div className="input-group">
            <label>Impacto Dinamico (kg)</label>
            <input type="number" value={pesoDinamico} onChange={e => setPesoDinamico(e.target.value)} placeholder="45000" />
          </div>
        </div>
        <div className="form-row" style={{marginTop: '15px'}}>
          <div className="input-group btn-group" style={{justifyContent: 'flex-end', width: '100%', flexDirection: 'row', gap: '15px'}}>
            <button className="btn-primary" style={{backgroundColor: '#6366f1'}} onClick={gerarSimulacoesAutomaticas} disabled={simulating || loading}>
              {simulating ? 'A Gerar Lote...' : 'Auto-Simular 10 Veiculos'}
            </button>
            <button className="btn-primary" onClick={realizarPesagem} disabled={loading || simulating}>
              {loading ? 'A Processar...' : 'Executar Analise WIM'}
            </button>
          </div>
        </div>
      </div>

      {erro && <div className="alert alert-danger glass-panel">Erro Critico: {erro}</div>}
      {aviso && <div className="alert alert-warning glass-panel">Notificacao de Sistema: {aviso}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {resultados.map((res, index) => (
          <div key={index} className={`result-card glass-panel ${getBadgeClass(res.acao)} animate-fade`}>
            <div className="result-header">
              <h3>Diagnostico Algoritmico - {res.placa}</h3>
              <span className={`status-pill ${getBadgeClass(res.acao)}`}>{res.acao}</span>
            </div>

            <div className="result-grid">
              <div className="result-col">
                <h4>Base SENATRAN</h4>
                <ul>
                  <li><span>Veiculo:</span> {res.fabricante} {res.modelo} ({res.ano})</li>
                  <li><span>Transportador:</span> {res.transportadora}</li>
                  <li><span>CNPJ:</span> <span className="hash-text">{res.empresa_cnpj}</span></li>
                  <li><span>Classe DNIT:</span> {res.classe_qfv} ({res.descricao_classe})</li>
                  <li><span>PBT Legal:</span> {res.pbt_legal_kg.toLocaleString('pt-BR')} kg</li>
                  {res.alertas.divergencia_eixos && (
                    <li className="text-danger">
                      Alerta: Divergencia de Eixos! (Lido: {res.eixos_lidos} vs Ficha: {res.eixos_oficiais})
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="result-col">
                <h4>Base SEFAZ</h4>
                <ul>
                  <li><span>NF-e:</span> <span className="hash-text">{res.nfe_numero}</span></li>
                  <li><span>Carga Declarada:</span> {res.carga}</li>
                  <li><span>Rota:</span> {res.origem} - {res.destino}</li>
                  <li><span>Valor Declarado:</span> R$ {res.valor_carga.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</li>
                  <li><span>Peso na NF-e:</span> {res.peso_declarado_kg.toLocaleString('pt-BR')} kg</li>
                  {res.alertas.fiscal_sefaz && <li className="text-danger">Alerta: Sonegacao Fiscal (Subfaturamento)</li>}
                </ul>
              </div>

              <div className="result-col">
                <h4>Telemetria WIM</h4>
                <ul>
                  <li><span>Trecho Ativo:</span> <span style={{color: '#3b82f6'}}>{res.rodovia}</span></li>
                  <li><span>Velocidade Pista:</span> {res.hswim.velocidade_kmh} km/h</li>
                  <li><span>DIF (Fator Impacto):</span> +{(res.hswim.fator_impacto_dinamico_dif * 100).toFixed(1)}%</li>
                  <li className="highlight"><span>Massa Estatica Ponderada:</span> {res.hswim.peso_estatico_estimado_kg.toLocaleString('pt-BR')} kg</li>
                  <li><span>Retencao Cloud:</span> {res.alertas.fiscal_sefaz || res.alertas.transito_daer ? '11 Anos (BDE)' : '30 Dias (LGPD)'}</li>
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Formatação segura de números para o bloco de detalhes
  const fmtNum = (n) => (typeof n === 'number' ? n.toLocaleString('pt-BR') : 'N/D');

  // Bloco expansível com TODOS os dados da simulação (igual ao cartão do Free-Flow)
  const renderDetalhesRegistro = (reg) => {
    const temDetalhe = reg.fabricante || reg.classe_qfv || reg.nfe_numero;
    if (!temDetalhe) {
      return (
        <div className="detail-empty">
          Registo antigo sem dados detalhados de simulação.
        </div>
      );
    }
    const alertas = reg.alertas || {};
    return (
      <div className="result-grid detail-grid">
        <div className="result-col">
          <h4>Base SENATRAN</h4>
          <ul>
            <li><span>Veiculo:</span> {reg.fabricante} {reg.modelo} {reg.ano ? `(${reg.ano})` : ''}</li>
            <li><span>Transportador:</span> {reg.transportadora || 'N/D'}</li>
            <li><span>CNPJ:</span> <span className="hash-text">{reg.empresa_cnpj || 'N/D'}</span></li>
            <li><span>Classe DNIT:</span> {reg.classe_qfv || 'N/D'} {reg.descricao_classe ? `(${reg.descricao_classe})` : ''}</li>
            <li><span>PBT Legal:</span> {fmtNum(reg.pbt_legal_kg)} kg</li>
            {alertas.divergencia_eixos && (
              <li className="text-danger">
                Alerta: Divergencia de Eixos! (Lido: {reg.eixos_lidos} vs Ficha: {reg.eixos_oficiais})
              </li>
            )}
          </ul>
        </div>

        <div className="result-col">
          <h4>Base SEFAZ</h4>
          <ul>
            <li><span>NF-e:</span> <span className="hash-text">{reg.nfe_numero || 'N/D'}</span></li>
            <li><span>Carga Declarada:</span> {reg.carga || 'N/D'}</li>
            <li><span>Rota:</span> {reg.origem || '?'} - {reg.destino || '?'}</li>
            <li><span>Valor Declarado:</span> {typeof reg.valor_carga === 'number'
              ? `R$ ${reg.valor_carga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'N/D'}</li>
            <li><span>Peso na NF-e:</span> {fmtNum(reg.peso_declarado_kg)} kg</li>
            {alertas.fiscal_sefaz && <li className="text-danger">Alerta: Sonegacao Fiscal (Subfaturamento)</li>}
          </ul>
        </div>

        <div className="result-col">
          <h4>Telemetria WIM</h4>
          <ul>
            <li><span>Trecho Ativo:</span> <span style={{ color: '#3b82f6' }}>{reg.rodovia || 'N/D'}</span></li>
            <li><span>Velocidade Pista:</span> {reg.velocidade_kmh || 0} km/h</li>
            <li><span>DIF (Fator Impacto):</span> {typeof reg.dif === 'number' ? `+${(reg.dif * 100).toFixed(1)}%` : 'N/D'}</li>
            <li className="highlight"><span>Massa Estatica Ponderada:</span> {fmtNum(reg.peso_estatico_estimado_kg)} kg</li>
            <li><span>Limite por Eixo:</span> {fmtNum(reg.limite_por_eixo_kg)} kg</li>
            {alertas.sobrepeso_eixo && reg.eixos_em_sobrepeso && reg.eixos_em_sobrepeso.length > 0 && (
              <li className="text-danger">Sobrepeso nos eixos: {reg.eixos_em_sobrepeso.join(', ')}</li>
            )}
            <li><span>Retencao Cloud:</span> {(alertas.fiscal_sefaz || alertas.transito_daer) ? '11 Anos (BDE)' : '30 Dias (LGPD)'}</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderHistorico = () => {
    // Aplicação lógica dos Filtros
    const historicoFiltrado = historicoData.filter(reg => {
      // 1. Filtro por Pesquisa de Placa
      const matchesSearch = reg.placa.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Filtro por Categoria (Ação)
      let matchesFilter = true;
      if (filterType === 'LIBERADO') matchesFilter = reg.status.toUpperCase().includes('LIBERADO');
      if (filterType === 'AUTUACAO') matchesFilter = reg.status.toUpperCase().includes('AUTUA');
      if (filterType === 'RETER') matchesFilter = reg.status.toUpperCase().includes('RETER');
      
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="view-container animate-fade">
        <div className="view-header glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2>Historico de Pesagens (Auditoria)</h2>
            <p>Registo completo das passagens registadas pela rede WIM do Estado.</p>
          </div>
          <button className="btn-primary" onClick={exportarRelatorioCSV} style={{ backgroundColor: '#10b981' }}>
            Exportar Relatorio (CSV)
          </button>
        </div>

        {/* BARRA DE PESQUISA E FILTROS */}
        <div className="filter-bar glass-panel">
          <div className="input-group" style={{ flex: 2 }}>
            <label>Pesquisar Matricula</label>
            <input 
              type="text" 
              placeholder="Digite a placa (ex: XYZ9876)..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
            <label>Filtrar por Status</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="ALL">Todos os Registos</option>
              <option value="LIBERADO">Apenas Trânsito Liberado</option>
              <option value="AUTUACAO">Apenas Autuações (Multas)</option>
              <option value="RETER">Apenas Retidos em Balança</option>
            </select>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Data / Hora</th>
                  <th>Placa</th>
                  <th>Veiculo</th>
                  <th>Transportador</th>
                  <th>Carga / Rota</th>
                  <th>Trecho (Rodovia)</th>
                  <th>Velocidade</th>
                  <th>Massa Estatica</th>
                  <th>Status da Operacao</th>
                </tr>
              </thead>
              <tbody>
                {historicoFiltrado.length > 0 ? historicoFiltrado.map((reg, index) => {
                  const rowKey = `${reg.timestamp}-${reg.placa}-${index}`;
                  const isOpen = !!expandedRows[rowKey];
                  return (
                    <React.Fragment key={rowKey}>
                      <tr className={`historico-row ${isOpen ? 'row-open' : ''}`} onClick={() => toggleRow(rowKey)}>
                        <td>
                          <span className={`expand-icon ${isOpen ? 'open' : ''}`}>›</span>
                        </td>
                        <td>{reg.timestamp}</td>
                        <td><span className="hash-text">{reg.placa}</span></td>
                        <td>
                          {(reg.fabricante || reg.modelo) ? (
                            <div className="vehicle-cell">
                              <span className="vehicle-name">{reg.fabricante} {reg.modelo}{reg.ano ? ` (${reg.ano})` : ''}</span>
                              {reg.classe_qfv && (
                                <span className="vehicle-sub">{reg.classe_qfv} - {reg.descricao_classe || 'N/D'}</span>
                              )}
                            </div>
                          ) : <span style={{ color: 'var(--text-secondary)' }}>N/D</span>}
                        </td>
                        <td>
                          {reg.transportadora ? (
                            <div className="vehicle-cell">
                              <span className="vehicle-name">{reg.transportadora}</span>
                              {reg.empresa_cnpj && <span className="vehicle-sub hash-text">{reg.empresa_cnpj}</span>}
                            </div>
                          ) : <span style={{ color: 'var(--text-secondary)' }}>N/D</span>}
                        </td>
                        <td>
                          {reg.carga ? (
                            <div className="vehicle-cell">
                              <span className="vehicle-name">{reg.carga}</span>
                              {(reg.origem || reg.destino) && (
                                <span className="vehicle-sub">{reg.origem || '?'} - {reg.destino || '?'}</span>
                              )}
                            </div>
                          ) : <span style={{ color: 'var(--text-secondary)' }}>N/D</span>}
                        </td>
                        <td>{reg.rodovia || 'N/D'}</td>
                        <td>{reg.velocidade_kmh || 0} km/h</td>
                        <td>{reg.peso_estatico_estimado_kg ? reg.peso_estatico_estimado_kg.toLocaleString('pt-BR') : '0'} kg</td>
                        <td>
                          <span className={`badge ${getBadgeClass(reg.status)}`}>
                            {reg.status.split('-')[0].trim()}
                          </span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="detail-row">
                          <td colSpan="10">
                            {renderDetalhesRegistro(reg)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      Nenhum registo encontrado para os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderRegularizacao = () => (
    <div className="view-container animate-fade">
      <div className="view-header glass-panel">
        <h2>Modulo de Regularização</h2>
        <p>Portal Institucional - Auditoria e Desbloqueio SEFAZ</p>
      </div>

      <div className="reg-card glass-panel">
        <form onSubmit={solicitarDesbloqueio}>
          <div className="input-row">
            <div className="input-group">
              <label>CNPJ da Transportadora</label>
              <input type="text" required value={regForm.cnpj} onChange={e => setRegForm({...regForm, cnpj: e.target.value})} placeholder="00.000.000/0001-00" />
            </div>
            <div className="input-group">
              <label>Placa Bloqueada</label>
              <input type="text" required value={regForm.placa} onChange={e => setRegForm({...regForm, placa: e.target.value})} placeholder="XYZ9876" />
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label>Numero da NF-e Original</label>
              <input type="text" required value={regForm.nfe} onChange={e => setRegForm({...regForm, nfe: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Protocolo de Detencao</label>
              <input type="text" required value={regForm.protocolo} onChange={e => setRegForm({...regForm, protocolo: e.target.value})} />
            </div>
          </div>
          <div className="input-group full-width">
            <label>Justificativa Tecnica</label>
            <textarea rows="3" value={regForm.justificativa} onChange={e => setRegForm({...regForm, justificativa: e.target.value})}></textarea>
          </div>
          <button type="submit" className="btn-primary" style={{marginTop: '20px'}}>Submeter Pedido de Auditoria</button>
        </form>

        {regStatus && (
          <div className={`alert ${regStatus.status === 'ERRO' ? 'alert-danger' : 'alert-success'} mt-20 glass-panel`}>
            <strong>{regStatus.status === 'ERRO' ? 'Falha na Submissao: ' : 'Auditoria Registada: '}</strong> 
            {regStatus.mensagem}
            {regStatus.protocolo && <p className="mt-10">Codigo de Acompanhamento: <b className="hash-text">{regStatus.protocolo}</b></p>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <div className="glass-background"></div>
      
      {/* RENDERIZADOR DE TOASTS FLUTUANTES */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast">
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <aside className="sidebar glass-panel-heavy">
        <div className="sidebar-brand">
          <h2>Shield<span>WIM</span></h2>
          <small>Sistema Estadual de Escoamento</small>
        </div>
        
        <nav className="sidebar-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-text">Painel de Controle</span>
          </button>
          <button className={activeTab === 'simulador' ? 'active' : ''} onClick={() => setActiveTab('simulador')}>
            <span className="nav-text">Monitorização Free-Flow</span>
          </button>
          <button className={activeTab === 'historico' ? 'active' : ''} onClick={() => setActiveTab('historico')}>
            <span className="nav-text">Historico de Pesagens</span>
          </button>
          <button className={activeTab === 'regularizacao' ? 'active' : ''} onClick={() => setActiveTab('regularizacao')}>
            <span className="nav-text">Regularização Fiscal</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ textAlign: 'center', marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
            Powered by <strong>Smartway Analytics</strong>
          </div>
          <button className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? 'Alterar para Modo Claro' : 'Alterar para Modo Escuro'}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-scroll">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'simulador' && renderSimulador()}
          {activeTab === 'historico' && renderHistorico()}
          {activeTab === 'regularizacao' && renderRegularizacao()}
        </div>
      </main>
    </div>
  );
}

export default App;