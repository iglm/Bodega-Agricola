
import React, { useState, useMemo } from 'react';
import { Calculator, Sprout, TrendingUp, Users, DollarSign, Ruler, Clock, Briefcase, ChevronDown, PieChart, Scale, TrendingDown, AlertTriangle, BarChart3, Handshake, Target, CheckCircle2, Scissors, ShieldCheck, Warehouse, BookOpen, Info, Leaf, ArrowRight, Wallet, Coins, RefreshCw, CalendarDays, Zap, Download, FileSpreadsheet, FileText, Landmark, Activity, Table } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService';
import { generateSimulatorPDF, generateSimulatorExcel } from '../services/reportService';

// --- CONSTANTES AGRONÓMICAS REALISTAS ---
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
    },
    maintenance: {
        plateo: 900, 
        fertilizacion_labor: 1950, 
        fertilizacion_qty_ha: 1200, // Kg/Ha/Año (24 Bultos)
        desyerba_machete: 9, 
    },
    production: {
        factor_carga: 125 // 1 Carga = 125 kg CPS
    }
};

const PRODUCTION_CURVE = [
    { year: 1, percent: 0, fertFactor: 0.3, label: 'Siembra (Inversión)', replanting: 0.05 }, // 5% pérdida inicial
    { year: 2, percent: 0.15, fertFactor: 0.6, label: 'Levante (Gasto)', replanting: 0.12 }, // 12% resiembra crítica
    { year: 3, percent: 0.60, fertFactor: 0.9, label: 'Primera Producción', replanting: 0.03 }, // 3% mortalidad natural
    { year: 4, percent: 1.00, fertFactor: 1.0, label: 'Pico Productivo', replanting: 0.02 },
    { year: 5, percent: 0.85, fertFactor: 1.0, label: 'Estabilización', replanting: 0.02 },
    { year: 6, percent: 0.70, fertFactor: 1.0, label: 'Declive Productivo', replanting: 0.02 },
    { year: 7, percent: 0.50, fertFactor: 1.0, label: 'Prep. Renovación', replanting: 0.0 },
];

export const SimulatorView: React.FC = () => {
    // --- INPUTS TÉCNICOS ---
    const [totalTrees, setTotalTrees] = useState(5000);
    const [density, setDensity] = useState(5000); 
    const [coffeeLoadPrice, setCoffeeLoadPrice] = useState(2600000); 
    
    // --- COSTOS UNITARIOS ---
    const [jornalValue, setJornalValue] = useState(80000); 
    const [fertilizerPriceBulto, setFertilizerPriceBulto] = useState(150000); 
    const [seedlingCost, setSeedlingCost] = useState(1200); // Subido precio colino realista
    const [harvestCostPerKg, setHarvestCostPerKg] = useState(1200); 
    const [yieldConversion, setYieldConversion] = useState(5.0); // 5:1
    
    // --- COSTOS FIJOS Y OCULTOS ---
    const [adminOverheadPct, setAdminOverheadPct] = useState(15); // % de costos directos para administración/imprevistos

    // --- META FINANCIERA ---
    const [monthlyGoal, setMonthlyGoal] = useState(2000000);
    const [peakYieldPerTree, setPeakYieldPerTree] = useState(5); // Kg Cereza/Árbol Año Pico

    // --- CÁLCULOS TÉCNICOS ---
    const calculation = useMemo(() => {
        const areaHa = totalTrees / density;

        // 1. Costos Unitarios Detallados (Base Anual Adulta)
        const fertPricePerKg = fertilizerPriceBulto / 50;
        const totalFertKg = (TECHNICAL_STANDARDS.maintenance.fertilizacion_qty_ha * areaHa); 
        const costFertInsumo = totalFertKg * fertPricePerKg;
        const totalFertJornales = (totalFertKg / 200); 
        const costFertLabor = totalFertJornales * jornalValue;

        // Labores Culturales Base (Plateos, Desyerbas, Fitosanitario estimado)
        const culturalLaborPerTree = jornalValue * (4 / 200); // Aprox 4 jornales/año por cada 200 árboles (estándar)
        const culturalCostTotal = culturalLaborPerTree * totalTrees;

        // ESTABLECIMIENTO (AÑO 1 - Inversión Inicial)
        const costEstLabor = (totalTrees * jornalValue * ((1/700) + (1/600) + (1/950))); // Ahoyado, Siembra, Trazo
        const costEstInsumo = (totalTrees * seedlingCost); // Colinos iniciales
        
        // 2. Proyección 7 Años
        let globalAccumulated = 0;
        let globalInvestment = 0;
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalCargasProduced = 0;
        let paybackYear = -1;

        const yearlyData = PRODUCTION_CURVE.map(curve => {
            // --- INGRESOS ---
            const yieldKgCereza = peakYieldPerTree * curve.percent * totalTrees; 
            const yieldKgCPS = yieldKgCereza / yieldConversion; 
            const yieldCargas = yieldKgCPS / TECHNICAL_STANDARDS.production.factor_carga;
            const income = yieldCargas * coffeeLoadPrice;

            // --- EGRESOS DETALLADOS ---
            
            // 1. Costo Variable Recolección (Directamente ligado a producción)
            const costHarvest = yieldKgCereza * harvestCostPerKg;

            // 2. Costo Fertilización (Ajustado por edad)
            const currentFertCost = (costFertInsumo + costFertLabor) * curve.fertFactor;

            // 3. Costo Mantenimiento Cultural (Limpias, Fitosanitario)
            // En levante (Año 1-2) se gasta casi lo mismo en limpias que en producción
            const currentCulturalCost = culturalCostTotal * (curve.year === 1 ? 0.8 : 1.0);

            // 4. Costo Resiembras (El "hueco" financiero del levante)
            // Se calcula sobre el total de árboles
            const treesToReplant = totalTrees * curve.replanting;
            const costReplantingMaterial = treesToReplant * seedlingCost;
            const costReplantingLabor = treesToReplant * (jornalValue / 50); // 50 árboles/jornal resiembra
            const totalReplanting = costReplantingMaterial + costReplantingLabor;

            // 5. Costo Establecimiento (Solo año 1)
            const initialSetup = curve.year === 1 ? (costEstLabor + costEstInsumo) : 0;

            // 6. Gastos Administrativos / Imprevistos (Sobre subtotal operativo)
            const subtotalOperational = currentFertCost + currentCulturalCost + totalReplanting + initialSetup;
            const overhead = subtotalOperational * (adminOverheadPct / 100);

            // TOTAL EGRESOS AÑO
            const totalCost = subtotalOperational + costHarvest + overhead;
            const profit = income - totalCost;

            globalAccumulated += profit;
            if (globalAccumulated < 0) {
                // Track max negative cash flow needed
                if (Math.abs(globalAccumulated) > globalInvestment) globalInvestment = Math.abs(globalAccumulated);
            }
            
            if (paybackYear === -1 && globalAccumulated > 0) paybackYear = curve.year;

            totalRevenue += income;
            totalExpenses += totalCost;
            totalCargasProduced += yieldCargas;

            return {
                year: curve.year,
                label: curve.label,
                yieldKg: yieldKgCereza / totalTrees,
                income,
                totalCost,
                profit,
                marginPct: income > 0 ? (profit / income) * 100 : -100,
                accumulated: globalAccumulated,
                replantingCount: treesToReplant // For debugging/display
            };
        });

        // --- FINANCIAL METRICS REFINADAS ---
        const totalProfit = totalRevenue - totalExpenses;
        
        // Net Margin (Real world profitability metric)
        const netMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        
        // Annualized ROI (CAGR approximate)
        // (Valor Final / Inversión)^ (1/n) - 1. 
        // Here we use a simpler Average Annual Return over Investment for clarity in agro.
        // Investment = Max cash exposure (Capital de Trabajo Máximo)
        const annualProfitAvg = totalProfit / 7;
        const annualizedROI = globalInvestment > 0 ? (annualProfitAvg / globalInvestment) * 100 : 0;

        const costPerCarga = totalCargasProduced > 0 ? totalExpenses / totalCargasProduced : 0;
        const avgMonthlyTotal = annualProfitAvg / 12;

        return {
            yearlyData,
            globalAccumulated,
            avgMonthlyTotal,
            paybackYear,
            maxInvestment: globalInvestment,
            annualizedROI,
            netMargin,
            costPerCarga,
            totalRevenue,
            totalExpenses,
            totalCargas: totalCargasProduced
        };
    }, [totalTrees, density, coffeeLoadPrice, jornalValue, fertilizerPriceBulto, seedlingCost, harvestCostPerKg, peakYieldPerTree, yieldConversion, adminOverheadPct]);

    // --- CÁLCULO INVERSO (META) ---
    const reverseCalc = useMemo(() => {
        const profitPerTreeMonth = calculation.avgMonthlyTotal / totalTrees;
        if (profitPerTreeMonth <= 0) return { trees: 0, area: 0 };
        const treesNeeded = Math.ceil(monthlyGoal / profitPerTreeMonth);
        return { trees: treesNeeded, area: treesNeeded / density };
    }, [monthlyGoal, calculation.avgMonthlyTotal, totalTrees, density]);

    const handleExportPDF = () => {
        const simData = {
            parameters: { totalTrees, density, coffeeLoadPrice, jornalValue, fertilizerPriceBulto, harvestCostPerKg, yieldConversion },
            calculation,
            reverseCalc: { ...reverseCalc, goal: monthlyGoal }
        };
        generateSimulatorPDF(simData);
    };

    const handleExportExcel = () => {
        const simData = {
            parameters: { totalTrees, density, coffeeLoadPrice, jornalValue, fertilizerPriceBulto, harvestCostPerKg, yieldConversion },
            calculation,
            reverseCalc: { ...reverseCalc, goal: monthlyGoal }
        };
        generateSimulatorExcel(simData);
    };

    return (
        <div className="space-y-8 pb-32 animate-fade-in">
            {/* HEADER */}
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 p-6 opacity-5"><Sprout className="w-32 h-32 text-white" /></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Calculator className="w-6 h-6 text-white" /></div>
                        <h2 className="text-white font-black text-xl uppercase tracking-tighter">Simulador Financiero Realista</h2>
                    </div>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em]">Modelo Conservador con Resiembras y Costos Ocultos</p>
                    
                    <div className="flex justify-center gap-3 mt-6">
                        <button onClick={handleExportPDF} className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"><FileText className="w-4 h-4" /> PDF</button>
                        <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
                    </div>
                </div>
            </div>

            {/* INPUTS PRINCIPALES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                        <h3 className="font-black text-slate-700 dark:text-white uppercase text-xs flex items-center gap-2 tracking-widest mb-4">
                            <Ruler className="w-4 h-4 text-emerald-500" /> Variables de Ajuste
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase">Cantidad Árboles</label>
                                <input type="number" value={totalTrees} onChange={e => setTotalTrees(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-slate-800 dark:text-white font-mono font-black text-lg" />
                            </div>
                            
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                                <label className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2 mb-1">
                                    <DollarSign className="w-3 h-3" /> Precio Carga Hoy
                                </label>
                                <input type="number" value={coffeeLoadPrice} onChange={e => setCoffeeLoadPrice(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-emerald-600 dark:text-emerald-400 font-mono font-black text-2xl outline-none" />
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                                <label className="text-[9px] font-black text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-500" /> Gastos Admin / Imprevistos
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="range" 
                                        min="5" 
                                        max="30" 
                                        value={adminOverheadPct} 
                                        onChange={e => setAdminOverheadPct(Number(e.target.value))} 
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                    <span className="text-xs font-black text-slate-700 dark:text-white w-8">{adminOverheadPct}%</span>
                                </div>
                                <p className="text-[8px] text-slate-400 mt-1 italic">Incluye herramientas, transporte y administración.</p>
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
                                    <div className="col-span-2 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <label className="text-[8px] font-bold text-amber-600 dark:text-amber-400 block mb-1">Factor Rendimiento (Kilos)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="0.1" value={peakYieldPerTree} onChange={e => setPeakYieldPerTree(Number(e.target.value))} className="w-full bg-white dark:bg-slate-900 rounded-md p-1 text-xs text-center font-bold" />
                                            <span className="text-[9px] font-black text-slate-400">Kg/Árbol (Pico)</span>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>

                    {/* KPI CARD */}
                    <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl">
                        <h4 className="text-white font-black text-xs uppercase flex items-center gap-2 mb-2">
                            <Coins className="w-4 h-4 text-amber-500" /> Promedio Mensual Libre
                        </h4>
                        <p className="text-[10px] text-slate-400 mb-3 leading-tight">
                            Promedio real descontando pérdidas de levante y gastos administrativos anuales.
                        </p>
                        <p className={`text-3xl font-mono font-black ${calculation.avgMonthlyTotal > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(calculation.avgMonthlyTotal)}
                        </p>
                    </div>
                </div>

                {/* TABLA DE DETALLE ANUAL */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-slate-800 dark:text-white font-black uppercase text-sm flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-indigo-500" /> Flujo de Caja Realista (7 Años)
                            </h4>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-3 py-1 rounded-full font-bold uppercase">Ciclo Completo</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                        <th className="p-3 text-center">Año</th>
                                        <th className="p-3">Etapa / Resiembra</th>
                                        <th className="p-3 text-right text-emerald-500">Ingreso</th>
                                        <th className="p-3 text-right text-red-500">Egreso Total</th>
                                        <th className="p-3 text-right text-indigo-500">Margen Neto</th>
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
                                                <span className="text-[9px] text-slate-400">Resiembra: {row.replantingCount.toFixed(0)} arb.</span>
                                            </td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.income)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.totalCost)}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-mono font-black ${row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {formatCurrency(row.profit)}
                                                    </span>
                                                    <span className="text-[8px] text-slate-400">{row.marginPct.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* KPI GRID FINANCIERO */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700 group hover:border-emerald-500/50 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Margen Neto Real</p>
                            <p className={`text-2xl font-mono font-black ${calculation.netMargin >= 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {calculation.netMargin.toFixed(1)}%
                            </p>
                            <p className="text-[8px] text-slate-500 mt-1">Utilidad sobre Ventas. (Ideal {'>'} 20%)</p>
                        </div>
                        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700 group hover:border-indigo-500/50 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Rentabilidad Anual</p>
                            <p className={`text-2xl font-mono font-black ${calculation.annualizedROI > 10 ? 'text-indigo-400' : 'text-slate-200'}`}>
                                {calculation.annualizedROI.toFixed(1)}%
                            </p>
                            <p className="text-[8px] text-slate-500 mt-1">Retorno efectivo sobre capital invertido.</p>
                        </div>
                        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Costo Prod. / Carga</p>
                            <p className="text-xl font-mono font-black text-white">{formatCurrency(calculation.costPerCarga)}</p>
                            <p className="text-[8px] text-slate-500 mt-1">Incluye Admin y Resiembras.</p>
                        </div>
                        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Capital Máximo Req.</p>
                            <p className="text-xl font-mono font-black text-red-400">{formatCurrency(calculation.maxInvestment)}</p>
                            <p className="text-[8px] text-slate-500 mt-1">Flujo de caja negativo acumulado.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CALCULADORA INVERSA */}
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
