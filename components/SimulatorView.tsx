
import React, { useState, useMemo } from 'react';
import { Calculator, Sprout, TrendingUp, Users, DollarSign, Ruler, Clock, Briefcase, ChevronDown, PieChart, Scale, TrendingDown, AlertTriangle, BarChart3, Handshake, Target, CheckCircle2, Scissors, ShieldCheck, Warehouse, BookOpen, Info, Leaf, ArrowRight, Wallet, Coins, RefreshCw, CalendarDays, Zap } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService';

// --- CONSTANTES AGRONÓMICAS (ZONA CENTRO - RÉGIMEN BIMODAL) ---
const PHENOLOGY_CYCLE = [
    { month: 'Ene-Feb', stage: 'Post-Cosecha / Floración', flow: 'out', intensity: 'high', label: 'Fase de Sostenimiento', desc: 'Pago deudas, Zoqueos, Manejo Broca.' },
    { month: 'Mar-Abr', stage: 'Llenado Grano (Mitaca)', flow: 'out', intensity: 'critical', label: 'Alta Demanda de Caja', desc: 'Compra Fertilizante 1 + Inicio Recolección.' },
    { month: 'May-Jun', stage: 'Cosecha Mitaca (30%)', flow: 'in', intensity: 'medium', label: 'Flujo Mitaca', desc: 'Recuperación de liquidez. Guardar caja.' },
    { month: 'Jul-Ago', stage: 'Formación Principal', flow: 'out', intensity: 'high', label: 'Inversión Pre-Cosecha', desc: 'Control Roya/Broca, Limpias, Prep. Beneficio.' },
    { month: 'Sep-Oct', stage: 'Inicio Cosecha Principal', flow: 'mixed', intensity: 'low', label: 'Punto de Inflexión', desc: 'Compra Fertilizante 2 + Inicio Flujo Ventas.' },
    { month: 'Nov-Dic', stage: 'Pico Cosecha (70%)', flow: 'in', intensity: 'high', label: 'Superávit', desc: 'Maximización ingresos y Utilidad Neta.' },
];

const TECHNICAL_STANDARDS = {
    establishment: {
        ahoyado: 700, 
        siembra: 600, 
        trazo: 950,   
        resiembra_pct: 0.05 
    },
    maintenance: {
        plateo: 900, 
        fertilizacion_labor: 1950, 
        fertilizacion_qty_ha: 1200, // Kg/Ha/Año (24 Bultos)
        desyerba_machete: 9, 
    },
    production: {
        // Factor de conversión: 5kg Cereza = 1kg Pergamino Seco (CPS)
        conversion_cereza_cps: 5, 
        factor_carga: 125 // 1 Carga = 125 kg CPS
    }
};

const PRODUCTION_CURVE = [
    { year: 1, percent: 0, fertFactor: 0.3, label: 'Levante (Inversión)' },
    { year: 2, percent: 0.25, fertFactor: 0.6, label: 'Graneo (1ra Prod)' },
    { year: 3, percent: 0.70, fertFactor: 0.9, label: 'Crecimiento' },
    { year: 4, percent: 1.00, fertFactor: 1.0, label: 'Pico Productivo' },
    { year: 5, percent: 0.85, fertFactor: 1.0, label: 'Estabilización' },
    { year: 6, percent: 0.65, fertFactor: 1.0, label: 'Declive' },
    { year: 7, percent: 0.45, fertFactor: 1.0, label: 'Renovación' },
];

export const SimulatorView: React.FC = () => {
    // --- INPUTS TÉCNICOS ---
    const [totalTrees, setTotalTrees] = useState(5000);
    const [density, setDensity] = useState(5000); 
    const [coffeeLoadPrice, setCoffeeLoadPrice] = useState(2600000); 
    
    // --- COSTOS UNITARIOS ---
    const [jornalValue, setJornalValue] = useState(80000); 
    const [fertilizerPriceBulto, setFertilizerPriceBulto] = useState(150000); 
    const [seedlingCost, setSeedlingCost] = useState(800); 
    const [harvestCostPerKg, setHarvestCostPerKg] = useState(1500); 

    // --- META FINANCIERA (HERRAMIENTA SECUNDARIA) ---
    const [monthlyGoal, setMonthlyGoal] = useState(2000000);
    const [peakYieldPerTree, setPeakYieldPerTree] = useState(5); // Kg Cereza/Árbol Año Pico

    // --- CÁLCULOS TÉCNICOS ---
    const calculation = useMemo(() => {
        // 1. Costos Unitarios Base (Por Árbol)
        const fertPricePerKg = fertilizerPriceBulto / 50;
        const kgFertPerTreeYear = TECHNICAL_STANDARDS.maintenance.fertilizacion_qty_ha / density; // ~0.24kg/árbol (1200kg/ha / 5000 arb/ha)
        const maxFertCostMaterial = kgFertPerTreeYear * fertPricePerKg;
        const maxFertCostLabor = (2 / TECHNICAL_STANDARDS.maintenance.fertilizacion_labor) * jornalValue; // 2 ciclos
        const totalFertCostAnnual = maxFertCostMaterial + maxFertCostLabor;

        const weedControlAnnual = (4 / TECHNICAL_STANDARDS.maintenance.plateo) * jornalValue; // 4 plateos
        const adminOverhead = weedControlAnnual * 0.15; // 15% imprevistos/admin

        // Costo Establecimiento (Año 1 - Inversión Inicial)
        const establishmentLabor = jornalValue * ((1/700) + (1/600) + (1/950)); // Ahoyado+Siembra+Trazo
        const establishmentMaterial = seedlingCost * 1.05; // +5% resiembra
        const establishmentTotal = establishmentLabor + establishmentMaterial + totalFertCostAnnual + weedControlAnnual;

        // Costo Mantenimiento Adulto (Sin Recolección)
        const maintenanceTotal = totalFertCostAnnual + weedControlAnnual + adminOverhead;

        // 2. Proyección 7 Años
        let globalAccumulated = 0;
        let globalInvestment = 0;
        let paybackYear = -1;

        const yearlyData = PRODUCTION_CURVE.map(curve => {
            // Producción
            const yieldKgCereza = peakYieldPerTree * curve.percent;
            const yieldKgCPS = yieldKgCereza / TECHNICAL_STANDARDS.production.conversion_cereza_cps; // 5:1
            const yieldCargas = yieldKgCPS / TECHNICAL_STANDARDS.production.factor_carga; // 125kg
            const income = yieldCargas * coffeeLoadPrice;

            // Costos
            let fixedCost = 0;
            if (curve.year === 1) {
                fixedCost = establishmentTotal;
            } else {
                fixedCost = maintenanceTotal * curve.fertFactor; // Ajuste por edad (árbol pequeño come menos)
            }

            const variableCost = yieldKgCereza * harvestCostPerKg; // Recolección
            const totalCost = fixedCost + variableCost;
            const profit = income - totalCost;

            globalAccumulated += profit;
            if (profit < 0) globalInvestment += Math.abs(profit); // Sum of negative flows (Inversión necesaria)
            if (paybackYear === -1 && globalAccumulated > 0) paybackYear = curve.year;

            return {
                year: curve.year,
                label: curve.label,
                yieldKg: yieldKgCereza,
                income,
                totalCost,
                profit,
                accumulated: globalAccumulated,
            };
        });

        // Promedios Estabilizados (Asumiendo Finca con Lotes en todas las edades)
        // Utilidad Neta Total del Ciclo / 7 Años / 12 Meses
        const avgProfitPerTree = globalAccumulated / 7;
        const avgMonthlyPerTree = avgProfitPerTree / 12;

        return {
            yearlyData,
            globalAccumulated: globalAccumulated * totalTrees,
            avgMonthlyTotal: avgMonthlyPerTree * totalTrees,
            paybackYear,
            maxInvestment: globalInvestment * totalTrees
        };
    }, [totalTrees, density, coffeeLoadPrice, jornalValue, fertilizerPriceBulto, seedlingCost, harvestCostPerKg, peakYieldPerTree]);

    // --- CÁLCULO INVERSO (META) ---
    const reverseCalc = useMemo(() => {
        const profitPerTreeMonth = calculation.avgMonthlyTotal / totalTrees;
        if (profitPerTreeMonth <= 0) return { trees: 0, area: 0 };
        const treesNeeded = Math.ceil(monthlyGoal / profitPerTreeMonth);
        return { trees: treesNeeded, area: treesNeeded / density };
    }, [monthlyGoal, calculation.avgMonthlyTotal, totalTrees, density]);

    return (
        <div className="space-y-8 pb-32 animate-fade-in">
            {/* HEADER */}
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 p-6 opacity-5"><Sprout className="w-32 h-32 text-white" /></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Calculator className="w-6 h-6 text-white" /></div>
                        <h2 className="text-white font-black text-xl uppercase tracking-tighter">Ingeniería Financiera Cafetera</h2>
                    </div>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em]">Modelo de Flujo de Caja Fenológico (Zona Centro)</p>
                </div>
            </div>

            {/* INPUTS PRINCIPALES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                        <h3 className="font-black text-slate-700 dark:text-white uppercase text-xs flex items-center gap-2 tracking-widest mb-4">
                            <Ruler className="w-4 h-4 text-emerald-500" /> Parámetros del Cultivo
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase">Cantidad Árboles</label>
                                <input type="number" value={totalTrees} onChange={e => setTotalTrees(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-slate-800 dark:text-white font-mono font-black text-lg" />
                            </div>
                            
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                                <label className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2 mb-1">
                                    <DollarSign className="w-3 h-3" /> Precio Carga (125 Kg)
                                </label>
                                <input type="number" value={coffeeLoadPrice} onChange={e => setCoffeeLoadPrice(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-emerald-600 dark:text-emerald-400 font-mono font-black text-2xl outline-none" />
                            </div>

                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer text-[9px] font-black text-slate-400 uppercase py-2 hover:text-slate-600 dark:hover:text-slate-200">
                                    <span>Costos Unitarios Detallados</span>
                                    <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform"/>
                                </summary>
                                <div className="grid grid-cols-2 gap-2 pt-2 animate-fade-in-down">
                                    <div><label className="text-[8px] font-bold text-slate-500">Jornal ($)</label><input type="number" value={jornalValue} onChange={e => setJornalValue(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-xs" /></div>
                                    <div><label className="text-[8px] font-bold text-slate-500">Bulto Fert ($)</label><input type="number" value={fertilizerPriceBulto} onChange={e => setFertilizerPriceBulto(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-xs" /></div>
                                    <div><label className="text-[8px] font-bold text-slate-500">Recolección/Kg</label><input type="number" value={harvestCostPerKg} onChange={e => setHarvestCostPerKg(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-xs" /></div>
                                    <div><label className="text-[8px] font-bold text-slate-500">Colino ($)</label><input type="number" value={seedlingCost} onChange={e => setSeedlingCost(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg p-2 text-xs" /></div>
                                </div>
                            </details>
                        </div>
                    </div>

                    {/* KPI CARD */}
                    <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl">
                        <h4 className="text-white font-black text-xs uppercase flex items-center gap-2 mb-2">
                            <Coins className="w-4 h-4 text-amber-500" /> Utilidad Mensual Promedio
                        </h4>
                        <p className="text-[10px] text-slate-400 mb-3 leading-tight">
                            Promedio "estabilizado" asumiendo renovación constante del 15% del área anual.
                        </p>
                        <p className="text-3xl font-mono font-black text-emerald-400">
                            {formatCurrency(calculation.avgMonthlyTotal)}
                        </p>
                    </div>
                </div>

                {/* TABLA DE DETALLE ANUAL (Refined) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-slate-800 dark:text-white font-black uppercase text-sm flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-indigo-500" /> Proyección de Flujo de Caja (7 Años)
                            </h4>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-3 py-1 rounded-full font-bold uppercase">Ciclo Completo</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                        <th className="p-3 text-center">Año</th>
                                        <th className="p-3">Etapa Fenológica</th>
                                        <th className="p-3 text-right text-emerald-500">Ingreso Global</th>
                                        <th className="p-3 text-right text-red-500">Egreso Global</th>
                                        <th className="p-3 text-right text-indigo-500">Utilidad Neta</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                    {calculation.yearlyData.map((row) => (
                                        <tr key={row.year} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="p-3 text-center">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] mx-auto">
                                                    {row.year}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="font-bold text-slate-800 dark:text-white block">{row.label}</span>
                                                <span className="text-[9px] text-slate-400">Prod: {(row.yieldKg).toFixed(1)} Kg/Arb</span>
                                            </td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.income * totalTrees)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.totalCost * totalTrees)}</td>
                                            <td className="p-3 text-right">
                                                <span className={`font-mono font-black px-2 py-1 rounded ${row.profit >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {formatCurrency(row.profit * totalTrees)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SEMÁFORO DE LIQUIDEZ MENSUAL (NUEVO) */}
                    <div className="bg-slate-950 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><CalendarDays className="w-32 h-32 text-white" /></div>
                        <div className="relative z-10">
                            <h4 className="text-white font-black uppercase text-xs flex items-center gap-2 mb-6 tracking-widest">
                                <Zap className="w-4 h-4 text-amber-500" /> Dinámica de Caja Mensual (Año Tipo)
                            </h4>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {PHENOLOGY_CYCLE.map((cycle, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border flex flex-col justify-between h-32 relative overflow-hidden group transition-all hover:scale-[1.02] ${
                                        cycle.intensity === 'critical' ? 'bg-red-900/40 border-red-500/50' : 
                                        cycle.intensity === 'high' && cycle.flow === 'out' ? 'bg-orange-900/20 border-orange-500/30' :
                                        cycle.intensity === 'high' && cycle.flow === 'in' ? 'bg-emerald-900/40 border-emerald-500/50' :
                                        'bg-slate-800/50 border-slate-700'
                                    }`}>
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-900/50 px-2 py-1 rounded">{cycle.month}</span>
                                            {cycle.flow === 'out' ? <ArrowRight className="w-4 h-4 text-red-400 -rotate-45" /> : <ArrowRight className="w-4 h-4 text-emerald-400 rotate-45" />}
                                        </div>
                                        
                                        <div>
                                            <p className="text-white font-black text-xs uppercase leading-tight mb-1">{cycle.label}</p>
                                            <p className="text-[9px] text-slate-400 leading-tight">{cycle.desc}</p>
                                        </div>

                                        {/* Intensity Bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900">
                                            <div className={`h-full ${
                                                cycle.intensity === 'critical' ? 'bg-red-500 w-full' : 
                                                cycle.intensity === 'high' ? 'bg-orange-500 w-3/4' : 
                                                'bg-blue-500 w-1/2'
                                            }`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 flex gap-3 p-3 bg-blue-900/20 rounded-xl border border-blue-500/20">
                                <Info className="w-5 h-5 text-blue-400 shrink-0" />
                                <p className="text-[10px] text-slate-300 leading-relaxed italic">
                                    <strong>Nota del Agrónomo:</strong> Aunque el año cierre en verde, los meses de <strong>Enero-Abril</strong> requieren un "colchón" de capital de trabajo (Mitaca) para no fallar en la fertilización crítica.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CALCULADORA INVERSA (AL FINAL COMO PEDIDO) */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 rounded-[2.5rem] border border-indigo-500/30 shadow-xl max-w-3xl mx-auto">
                    <h3 className="font-black text-white uppercase text-xs flex items-center justify-center gap-2 tracking-widest mb-6">
                        <Target className="w-4 h-4 text-emerald-400" /> Planificador de Metas (Ingeniería Inversa)
                    </h3>
                    
                    <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                        <div className="text-center w-full md:w-auto">
                            <label className="text-[9px] font-black text-indigo-200 uppercase block mb-2">Quiero una utilidad libre mensual de:</label>
                            <div className="relative max-w-[200px] mx-auto">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black">$</span>
                                <input 
                                    type="number" 
                                    value={monthlyGoal} 
                                    onChange={e => setMonthlyGoal(Number(e.target.value))} 
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-8 pr-4 text-white font-mono font-black text-lg outline-none text-center focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="hidden md:block text-white/20"><ArrowRight className="w-6 h-6" /></div>

                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 w-full md:w-auto justify-center">
                            <div className="text-center">
                                <p className="text-[9px] text-indigo-300 font-bold uppercase">Necesitas Sembrar</p>
                                <p className="text-2xl font-black text-white">{reverseCalc.trees.toLocaleString()} <span className="text-xs font-normal text-slate-300">Árboles</span></p>
                            </div>
                            <div className="w-px h-8 bg-white/20"></div>
                            <div className="text-center">
                                <p className="text-[9px] text-indigo-300 font-bold uppercase">Área Requerida</p>
                                <p className="text-2xl font-black text-white">{reverseCalc.area.toFixed(1)} <span className="text-xs font-normal text-slate-300">Ha</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
