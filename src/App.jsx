import React, { useState, useEffect } from 'react';
import './App.scss';

const vendedoresPorGrupo = {
  'TELEVENDAS HOST': ['Renan', 'Cleydiano', 'Osvaldo', 'Mayara'],
  'WPP VENDAS P.D': ['Maria', 'Valéria', 'Andressa'],
  'WPP VENDAS HOST': ['Victor', 'Hudson']
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

function parseNumber(value) {
  if (!value) return 0;
  let s = String(value).trim();
  s = s.replace(/[^0-9.,-]/g, '');
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export default function App() {
  const allNames = Object.values(vendedoresPorGrupo).flat();
  const initialState = allNames.reduce(
    (acc, name) => ({ ...acc, [name]: { dia: '', anual: '' } }),
    {}
  );

  const [valores, setValores] = useState(() => {
    try {
      const raw = localStorage.getItem('vendasDia');
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...initialState, ...parsed };
      }
    } catch (e) {}
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem('vendasDia', JSON.stringify(valores));
  }, [valores]);

  function handleChange(name, field, rawValue) {
    setValores(prev => ({ ...prev, [name]: { ...prev[name], [field]: rawValue } }));
  }

  function calcGroupTotal(nomes) {
    return nomes.reduce((sum, nome) => {
      const dia = parseNumber(valores[nome].dia);
      const anual = parseNumber(valores[nome].anual);
      return sum + dia + (anual ? anual / 12 : 0);
    }, 0);
  }

  const groupTotals = Object.fromEntries(
    Object.entries(vendedoresPorGrupo).map(([grupo, nomes]) => [grupo, calcGroupTotal(nomes)])
  );

  const totalGeral = Object.values(groupTotals).reduce((a, b) => a + b, 0);

  function handleReset() {
    setValores(initialState);
    localStorage.removeItem('vendasDia');
  }

  function exportCSV() {
    const header = ['Vendedor', 'Dia', 'Anual', 'Total Mensalizado'];
    const rows = allNames.map(name => {
      const dia = parseNumber(valores[name].dia);
      const anual = parseNumber(valores[name].anual);
      const mensalizado = dia + (anual ? anual / 12 : 0);
      return [name, dia.toFixed(2), anual.toFixed(2), mensalizado.toFixed(2)];
    });
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-container">
      <h1>Calculadora de Vendas — Dia / Anual</h1>

      <div className="groups">
        {Object.entries(vendedoresPorGrupo).map(([grupo, nomes]) => {
          const totalMensal = groupTotals[grupo];

          return (
            <section key={grupo} className="group">
              <h2>
                {grupo} <span className="subtitle">Vendas Anual</span>
              </h2>
              <div className="group-body">
                {nomes.map(nome => (
                  <div key={nome} className="input-row">
                    <span className="label-name">{nome}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Venda Mensal" // Alterado
                      value={valores[nome].dia}
                      onChange={e => handleChange(nome, 'dia', e.target.value)}
                      onBlur={e => {
                        const n = parseNumber(e.target.value);
                        setValores(prev => ({
                          ...prev,
                          [nome]: { ...prev[nome], dia: n ? n.toFixed(2).replace('.', ',') : '' }
                        }));
                      }}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Venda Anual"
                      value={valores[nome].anual}
                      onChange={e => handleChange(nome, 'anual', e.target.value)}
                      onBlur={e => {
                        const n = parseNumber(e.target.value);
                        setValores(prev => ({
                          ...prev,
                          [nome]: { ...prev[nome], anual: n ? n.toFixed(2).replace('.', ',') : '' }
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="group-total">
                Total {grupo}: <strong>{currencyFormatter.format(totalMensal)}</strong>
              </div>
            </section>
          );
        })}
      </div>

      <hr />

      <div className="footer">
        <div className="total-geral">
          Total Geral: <strong>{currencyFormatter.format(totalGeral)}</strong>
        </div>

        <div className="actions">
          <button type="button" onClick={handleReset}>Zerar</button>
          <button type="button" onClick={exportCSV}>Exportar CSV</button>
        </div>
      </div>
    </div>
  );
}
