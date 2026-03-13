import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [theme, setTheme] = useState('light');
  const [sensorInput, setSensorInput] = useState({
    placa: 'ABC1234',
    peso_medido_kg: 22000,
    eixos_lidos: 6
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = theme === 'dark' ? '#121212' : '#f4f6f8';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleInputChange = (e) => {
    setSensorInput({ ...sensorInput, [e.target.name]: e.target.value });
  };

  const simularPassagem = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/analisar_veiculo', {
        placa: sensorInput.placa.toUpperCase(),
        peso_medido_kg: parseFloat(sensorInput.peso_medido_kg),
        eixos_lidos: parseInt(sensorInput.eixos_lidos)
      });
      setResultado(response.data);
    } catch (error) {
      setResultado({ status: "ERRO", mensagem: "Falha de conexão com a base de dados SEFAZ/PF." });
    }
    setLoading(false);
  };

  return (
    <div className="app-wrapper" data-theme={theme}>
      <div className="dashboard-container">

        <header className="dashboard-header">
          <div className="header-title">
            <h1>Sistema de Detecção e Monitoramento de Cargas</h1>
            <p>Módulo de Fiscalização WIM | Projeto Integrador</p>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title="Alternar Tema">
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>
        </header>

        <main className="dashboard-content">

          <section className="card">
            <h2 className="section-title">Parâmetros de Telemetria</h2>

            <div className="input-grid">
              <div className="input-field">
                <label>Placa do Veículo (OCR)</label>
                <input name="placa" value={sensorInput.placa} onChange={handleInputChange} maxLength="7" />
              </div>
              <div className="input-field">
                <label>Peso Aferido (WIM - kg)</label>
                <input name="peso_medido_kg" type="number" value={sensorInput.peso_medido_kg} onChange={handleInputChange} />
              </div>
              <div className="input-field">
                <label>Contagem de Eixos</label>
                <input name="eixos_lidos" type="number" value={sensorInput.eixos_lidos} onChange={handleInputChange} />
              </div>
            </div>

            <button className="btn-primary" onClick={simularPassagem} disabled={loading}>
              {loading ? "Processando..." : "Executar Validação de Conformidade"}
            </button>
          </section>

          {resultado && resultado.status !== "ERRO" && (
            <section className={`card result-panel ${resultado.alertas.fiscal_sefaz ? 'alert-danger' : 'alert-success'}`}>
              <h2 className="section-title">Relatório de Conformidade: {resultado.placa}</h2>

              <h3 style={{ fontSize: '15px', color: 'var(--primary-color)', marginBottom: '12px' }}>Dados do Veículo (Base SENATRAN/PF)</h3>
              <div className="data-grid" style={{ marginBottom: '24px' }}>
                <div className="data-item">
                  <span className="data-label">Fabricante / Modelo</span>
                  <span className="data-value" style={{ fontSize: '16px' }}>{resultado.fabricante} {resultado.modelo}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Ano</span>
                  <span className="data-value" style={{ fontSize: '16px' }}>{resultado.ano}</span>
                </div>
              </div>

              <h3 style={{ fontSize: '15px', color: 'var(--primary-color)', marginBottom: '12px' }}>Dados da Carga (MDF-e / NF-e)</h3>
              <div className="data-grid" style={{ marginBottom: '24px' }}>
                <div className="data-item">
                  <span className="data-label">Chave NF-e</span>
                  <span className="data-value" style={{ fontSize: '12px', wordBreak: 'break-all' }}>{resultado.nfe_numero}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Valor Declarado</span>
                  <span className="data-value" style={{ fontSize: '16px' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultado.valor_carga)}
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Rota</span>
                  <span className="data-value" style={{ fontSize: '16px' }}>{resultado.origem} ➔ {resultado.destino}</span>
                </div>
              </div>

              <h3 style={{ fontSize: '15px', color: 'var(--primary-color)', marginBottom: '12px' }}>Análise de Peso (WIM)</h3>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Natureza da Carga</span>
                  <span className="data-value">{resultado.carga}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Peso Declarado (NF-e)</span>
                  <span className="data-value">{resultado.peso_declarado.toLocaleString('pt-BR')} kg</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Peso Aferido</span>
                  <span className="data-value">{resultado.peso_medido.toLocaleString('pt-BR')} kg</span>
                </div>
                <div className={`data-item ${resultado.diferenca > 1000 ? 'text-red' : 'text-green'}`}>
                  <span className="data-label">Divergência de Massa</span>
                  <span className="data-value">+{resultado.diferenca.toLocaleString('pt-BR')} kg</span>
                </div>
              </div>

              <h2 className="section-title" style={{ marginTop: '24px' }}>Integração com Órgãos Fiscalizadores</h2>
              <div className="status-list">
                <div className="status-row">
                  <strong>SEFAZ (Conformidade Fiscal)</strong>
                  {resultado.alertas.fiscal_sefaz ? <span className="badge badge-red">Indício de Sonegação</span> : <span className="badge badge-green">Regular</span>}
                </div>
                <div className="status-row">
                  <strong>DAER (Infraestrutura Viária)</strong>
                  {resultado.alertas.transito_daer ? <span className="badge badge-red">Excesso de Carga</span> : <span className="badge badge-green">Regular</span>}
                </div>
                <div className="status-row">
                  <strong>Status Operacional (CNPJ)</strong>
                  {resultado.alertas.bloqueio_cnpj ? <span className="badge badge-red">Bloqueio Solicitado</span> : <span className="badge badge-green">Liberado</span>}
                </div>
              </div>
            </section>
          )}

          {resultado && resultado.status === "ERRO" && (
            <div className="error-panel">
              {resultado.mensagem}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;