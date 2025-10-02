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
  if (value === null || value === undefined) return 0;
  const s = String(value).trim();
  if (s === '') return 0;
  let normalized = s.replace(/\s/g, '').replace(/R\$/g, '');
  if (normalized.indexOf('.') > -1 && normalized.indexOf(',') > -1) {
    normalized = normalized.replace(/\./g, '');
    normalized = normalized.replace(/,/g, '.');
  } else {
    normalized = normalized.replace(/,/g, '.');
  }
  normalized = normalized.replace(/[^0-9.-]/g, '');
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

// 👉 a função App precisa ABRIR aqui
export default function App() {
  const allNames = Object.values(vendedoresPorGrupo).flat();
  const initialState = allNames.reduce((acc, name) => ({ ...acc, [name]: '' }), {});

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

  function handleChange(name, rawValue) {
    setValores(prev => ({ ...prev, [name]: rawValue }));
  }

  function calcGroupTotal(nomes) {
    return nomes.reduce((sum, nome) => sum + parseNumber(valores[nome]), 0);
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
    const header = ['Vendedor', 'Valor'];
    const rows = allNames.map(name => [name, parseNumber(valores[name]).toFixed(2)]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 👉 aqui sim pode usar o return
  return (
    <div className="app-container">
      <h1>Calculadora de Vendas — Dia</h1>

      {/* resto do JSX... */}
    </div>
  );
} // 👉 certifique-se que FECHA aqui
