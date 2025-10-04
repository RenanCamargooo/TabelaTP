import React, { useState, useEffect } from 'react';
import './App.scss';

const defaultGrupos = {
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
  const [vendedoresPorGrupo, setVendedoresPorGrupo] = useState(defaultGrupos);

  const allNames = Object.values(vendedoresPorGrupo).flat();
  const initialState = allNames.reduce(
    (acc, name) => ({ ...acc, [name]: { dia: '', anual: '', qtd: '', operador: name } }),
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
    const header = ['Operador', 'Dia', 'Anual', 'Qtd Produtos', 'Total Mensalizado'];
    const rows = allNames.map(name => {
      const dia = parseNumber(valores[name].dia);
      const anual = parseNumber(valores[name].anual);
      const qtd = parseNumber(valores[name].qtd);
      const mensalizado = dia + (anual ? anual / 12 : 0);
      return [valores[name].operador, dia.toFixed(2), anual.toFixed(2), qtd, mensalizado.toFixed(2)];
    });
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Resultados baixados! Confira o CSV.');
  }

  const addOperator = grupo => {
    const newName = `Operador`;
    let count = 1;
    while (Object.keys(valores).includes(newName + (count > 1 ? ` ${count}` : ''))) count++;
    const finalName = newName + (count > 1 ? ` ${count}` : '');
    
    setVendedoresPorGrupo(prev => ({
      ...prev,
      [grupo]: [...prev[grupo], finalName]
    }));
    setValores(prev => ({ ...prev, [finalName]: { dia: '', anual: '', qtd: '', operador: 'Operador' } }));
  };

  const removeOperator = grupo => {
    const nomes = vendedoresPorGrupo[grupo];
    if (nomes.length === 0) return;
    const nameToRemove = nomes[nomes.length - 1];
    setVendedoresPorGrupo(prev => ({
      ...prev,
      [grupo]: prev[grupo].slice(0, -1)
    }));
    setValores(prev => {
      const copy = { ...prev };
      delete copy[nameToRemove];
      return copy;
    });
  };

  return (
    <div className="app-container">
      <h1>Calculadora de Vendas — Dia / Anual / Produtos</h1>

      <div className="groups">
        {Object.entries(vendedoresPorGrupo).map(([grupo, nomes]) => {
          const totalMensal = groupTotals[grupo];

          return (
            <section key={grupo} className="group">
              <h2>
                {grupo} <span className="subtitle">Vendas Anuais</span>
              </h2>

              <div className="group-body">
                {nomes.map(nome => (
                  <div key={nome} className="input-row">
                    <input
                      type="text"
                      placeholder="Operador"
                      value={valores[nome].operador}
                      onChange={e => handleChange(nome, 'operador', e.target.value)}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Venda Mensal"
                      value={valores[nome].dia}
                      onChange={e => handleChange(nome, 'dia', e.target.value)}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Venda Anual"
                      value={valores[nome].anual}
                      onChange={e => handleChange(nome, 'anual', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Qtd Produtos"
                      value={valores[nome].qtd}
                      onChange={e => handleChange(nome, 'qtd', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="group-actions">
                <button className="add-btn" onClick={() => addOperator(grupo)}>➕ Adicionar Operador</button>
                <button className="remove-btn" onClick={() => removeOperator(grupo)}>❌ Remover Operador</button>
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
          <button type="button" onClick={exportCSV}>Baixar resultados</button>
        </div>
      </div>
    </div>
  );
}
