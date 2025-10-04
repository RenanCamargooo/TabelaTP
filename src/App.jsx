import React, { useState, useEffect } from 'react';
import './App.scss';

const defaultGrupos = {
  'TELEVENDAS HOST': ['Renan', 'Cleydiano', 'Osvaldo', 'Mayra'],
  'WPP VENDAS P.D': ['Maria', 'Valéria', 'Andressa', 'Leonardo'],
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
  const [vendedoresPorGrupo, setVendedoresPorGrupo] = useState(() => {
    const raw = localStorage.getItem('vendedoresPorGrupo');
    if (raw) return JSON.parse(raw);
    return { ...defaultGrupos };
  });

  const allNames = Object.values(vendedoresPorGrupo).flat();

  const [valores, setValores] = useState(() => {
    const raw = localStorage.getItem('vendasDia');
    const stored = raw ? JSON.parse(raw) : {};

    const merged = allNames.reduce((acc, name) => {
      acc[name] = stored[name] || { dia: '', anual: '', qtd: '', operador: name, anim: '' };
      return acc;
    }, {});

    return merged;
  });

  useEffect(() => {
    localStorage.setItem('vendasDia', JSON.stringify(valores));
    localStorage.setItem('vendedoresPorGrupo', JSON.stringify(vendedoresPorGrupo));
  }, [valores, vendedoresPorGrupo]);

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
    setVendedoresPorGrupo({ ...defaultGrupos });
    const initialValues = Object.values(defaultGrupos).flat().reduce((acc, name) => ({
      ...acc,
      [name]: { dia: '', anual: '', qtd: '', operador: name, anim: '' }
    }), {});
    setValores(initialValues);
    localStorage.removeItem('vendasDia');
    localStorage.removeItem('vendedoresPorGrupo');
  }

  function exportTXT() {
    const header = ['Operador', 'Dia', 'Anual', 'Qtd', 'Total Mensalizado'];
    const rows = allNames.map(name => {
      const dia = parseNumber(valores[name].dia);
      const anual = parseNumber(valores[name].anual);
      const qtd = parseNumber(valores[name].qtd);
      const mensalizado = dia + (anual ? anual / 12 : 0);
      return [
        valores[name].operador,
        dia.toFixed(2),
        anual.toFixed(2),
        qtd,
        mensalizado.toFixed(2)
      ];
    });

    const colWidths = header.map((_, i) =>
      Math.max(header[i].length, ...rows.map(row => String(row[i]).length))
    );

    const formatRow = row =>
      row.map((cell, i) => String(cell).padEnd(colWidths[i], ' ')).join(' | ');

    const totalGeralFormatted = totalGeral.toFixed(2);

    const txtContent = [
      formatRow(header),
      '-'.repeat(colWidths.reduce((a, b) => a + b + 3, -3)),
      ...rows.map(formatRow),
      '-'.repeat(colWidths.reduce((a, b) => a + b + 3, -3)),
      formatRow(['TOTAL GERAL', '', '', '', totalGeralFormatted])
    ].join('\n');

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Resultados baixados! Confira o TXT.');
  }

  const addOperator = grupo => {
    // Gera uma chave única para o estado, mas o input exibirá sempre "Operador"
    const uniqueKey = `operador_${Date.now()}`;

    setVendedoresPorGrupo(prev => {
      const updatedGrupo = { ...prev, [grupo]: [...prev[grupo], uniqueKey] };
      localStorage.setItem('vendedoresPorGrupo', JSON.stringify(updatedGrupo));
      return updatedGrupo;
    });

    setValores(prev => {
      const updatedValores = {
        ...prev,
        [uniqueKey]: { dia: '', anual: '', qtd: '', operador: 'Operador', anim: 'new' }
      };
      localStorage.setItem('vendasDia', JSON.stringify(updatedValores));
      return updatedValores;
    });

    setTimeout(() => {
      setValores(prev => ({
        ...prev,
        [uniqueKey]: { ...prev[uniqueKey], anim: '' }
      }));
    }, 350);
  };

  const removeOperator = grupo => {
    const nomes = vendedoresPorGrupo[grupo];
    if (nomes.length === 0) return;
    const nameToRemove = nomes[nomes.length - 1];

    setValores(prev => ({
      ...prev,
      [nameToRemove]: { ...prev[nameToRemove], anim: 'remove' }
    }));

    setTimeout(() => {
      setVendedoresPorGrupo(prev => {
        const updatedGrupo = { ...prev, [grupo]: prev[grupo].slice(0, -1) };
        localStorage.setItem('vendedoresPorGrupo', JSON.stringify(updatedGrupo));
        return updatedGrupo;
      });
      setValores(prev => {
        const copy = { ...prev };
        delete copy[nameToRemove];
        localStorage.setItem('vendasDia', JSON.stringify(copy));
        return copy;
      });
    }, 350);
  };

  return (
    <div className="app-container">
      <h1>Calculadora de Vendas — Dia / Anual</h1>

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
                  <div key={nome} className={`input-row ${valores[nome]?.anim || ''}`}>
                    <input
                      type="text"
                      placeholder="Operador"
                      value={valores[nome]?.operador || 'Operador'}
                      onChange={e => handleChange(nome, 'operador', e.target.value)}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Venda Mensal"
                      value={valores[nome]?.dia || ''}
                      onChange={e => handleChange(nome, 'dia', e.target.value)}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Venda Anual"
                      value={valores[nome]?.anual || ''}
                      onChange={e => handleChange(nome, 'anual', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Qtd"
                      className="qtd"
                      value={valores[nome]?.qtd || ''}
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
          <button type="button" onClick={exportTXT}>Baixar resultados</button>
        </div>
      </div>
    </div>
  );
}
