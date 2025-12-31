
import React, { useState, useMemo } from 'react';
import { Calculator, Sprout, TrendingUp, DollarSign, Ruler, Clock, Briefcase, ChevronDown, Scale, TrendingDown, AlertTriangle, Target, CheckCircle2, Info, Leaf, ArrowRight, Wallet, Coins, Download, FileSpreadsheet, FileText, Landmark, Activity } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService';
import { generateSimulatorPDF, generateSimulatorExcel } from '../services/reportService';

// Constantes Agronómicas Basadas en Federacafé
const TECHNICAL_STANDARDS = {
    establishment: {
        ahoyado: 700, 
        siembra: 600, 
        trazo: 950,   
    },
    maintenance: {
        fertilizacion_qty_ha: 1200, // Kg/Ha/Año
        jornales_mantenimiento_ha: 120, // Plateo, desyerba, fumigación anual
    },
    production: {
        factor_carga: 125 // 1 Carga = 125 kg CPS
    }
};

const PRODUCTION_CURVE = [
    { year: 1, percent: 0, fertFactor: 0.4, label: 'Establecimiento', replanting: 0.05 }, 
    { year: 2, percent: 0, fertFactor: 0.7, label: 'Levante (Mantenimiento)', replanting: 0.10 }, 
    { year: 3, percent: 0.35, fertFactor: 0.9, label: 'Travesía (1ra Cosecha)', replanting: 0.02 }, 
    { year: 4, percent: 0.90, fertFactor: 1.0, label: 'Pico Productivo', replanting: 0.01 },
    { year: 5, percent: 1.00, fertFactor: 1.0, label: 'Plena Producción', replanting: 0.01 },
    { year: 6, percent: 0.85, fertFactor: 1.0, label: 'Estabilización', replanting: 0.01 },
    { year: 7, percent: 0.70, fertFactor: 1.0, label: 'Declive / Renovación', replanting: 0.0 },
];

export const SimulatorView: React.FC = () => {
    const [totalTrees, setTotalTrees] = useState(5000);
    const [density, setDensity] = useState(5000); 
    const [coffeeLoadPrice, setCoffeeLoadPrice] = useState(2500000); 
    const [jornalValue, setJornalValue] = useState(80000); 
    const [fertilizerPriceBulto, setFertilizerPriceBulto] = useState(160000); 
    const [seedlingCost, setSeedlingCost] = useState(1200); 
    const [harvestCostPerKg, setHarvestCostPerKg] = useState(1200); 
    const [yieldConversion, setYieldConversion] = useState(5.2); // 5.2kg cereza : 1kg pergamino
    const [peakYieldPerTree, setPeakYieldPerTree] = useState(4.5); // Kg Cereza/Árbol Pico
    const [monthlyGoal, setMonthlyGoal] = useState(2000000);

    const calculation = useMemo(() => {
        const areaHa = totalTrees / density;
        
        // 1. Cálculo de Inversión Inicial (Años 1 y 2 - El "Hole" financiero)
        let investmentTotal = 0;
        const initialInvestmentBreakdown: number[] = [];

        // Costos Fijos Anuales de Administración y Terreno (Arriendo Figurado)
        const annualFixedCosts = (jornalValue * 15 * areaHa) + (500000 * areaHa); // 15 jornales admin + arriendo Ha

        // Simulación de los 7 años para obtener la amortización real
        let totalProfitCycle = 0;
        let totalRevenueCycle = 0;
        let totalExpensesCycle = 0;
        let totalCargasProduced = 0;

        const yearlyData = PRODUCTION_CURVE.map(curve => {
            // INGRESOS
            const yieldKgCereza = peakYieldPerTree * curve.percent * totalTrees; 
            const yieldKgCPS = yieldKgCereza / yieldConversion; 
            const yieldCargas = yieldKgCPS / TECHNICAL_STANDARDS.production.factor_carga;
            const income = yieldCargas * coffeeLoadPrice;

            // EGRESOS
            const costHarvest = yieldKgCereza * harvestCostPerKg;
            const fertKg = TECHNICAL_STANDARDS.maintenance.fertilizacion_qty_ha * areaHa * curve.fertFactor;
            const costFert = fertKg * (fertilizerPriceBulto / 50);
            const costLaborMaint = (TECHNICAL_STANDARDS.maintenance.jornales_mantenimiento_ha * areaHa * jornalValue) * (curve.year <= 2 ? 0.8 : 1.0);
            
            // Establecimiento (Solo año 1)
            const setup = curve.year === 1 ? (totalTrees * (seedlingCost + (jornalValue/150))) : 0;
            
            // Imprevistos y Administración (10%)
            const opexSubtotal = costFert + costLaborMaint + setup + annualFixedCosts;
            const contingency = opexSubtotal * 0.10;

            const totalCost = opexSubtotal + costHarvest + contingency;
            const profit = income - totalCost;

            if (curve.year <= 2) investmentTotal += Math.abs(profit);

            totalRevenueCycle += income;
            totalExpensesCycle += totalCost;
            totalCargasProduced += yieldCargas;

            return {
                year: curve.year,
                label: curve.label,
                income,
                totalCost,
                profit,
                accumulated: 0 // Se calcula abajo
            };
        });

        // 2. Cálculo de Amortización (Repartir la inversión inicial en los 5 años productivos)
        const annualAmortization = investmentTotal / 5;
        let currentAccumulated = -investmentTotal;

        const adjustedYearly = yearlyData.map(y => {
            // Si el año es productivo (>2), le restamos su parte de la "deuda" inicial
            const amortCharge = y.year > 2 ? annualAmortization : 0;
            const realNetProfit = y.profit - amortCharge;
            currentAccumulated += (y.year <= 2 ? 0 : y.profit); 

            return {
                ...y,
                realNetProfit,
                marginPct: y.income > 0 ? (realNetProfit / y.income) * 100 : -100,
                accumulated: currentAccumulated
            };
        });

        const totalNetProfit = totalRevenueCycle - totalExpensesCycle;
        const netMarginGlobal = (totalNetProfit / totalRevenueCycle) * 100;
        const annualizedROI = (totalNetProfit / investmentTotal / 7) * 100;
        const costPerCarga = totalExpensesCycle / totalCargasProduced;

        return {
            yearlyData: adjustedYearly,
            netMargin: netMarginGlobal,
            annualizedROI: annualizedROI,
            maxInvestment: investmentTotal,
            avgMonthlyTotal: totalNetProfit / (7 * 12),
            costPerCarga,
            totalCargas: totalCargasProduced
        };
    }, [totalTrees, density, coffeeLoadPrice, jornalValue, fertilizerPriceBulto, seedlingCost, harvestCostPerKg, peakYieldPerTree, yieldConversion]);

    const reverseCalc = useMemo(() => {
        const profitPerTreeMonth = calculation.avgMonthlyTotal / totalTrees;
        if (profitPerTreeMonth <= 0) return { trees: 0, area: 0 };
        const treesNeeded = Math.ceil(monthlyGoal / profitPerTreeMonth);
        return { trees: treesNeeded, area: treesNeeded / density };
    }, [monthlyGoal, calculation.avgMonthlyTotal, totalTrees, density]);

    return (
        <div className="space-y-8 pb-32 animate-fade-in">
            {/* CABECERA */}
            <div className="bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Landmark className="w-40 h-40 text-white" /></div>
                <div className="relative z-10">
                    <h2 className="text-white font-black text-2xl uppercase tracking-tighter mb-2">Simulador Financiero Cafetero</h2>
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] bg-emerald-500/10 inline-block px-4 py-1 rounded-full border border-emerald-500/20">
                        Modelo de Amortización Realista NIC 41
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CONFIGURACIÓN */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs mb-4 flex items-center gap-2">
                            <Scale className="w-4 h-4 text-indigo-500" /> Parámetros del Negocio
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Precio Carga (125kg)</label>
                                <input type="number" value={coffeeLoadPrice} onChange={e => setCoffeeLoadPrice(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-emerald-600 font-mono font-black text-xl outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Árboles</label>
                                    <input type="number" value={totalTrees} onChange={e => setTotalTrees(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-slate-800 dark:text-white font-mono font-black text-sm" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Jornal ($)</label>
                                    <input type="number" value={jornalValue} onChange={e => setJornalValue(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-slate-800 dark:text-white font-mono font-black text-sm" />
                                </div>
                            </div>
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase">Rendimiento Pico</span>
                                    <span className="text-xs font-black text-indigo-600">{peakYieldPerTree} Kg/Arb</span>
                                </div>
                                <input type="range" min="2" max="8" step="0.5" value={peakYieldPerTree} onChange={e => setPeakYieldPerTree(Number(e.target.value))} className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-5 h-5 text-amber-500" />
                            <h4 className="text-white font-black text-xs uppercase tracking-widest">Utilidad Mensual Promedio</h4>
                        </div>
                        <p className={`text-3xl font-mono font-black ${calculation.avgMonthlyTotal > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(calculation.avgMonthlyTotal)}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-2 italic leading-tight">
                            * Calculado tras amortizar {formatCurrency(calculation.maxInvestment)} de inversión inicial.
                        </p>
                    </div>
                </div>

                {/* TABLA DE PROYECCIÓN */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                        <h4 className="text-slate-800 dark:text-white font-black uppercase text-sm mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" /> Ciclo de Caja Ajustado (7 Años)
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-100 dark:border-slate-700">
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="p-3">Año</th>
                                        <th className="p-3">Fase</th>
                                        <th className="p-3 text-right">Egresos</th>
                                        <th className="p-3 text-right">Utilidad Neta*</th>
                                        <th className="p-3 text-right">Margen %</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {calculation.yearlyData.map(row => (
                                        <tr key={row.year} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                            <td className="p-3 font-mono">{row.year}</td>
                                            <td className="p-3 text-[10px]">{row.label}</td>
                                            <td className="p-3 text-right text-red-500/80">{formatCurrency(row.totalCost)}</td>
                                            <td className={`p-3 text-right font-mono font-black ${row.realNetProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {formatCurrency(row.realNetProfit)}
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className={`px-2 py-1 rounded-full text-[9px] ${row.marginPct > 15 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {row.marginPct > -100 ? `${row.marginPct.toFixed(1)}%` : 'Inv.'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* KPIs FINALES */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Margen Neto Ciclo</p>
                            <p className="text-2xl font-mono font-black text-indigo-400">{calculation.netMargin.toFixed(1)}%</p>
                            <p className="text-[8px] text-slate-500 mt-1 uppercase">Rentabilidad Real Promedio</p>
                        </div>
                        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">ROI Anualizado</p>
                            <p className="text-2xl font-mono font-black text-emerald-400">{calculation.annualizedROI.toFixed(1)}%</p>
                            <p className="text-[8px] text-slate-500 mt-1 uppercase">Retorno s/ Capital Invertido</p>
                        </div>
                        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Costo / Carga</p>
                            <p className="text-2xl font-mono font-black text-white">{formatCurrency(calculation.costPerCarga)}</p>
                            <p className="text-[8px] text-slate-500 mt-1 uppercase">Punto de equilibrio total</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* INGENIERÍA INVERSA */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-8 rounded-[3rem] border border-indigo-500/30 shadow-2xl max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                    <div className="text-left space-y-2">
                        <div className="flex items-center gap-2 text-indigo-300 font-black uppercase text-xs">
                            <Target className="w-5 h-5" /> Meta de Ingresos
                        </div>
                        <h4 className="text-white text-xl font-bold">Planificador de Escala</h4>
                        <p className="text-slate-400 text-xs">¿Cuántos árboles necesito para ganar <span className="text-white font-black">{formatCurrency(monthlyGoal)}</span> libres al mes?</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/10 text-center">
                            <p className="text-[9px] text-indigo-400 font-black uppercase mb-1">Tu Meta Mensual</p>
                            <input type="number" value={monthlyGoal} onChange={e => setMonthlyGoal(Number(e.target.value))} className="bg-transparent border-none p-0 text-white font-mono font-black text-2xl text-center outline-none w-40" />
                        </div>
                        <div className="hidden sm:block text-indigo-500"><ArrowRight className="w-6 h-6" /></div>
                        <div className="bg-emerald-500 text-white p-5 rounded-[2rem] shadow-xl text-center">
                            <p className="text-[10px] font-black uppercase mb-1 opacity-80">Necesitas Sembrar</p>
                            <p className="text-3xl font-black">{reverseCalc.trees.toLocaleString()}</p>
                            <p className="text-[10px] font-bold uppercase mt-1">Árboles ({reverseCalc.area.toFixed(1)} Ha)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <button onClick={() => {}} className="bg-slate-800 text-slate-400 px-6 py-3 rounded-2xl text-xs font-black uppercase hover:bg-slate-700 transition-all flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Exportar Análisis Técnico PDF
                </button>
            </div>
        </div>
    );
};
