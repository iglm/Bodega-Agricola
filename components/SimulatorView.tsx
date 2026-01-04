
import React, { useState, useMemo } from 'react';
import { 
  Calculator, Sprout, TrendingUp, Wallet, ArrowRight, 
  BarChart3, Info, AlertTriangle, Timer, Map,
  Minus, Plus, LayoutGrid, Ruler, Table, Download,
  TrendingDown, DollarSign, Activity, CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';

interface YearlyFlow {
    year: number;
    stage: string;
    yieldPerTree: number; // Kg Cereza
    totalProductionKg: number; // Kg Cereza Total
    loadsPerHa: number; // Cargas por Hectárea (Indicador clave)
    income: number;
    establishmentCost: number; // Solo año 0
    maintenanceCost: number; // Fijo por árbol/Ha
    harvestCost: number; // Variable por Kg recolectado
    totalExpenses: number;
    cashFlow: number;
    cumulativeCashFlow: number;
}

export const SimulatorView: React.FC = () => {
    // --- 1. INPUTS DE PROYECTO ---
    // Usamos string para permitir entrada decimal libre sin formateo agresivo
    const [projectArea, setProjectArea] = useState('1'); 
    const [plantingDensity, setPlantingDensity] = useState('7000'); 
    const [showAudit, setShowAudit] = useState(false);
    
    // --- 2. PARÁMETROS ECONÓMICOS ---
    const [costEstablishment, setCostEstablishment] = useState('4200'); 
    const [costMaintenance, setCostMaintenance] = useState('5500'); 
    const [costHarvestKg, setCostHarvestKg] = useState('950'); 
    const [priceCarga, setPriceCarga] = useState('2100000'); 

    // --- MOTOR DE CÁLCULO AGRONÓMICO ---
    const simulation = useMemo(() => {
        // Parseo seguro para el área (admite . o ,)
        const cleanAreaStr = projectArea.replace(',', '.');
        const ha = parseFloat(cleanAreaStr) || 0;
        
        const density = parseNumberInput(plantingDensity);
        const totalTrees = Math.round(ha * density);

        const estCostUnit = parseNumberInput(costEstablishment);
        const maintCostUnit = parseNumberInput(costMaintenance);
        const harvCostUnit = parseNumberInput(costHarvestKg);
        const pricePerCarga = parseNumberInput(priceCarga);
        
        const kgCherryPerCarga = 625;
        const pricePerKgCherry = pricePerCarga / kgCherryPerCarga;

        // --- LÓGICA DE DENSIDAD ---
        let yieldModifier = 1.0;
        let densityLabel = 'Óptima';
        let densityColor = 'text-emerald-500';
        let technicalMsg = '';

        if (density < 4500) {
            yieldModifier = 1.25; 
            densityLabel = 'Baja (Ineficiente)';
            densityColor = 'text-red-500';
            technicalMsg = 'Subutilización del terreno. Costos fijos por Ha muy altos.';
        } else if (density >= 4500 && density < 6500) {
            yieldModifier = 1.10;
            densityLabel = 'Media (Tradicional)';
            densityColor = 'text-amber-500';
            technicalMsg = 'Rendimiento aceptable, pero podría optimizarse.';
        } else if (density >= 6500 && density <= 10000) {
            yieldModifier = 0.95; 
            densityLabel = 'Alta (Tecnificada)';
            densityColor = 'text-emerald-500';
            technicalMsg = 'Máxima rentabilidad por Ha. Dilución óptima de costos.';
        } else {
            yieldModifier = 0.80; 
            densityLabel = 'Ultra Alta (Intensiva)';
            densityColor = 'text-blue-500';
            technicalMsg = 'Requiere manejo agronómico experto.';
        }

        const baseYieldCurve = [0, 0, 1.2, 3.8, 5.0, 4.2, 2.8]; 
        const stages = ['Siembra', 'Levante', 'Graneo', 'Producción I', 'Producción Pico', 'Estabilización', 'Descenso/Zoca'];

        let cumulative = 0;
        const flows: YearlyFlow[] = [];
        let maxExposure = 0;
        let paybackYear = -1;

        for (let year = 0; year < 7; year++) {
            const isEstablishment = year === 0;
            const yieldTree = baseYieldCurve[year] * yieldModifier;
            const totalProd = totalTrees * yieldTree;
            const loadsPerHa = ha > 0 ? (totalProd / kgCherryPerCarga) / ha : 0;

            const income = totalProd * pricePerKgCherry;

            let estCost = 0;
            let maintCost = 0;
            let harvCost = 0;

            if (isEstablishment) {
                estCost = totalTrees * estCostUnit;
            } else {
                const intensity = year === 1 ? 0.8 : 1.0;
                const efficiencyFactor = density > 6000 ? 0.9 : 1.0;
                maintCost = totalTrees * maintCostUnit * intensity * efficiencyFactor;
                harvCost = totalProd * harvCostUnit;
            }

            const totalExp = estCost + maintCost + harvCost;
            const flow = income - totalExp;
            cumulative += flow;

            if (cumulative < 0 && Math.abs(cumulative) > maxExposure) {
                maxExposure = Math.abs(cumulative);
            }
            if (paybackYear === -1 && cumulative >= 0) {
                paybackYear = year;
            }

            flows.push({
                year,
                stage: stages[year],
                yieldPerTree: yieldTree,
                totalProductionKg: totalProd,
                loadsPerHa,
                income,
                establishmentCost: estCost,
                maintenanceCost: maintCost,
                harvestCost: harvCost,
                totalExpenses: totalExp,
                cashFlow: flow,
                cumulativeCashFlow: cumulative
            });
        }

        const roi = maxExposure > 0 ? ((cumulative) / maxExposure) * 100 : 0;
        const profitPerHa = ha > 0 ? cumulative / ha : 0;

        return { 
            flows, totalInvestment: maxExposure, netProfit: cumulative, profitPerHa, paybackYear, roi, densityLabel, densityColor, totalTrees, technicalMsg, ha, density, estCostUnit 
        };
    }, [projectArea, plantingDensity, costEstablishment, costMaintenance, costHarvestKg, priceCarga]);

    return (
        <div className="space-y-6 pb-40 animate-fade-in">
            <div className="bg-slate-900 p-6 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Calculator className="w-64 h-64 text-emerald-500" /></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Sprout className="w-8 h-8 text-white" /></div>
                        <div>
                            <h2 className="text-white font-black text-xl md:text-2xl uppercase tracking-tighter">Proyección Financiera</h2>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Modelo Alta Densidad (Cenicafé)</p>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 p-6 rounded-[2.5rem] border border-slate-800 mb-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-1/2 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Map className="w-4 h-4" /> Tamaño del Proyecto (Hectáreas)
                                    </label>
                                    <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-2xl border border-slate-700">
                                        <input 
                                            type="number" 
                                            inputMode="decimal"
                                            value={projectArea} 
                                            onChange={e => setProjectArea(e.target.value)} 
                                            className="bg-transparent text-4xl font-black text-white text-center w-full outline-none font-mono"
                                            placeholder="0.0"
                                            step="0.1"
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                            <LayoutGrid className="w-4 h-4" /> Densidad de Siembra
                                        </label>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${simulation.densityColor} bg-slate-950 border border-slate-800`}>{simulation.densityLabel}</span>
                                    </div>
                                    <input type="range" min="2000" max="10000" step="100" value={plantingDensity} onChange={e => setPlantingDensity(e.target.value)} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-4" />
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <input type="text" value={formatNumberInput(plantingDensity)} onChange={e => setPlantingDensity(parseNumberInput(e.target.value).toString())} className="bg-transparent text-3xl font-black text-white w-32 outline-none font-mono" />
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">Árboles / Ha</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
                                <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Costo Establecimiento</label><div className="relative"><input type="text" value={formatNumberInput(costEstablishment)} onChange={e => setCostEstablishment(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-8 text-white font-mono font-bold text-sm outline-none focus:border-emerald-500" /><span className="absolute left-3 top-3 text-slate-500 text-xs">$</span></div><p className="text-[8px] text-slate-500">Por árbol (Año 0)</p></div>
                                <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Sostenimiento Anual</label><div className="relative"><input type="text" value={formatNumberInput(costMaintenance)} onChange={e => setCostMaintenance(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-8 text-white font-mono font-bold text-sm outline-none focus:border-blue-500" /><span className="absolute left-3 top-3 text-slate-500 text-xs">$</span></div><p className="text-[8px] text-slate-500">Por árbol (Insumos+Labor)</p></div>
                                <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Costo Recolección</label><div className="relative"><input type="text" value={formatNumberInput(costHarvestKg)} onChange={e => setCostHarvestKg(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-8 text-white font-mono font-bold text-sm outline-none focus:border-red-500" /><span className="absolute left-3 top-3 text-slate-500 text-xs">$</span></div><p className="text-[8px] text-slate-500">Por Kg Cereza</p></div>
                                <div className="space-y-1"><label className="text-[9px] font-bold text-slate-400 uppercase">Precio Venta</label><div className="relative"><input type="text" value={formatNumberInput(priceCarga)} onChange={e => setPriceCarga(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-8 text-white font-mono font-bold text-sm outline-none focus:border-amber-500" /><span className="absolute left-3 top-3 text-slate-500 text-xs">$</span></div><p className="text-[8px] text-slate-500">Carga 125kg Pergamino</p></div>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={() => setShowAudit(!showAudit)} className="flex items-center gap-2 text-[10px] text-indigo-400 hover:text-white font-bold uppercase tracking-widest bg-indigo-900/30 px-4 py-2 rounded-lg border border-indigo-500/30 transition-all">
                        <Activity className="w-4 h-4" /> {showAudit ? 'Ocultar Auditoría' : 'Ver Auditoría Matemática'}
                    </button>

                    {showAudit && (
                        <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-indigo-500/30 font-mono text-[10px] text-slate-300 space-y-2 animate-fade-in">
                            <p className="text-indigo-400 font-bold uppercase border-b border-indigo-500/30 pb-1 mb-2">Traza de Cálculo:</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p>Área: <span className="text-white">{simulation.ha} Ha</span></p>
                                    <p>Densidad: <span className="text-white">{simulation.density} Arb/Ha</span></p>
                                    <p className="text-emerald-400 font-bold">Total Árboles: {simulation.ha} * {simulation.density} = {formatNumberInput(simulation.totalTrees)}</p>
                                </div>
                                <div>
                                    <p>Costo Est. Unit: <span className="text-white">{formatCurrency(simulation.estCostUnit)}</span></p>
                                    <p className="text-red-400 font-bold">Inversión Inicial: {formatNumberInput(simulation.totalTrees)} * {formatCurrency(simulation.estCostUnit)} = {formatCurrency(simulation.flows[0].establishmentCost)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Wallet className="w-20 h-20 text-red-500" /></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión Máxima (Riesgo)</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">{formatCurrency(simulation.totalInvestment)}</p>
                    <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase">Capital de trabajo necesario</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="w-20 h-20 text-emerald-500" /></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilidad Neta (7 Años)</p>
                    <p className={`text-3xl font-black font-mono tracking-tighter ${simulation.netProfit > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(simulation.netProfit)}</p>
                    <p className="text-[9px] text-emerald-600 mt-2 font-black uppercase">
                        {formatCurrency(simulation.profitPerHa / 7)} / Ha / Año (Prom)
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Timer className="w-20 h-20 text-blue-500" /></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Retorno Inversión (Payback)</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">{simulation.paybackYear > 0 ? `Año ${simulation.paybackYear}` : ' > 7 Años'}</p>
                    <p className="text-[9px] text-blue-500 mt-2 font-black uppercase">ROI: {simulation.roi.toFixed(0)}%</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <h3 className="text-slate-800 dark:text-white font-black text-xs uppercase flex items-center gap-2 tracking-widest"><Table className="w-4 h-4 text-indigo-500" /> Flujo de Caja Detallado</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-[9px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4">Etapa</th>
                                <th className="p-4 text-center">Prod. Total<br/>(Kg Cereza)</th>
                                <th className="p-4 text-center">Cargas<br/>Por Ha</th>
                                <th className="p-4 text-right text-emerald-600">Ingresos (+)</th>
                                <th className="p-4 text-right text-red-500">Egresos (-)</th>
                                <th className="p-4 text-right">Flujo Neto</th>
                                <th className="p-4 text-right">Acumulado</th>
                            </tr>
                        </thead>
                        <tbody className="text-[10px] divide-y divide-slate-100 dark:divide-slate-800">
                            {simulation.flows.map((row) => (
                                <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white text-xs">Año {row.year}</div>
                                        <div className="text-[9px] uppercase text-slate-400 font-bold">{row.stage}</div>
                                    </td>
                                    <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-300">
                                        {formatNumberInput(Math.round(row.totalProductionKg))}
                                    </td>
                                    <td className="p-4 text-center font-mono font-bold text-indigo-500">
                                        {row.loadsPerHa.toFixed(1)}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-emerald-600">
                                        {formatCurrency(row.income)}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-red-500">
                                        {formatCurrency(row.totalExpenses)}
                                    </td>
                                    <td className={`p-4 text-right font-mono font-black ${row.cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {formatCurrency(row.cashFlow)}
                                    </td>
                                    <td className={`p-4 text-right font-mono font-black ${row.cumulativeCashFlow >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                                        {formatCurrency(row.cumulativeCashFlow)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
