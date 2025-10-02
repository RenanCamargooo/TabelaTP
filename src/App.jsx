import React, { useState, useEffect } from 'react';
import 'App.scss';


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
<h1>Calculadora de Vendas — Dia</h1>


<div className="groups">
{Object.entries(vendedoresPorGrupo).map(([grupo, nomes]) => (
<section key={grupo} className="group">
<h2>{grupo}</h2>
<div className="group-body">
{nomes.map(nome => (
<label className="input-row" key={nome}>
<span className="label-name">{nome}</span>
<input
type="text"
inputMode="decimal"
placeholder="0,00"
value={valores[nome]}
onChange={e => handleChange(nome, e.target.value)}
onBlur={e => {
const n = parseNumber(e.target.value);
const formatted = n === 0 ? '' : n.toFixed(2).replace('.', ',');
setValores(prev => ({ ...prev, [nome]: formatted }));
}}
/>
</label>
))}
</div>


<div className="group-total">
Total {grupo}: <strong>{currencyFormatter.format(groupTotals[grupo])}</strong>
</div>
</section>
))}
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
