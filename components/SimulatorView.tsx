
import React, { useState, useMemo } from 'react';
import { Calculator, Sprout, TrendingUp, Users, DollarSign, Ruler, Clock, Briefcase, ChevronDown, PieChart, Scale, TrendingDown, AlertTriangle, BarChart3, Handshake, Target, CheckCircle2, Scissors, ShieldCheck, Warehouse, BookOpen, Info, Leaf, ArrowRight, Wallet, Coins, RefreshCw, CalendarDays, Zap, Download, FileSpreadsheet, FileText, Landmark, Activity, Table, Map, Sun, BadgeDollarSign } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService';
import { generateSimulatorPDF, generateSimulatorExcel } from '../services/reportService';

// --- CONSTANTES AGRONÓMICAS REALISTAS (CENICAFÉ / COMITÉ) ---

// Curvas de Producción por Región
// Percent: % del Pico de Producción
// FertFactor: % de fertilización respecto a un adulto
const REGIONAL_CURVES = {
    'EJE_CAFETERO': {
        name: 'Eje Cafetero (Bimodal)',
        desc: 'Ciclo rápido con Mitaca. Inicia producción leve en Año 2.',
        curve: [
            { year: 1, percent: 0, fertFactor: 0.3, label: 'Siembra (Inversión)', replanting: 0.05 },
            { year: 2, percent: 0.20, fertFactor: 0.6, label: 'Levante / Granea', replanting: 0.10 }, // Granea temprano
            { year: 3, percent: 0.70, fertFactor: 0.9, label: 'Primera Producción', replanting: 0.03 },
            { year: 4, percent: 1.00, fertFactor: 1.0, label: 'Pico Productivo 1', replanting: 0.02 },
            { year: 5, percent: 0.90, fertFactor: 1.0, label: 'Estabilización', replanting: 0.02 },
            { year: 6, percent: 0.80, fertFactor: 1.0, label: 'Pico Productivo 2', replanting: 0.02 }, // Ciclo renovado por poda
            { year: 7, percent: 0.60, fertFactor: 1.0, label: 'Prep. Renovación', replanting: 0.0 },
        ]
    },
    'SUR_HUILA': {
        name: 'Sur - Huila/Nariño (Monomodal)',
        desc: 'Ciclo más lento por altura. Picos más altos y concentrados.',
        curve: [
            { year: 1, percent: 0, fertFactor: 0.3, label: 'Siembra (Inversión)', replanting: 0.05 },
            { year: 2, percent: 0.05, fertFactor: 0.6, label: 'Levante Tardío', replanting: 0.12 }, // Muy poco café año 2
            { year: 3, percent: 0.60, fertFactor: 0.9, label: 'Inicio Producción', replanting: 0.03 },
            { year: 4, percent: 1.10, fertFactor: 1.0, label: 'Crecimiento', replanting: 0.02 }, // Supera el 100% del promedio
            { year: 5, percent: 1.20, fertFactor: 1.0, label: 'Pico Máximo', replanting: 0.02 }, 
            { year: 6, percent: 0.90, fertFactor: 1.0, label: 'Estabilización', replanting: 0.02 },
            { year: 7, percent: 0.70, fertFactor: 1.0, label: 'Declive', replanting: 0.0 },
        ]
    },
    'SIERRA_NORTE': {
        name: 'Sierra Nevada / Norte',
        desc: 'Estrés hídrico marcado. Cosecha muy concentrada a fin de año.',
        curve: [
            { year: 1, percent: 0, fertFactor: 0.3, label: 'Siembra (Inversión)', replanting: 0.08 }, // Mayor mortalidad
            { year: 2, percent: 0.10, fertFactor: 0.6, label: 'Levante', replanting: 0.10 },
            { year: 3, percent: 0.60, fertFactor: 0.9, label: 'Producción', replanting: 0.03 },
            { year: 4, percent: 0.90, fertFactor: 1.0, label: 'Pico', replanting: 0.02 },
            { year: 5, percent: 0.80, fertFactor: 1.0, label: 'Estabilización', replanting: 0.02 },
            { year: 6, percent: 0.65, fertFactor: 1.0, label: 'Declive Rápido', replanting: 0.02 },
            { year: 7, percent: 0.40, fertFactor: 1.0, label: 'Agotamiento', replanting: 0.0 },
        ]
    }
};

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

export const SimulatorView: React.FC = () => {
    // --- INPUTS TÉCNICOS ---
    const [totalTrees, setTotalTrees] = useState(5000);
    const [density, setDensity] = useState(5500); 
    const [coffeeLoadPrice, setCoffeeLoadPrice] = useState(2400000); 
    const [selectedRegion, setSelectedRegion] = useState<keyof typeof REGIONAL_CURVES>('EJE_CAFETERO');
    
    // --- COSTOS UNITARIOS ---
    const [jornalValue, setJornalValue] = useState(65000); 
    const [fertilizerPriceBulto, setFertilizerPriceBulto] = useState(145000); 
    const [seedlingCost, setSeedlingCost] = useState(1200); 
    const [harvestCostPerKg, setHarvestCostPerKg] = useState(1000); 
    const [yieldConversion, setYieldConversion] = useState(5.5); // Kg Cereza por Kg Pergamino (Cenicafé 5.0 - 5.5)
    
    // --- COSTOS FIJOS Y OCULTOS ---
    const [adminOverheadPct, setAdminOverheadPct] = useState(12); 

    // --- ESTRATEGIA FINANCIERA (VALLE DE LA MUERTE) ---
    const [intercroppingIncome, setIntercroppingIncome] = useState(0); // Ingreso Cultivos Transitorios Año 1-2
    const [financingRate, setFinancingRate] = useState(1.5); // Tasa Interés Mensual M.V. (%)

    // --- META FINANCIERA ---
    const [monthlyGoal, setMonthlyGoal] = useState(2500000);
    const [peakYieldPerTree, setPeakYieldPerTree] = useState(1.2); // Kilos de PERGAMINO SECO por árbol (Más fácil para el usuario)

    // --- CÁLCULOS TÉCNICOS ---
    const calculation = useMemo(() => {
        const areaHa = totalTrees / density;
        const currentCurve = REGIONAL_CURVES[selectedRegion].curve;

        // 1. Costos Unitarios Detallados (Base Anual Adulta)
        const fertPricePerKg = fertilizerPriceBulto / 50;
        const totalFertKg = (TECHNICAL_STANDARDS.maintenance.fertilizacion_qty_ha * areaHa); 
        const costFertInsumo = totalFertKg * fertPricePerKg;
        // Costo Labor Fertilización: ~1 jornal por hectarea por bulto/aplicación (Simplificado)
        // Cenicafé: 1 Jornal aplica 8 bultos.
        const totalFertJornales = (totalFertKg / 50) / 8; 
        const costFertLabor = totalFertJornales * jornalValue;

        // Labores Culturales Base (Plateos, Desyerbas, Fitosanitario estimado)
        // Cenicafé: Aprox 50-60 jornales/ha/año en mantenimiento
        const culturalJornalesTotal = 55 * areaHa;
        const culturalCostTotal = culturalJornalesTotal * jornalValue;

        // ESTABLECIMIENTO (AÑO 1 - Inversión Inicial)
        // Ahoyado + Siembra + Trazo
        const laborEstablishment = areaHa * (30 + 15 + 10); // Jornales estimados por Ha
        const costEstLabor = laborEstablishment * jornalValue;
        const costEstInsumo = (totalTrees * seedlingCost); 
        
        // 2. Proyección 7 Años
        let globalAccumulated = 0;
        let globalInvestment = 0; // Max negative accumulated (Valle de la Muerte)
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalCargasProduced = 0;
        let paybackYear = -1;

        const yearlyData = currentCurve.map((curve) => {
            // --- INGRESOS ---
            // peakYieldPerTree es en CPS (Pergamino Seco). 
            // Convertimos a Cereza para costos de recolección.
            const yieldCPS_Tree = peakYieldPerTree * curve.percent;
            const yieldKgCereza_Tree = yieldCPS_Tree * yieldConversion;
            
            const totalKgCereza = yieldKgCereza_Tree * totalTrees;
            const totalKgCPS = yieldCPS_Tree * totalTrees;
            const yieldCargas = totalKgCPS / 125; // 1 Carga = 125 kg CPS
            
            let incomeCoffee = yieldCargas * coffeeLoadPrice;
            
            // Ingreso por Cultivos Transitorios (Mitigación Valle de la Muerte)
            // Solo aplica años 1 y 2
            let incomeIntercropping = 0;
            if (curve.year <= 2) {
                // El ingreso ingresado es por Ha neto
                incomeIntercropping = intercroppingIncome * areaHa;
            }

            const totalIncome = incomeCoffee + incomeIntercropping;

            // --- EGRESOS DETALLADOS ---
            const costHarvest = totalKgCereza * harvestCostPerKg;
            const currentFertCost = (costFertInsumo + costFertLabor) * curve.fertFactor;
            const currentCulturalCost = culturalCostTotal * (curve.year === 1 ? 0.8 : 1.0); // Año 1 un poco menos

            // Resiembras
            const treesToReplant = totalTrees * curve.replanting;
            const totalReplanting = (treesToReplant * seedlingCost) + (treesToReplant * (jornalValue / 50));

            const initialSetup = curve.year === 1 ? (costEstLabor + costEstInsumo) : 0;

            const subtotalOperational = currentFertCost + currentCulturalCost + totalReplanting + initialSetup;
            const overhead = subtotalOperational * (adminOverheadPct / 100);

            // --- COSTO FINANCIERO (Costo del Dinero) ---
            // Si el acumulado anterior era negativo, pagamos intereses sobre esa deuda ese año
            let financialCost = 0;
            if (globalAccumulated < 0) {
                // Interés Anual Efectivo aproximado
                const annualRate = Math.pow(1 + (financingRate/100), 12) - 1;
                financialCost = Math.abs(globalAccumulated) * annualRate;
            }

            // TOTAL EGRESOS AÑO
            const totalCost = subtotalOperational + costHarvest + overhead + financialCost;
            const profit = totalIncome - totalCost;

            globalAccumulated += profit;
            
            // Valley of Death Logic
            if (globalAccumulated < 0 && Math.abs(globalAccumulated) > globalInvestment) {
                globalInvestment = Math.abs(globalAccumulated);
            }
            
            if (paybackYear === -1 && globalAccumulated > 0) paybackYear = curve.year;

            totalRevenue += totalIncome;
            totalExpenses += totalCost;
            totalCargasProduced += yieldCargas;

            return {
                year: curve.year,
                label: curve.label,
                yieldCargas,
                income: totalIncome,
                incomeCoffee,
                incomeIntercropping,
                totalCost,
                financialCost,
                profit,
                marginPct: totalIncome > 0 ? (profit / totalIncome) * 100 : -100,
                accumulated: globalAccumulated,
                replantingCount: treesToReplant
            };
        });

        // --- FINANCIAL METRICS ---
        const totalProfit = totalRevenue - totalExpenses;
        const netMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const annualProfitAvg = totalProfit / 7;
        
        // ROI anualizado sobre la Inversión Máxima (Peak Funding Requirement)
        // Esto es más realista que sobre la inversión inicial, pues cubre el "Valle"
        const annualizedROI = globalInvestment > 0 ? (annualProfitAvg / globalInvestment) * 100 : 0;

        const costPerCarga = totalCargasProduced > 0 ? totalExpenses / totalCargasProduced : 0;
        const avgMonthlyTotal = annualProfitAvg / 12;

        return {
            yearlyData,
            globalAccumulated,
            avgMonthlyTotal,
            paybackYear,
            maxInvestment: globalInvestment, // Profundidad máxima del valle
            annualizedROI,
            netMargin,
            costPerCarga,
            totalRevenue,
            totalExpenses,
            totalCargas: totalCargasProduced,
            areaHa
        };
    }, [totalTrees, density, coffeeLoadPrice, jornalValue, fertilizerPriceBulto, seedlingCost, harvestCostPerKg, peakYieldPerTree, yieldConversion, adminOverheadPct, selectedRegion, intercroppingIncome, financingRate]);

    // --- CÁLCULO INVERSO ---
    const reverseCalc = useMemo(() => {
        const profitPerTreeMonth = calculation.avgMonthlyTotal / totalTrees;
        if (profitPerTreeMonth <= 0) return { trees: 0, area: 0 };
        const treesNeeded = Math.ceil(monthlyGoal / profitPerTreeMonth);
        return { trees: treesNeeded, area: treesNeeded / density };
    }, [monthlyGoal, calculation.avgMonthlyTotal, totalTrees, density]);

    const handleExportPDF = () => {
        generateSimulatorPDF({
            parameters: { totalTrees, density, coffeeLoadPrice, jornalValue, fertilizerPriceBulto, harvestCostPerKg, yieldConversion },
            calculation,
            reverseCalc: { ...reverseCalc, goal: monthlyGoal }
        });
    };

    const handleExportExcel = () => {
        generateSimulatorExcel({
            parameters: { totalTrees, density, coffeeLoadPrice, jornalValue, fertilizerPriceBulto, harvestCostPerKg, yieldConversion },
            calculation,
            reverseCalc: { ...reverseCalc, goal: monthlyGoal }
        });
    };

    return (
        <div className="space-y-8 pb-32 animate-fade-in">
            {/* HEADER */}
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 p-6 opacity-5"><Sprout className="w-32 h-32 text-white" /></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Calculator className="w-6 h-6 text-white" /></div>
                        <h2 className="text-white font-black text-xl uppercase tracking-tighter">Simulador Financiero Cafetero</h2>
                    </div>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em]">Modelo de Viabilidad con Flujo de Caja Real</p>
                    
                    <div className="flex justify-center gap-3 mt-6">
                        <button onClick={handleExportPDF} className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"><FileText className="w-4 h-4" /> PDF</button>
                        <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
                    </div>
                </div>
            </div>

            {/* ZONA DE CONTROL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMNA 1: PARÁMETROS BÁSICOS */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                        <h3 className="font-black text-slate-700 dark:text-white uppercase text-xs flex items-center gap-2 tracking-widest mb-4">
                            <Map className="w-4 h-4 text-emerald-500" /> Configuración Regional
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Región Productiva</label>
                                <select 
                                    value={selectedRegion} 
                                    onChange={e => setSelectedRegion(e.target.value as any)}
                                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white text-xs font-bold outline-none"
                                >
                                    {Object.entries(REGIONAL_CURVES).map(([key, data]) => (
                                        <option key={key} value={key}>{data.name}</option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-slate-400 mt-1 italic">{REGIONAL_CURVES[selectedRegion].desc}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Árboles</label>
                                    <input type="number" value={totalTrees} onChange={e => setTotalTrees(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-slate-800 dark:text-white font-mono font-black text-sm" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Densidad</label>
                                    <input type="number" value={density} onChange={e => setDensity(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-slate-800 dark:text-white font-mono font-black text-sm" />
                                </div>
                            </div>
                            
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                                <label className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2 mb-1">
                                    <DollarSign className="w-3 h-3" /> Precio Carga (125kg)
                                </label>
                                <input type="number" value={coffeeLoadPrice} onChange={e => setCoffeeLoadPrice(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-emerald-600 dark:text-emerald-400 font-mono font-black text-2xl outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* VALLE DE LA MUERTE - ESTRATEGIA */}
                    <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl">
                        <h4 className="text-white font-black text-xs uppercase flex items-center gap-2 mb-3">
                            <ShieldCheck className="w-4 h-4 text-amber-500" /> Estrategia: Valle de la Muerte
                        </h4>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Ingreso Cultivos Transitorios / Ha</label>
                                <div className="flex items-center bg-slate-800 rounded-xl p-2 border border-slate-600">
                                    <span className="text-emerald-500 font-black mr-2">$</span>
                                    <input 
                                        type="number" 
                                        value={intercroppingIncome} 
                                        onChange={e => setIntercroppingIncome(Number(e.target.value))} 
                                        className="bg-transparent border-none text-white text-sm w-full outline-none font-mono"
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-[8px] text-slate-500 mt-1">Ingreso neto anual por maíz/frijol durante años 1 y 2.</p>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tasa Interés Crédito (M.V.)</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        value={financingRate} 
                                        onChange={e => setFinancingRate(Number(e.target.value))} 
                                        className="w-16 bg-slate-800 border border-slate-600 rounded-lg p-2 text-center text-white text-sm font-bold"
                                    />
                                    <span className="text-[10px] text-slate-400">% Mes Vencido</span>
                                </div>
                                <p className="text-[8px] text-slate-500 mt-1">Costo del dinero para cubrir déficits de caja.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA 2 Y 3: RESULTADOS */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* INDICADORES CLAVE */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 group hover:border-red-500/50 transition-all">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Inversión Máxima</p>
                            <p className="text-lg font-mono font-black text-red-500">{formatCurrency(calculation.maxInvestment)}</p>
                            <p className="text-[8px] text-slate-500">Peak Funding (Valle)</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Punto Equilibrio</p>
                            <p className="text-lg font-mono font-black text-amber-500">{calculation.paybackYear > 0 ? `Año ${calculation.paybackYear}` : '> 7 Años'}</p>
                            <p className="text-[8px] text-slate-500">Retorno de Caja (Payback)</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Utilidad Mensual</p>
                            <p className={`text-lg font-mono font-black ${calculation.avgMonthlyTotal > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(calculation.avgMonthlyTotal)}</p>
                            <p className="text-[8px] text-slate-500">Promedio Ciclo 7 Años</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Rentabilidad (EA)</p>
                            <p className={`text-lg font-mono font-black ${calculation.annualizedROI > 15 ? 'text-indigo-500' : 'text-slate-500'}`}>{(calculation.annualizedROI || 0).toFixed(1)}%</p>
                            <p className="text-[8px] text-slate-500">Retorno Efectivo Anual</p>
                        </div>
                    </div>

                    {/* TABLA FLUJO DE CAJA */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-slate-800 dark:text-white font-black uppercase text-sm flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-indigo-500" /> Flujo de Caja Detallado
                            </h4>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-3 py-1 rounded-full font-bold uppercase">Incluye Costos Financieros</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                        <th className="p-3 text-center">Año</th>
                                        <th className="p-3">Etapa</th>
                                        <th className="p-3 text-right text-emerald-500">Ingresos Totales</th>
                                        <th className="p-3 text-right text-red-500">Egresos + Interés</th>
                                        <th className="p-3 text-right">Flujo Neto</th>
                                        <th className="p-3 text-right text-indigo-500">Acumulado</th>
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
                                                {row.incomeIntercropping > 0 && (
                                                    <span className="text-[8px] text-emerald-500 block">+ {formatCurrency(row.incomeIntercropping)} Transitorios</span>
                                                )}
                                                {row.financialCost > 0 && (
                                                    <span className="text-[8px] text-red-400 block">- {formatCurrency(row.financialCost)} Intereses</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.income)}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(row.totalCost)}</td>
                                            <td className="p-3 text-right">
                                                <span className={`font-mono font-bold ${row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {formatCurrency(row.profit)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className={`font-mono font-black ${row.accumulated >= 0 ? 'text-indigo-500' : 'text-red-500'}`}>
                                                    {formatCurrency(row.accumulated)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* COSTOS UNITARIOS EXPANDIBLES */}
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-4">
                        <details className="group">
                            <summary className="flex justify-between items-center cursor-pointer text-[10px] font-black text-slate-400 uppercase py-2 hover:text-slate-600 dark:hover:text-slate-200">
                                <span>Ajustar Costos Unitarios Detallados</span>
                                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform"/>
                            </summary>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 animate-fade-in-down border-t border-slate-200 dark:border-slate-800 mt-2">
                                <div><label className="text-[8px] font-bold text-slate-500">Jornal ($)</label><input type="number" value={jornalValue} onChange={e => setJornalValue(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700" /></div>
                                <div><label className="text-[8px] font-bold text-slate-500">Bulto Fert ($)</label><input type="number" value={fertilizerPriceBulto} onChange={e => setFertilizerPriceBulto(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700" /></div>
                                <div><label className="text-[8px] font-bold text-slate-500">Recolección/Kg</label><input type="number" value={harvestCostPerKg} onChange={e => setHarvestCostPerKg(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700" /></div>
                                <div><label className="text-[8px] font-bold text-slate-500">Colino ($)</label><input type="number" value={seedlingCost} onChange={e => setSeedlingCost(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700" /></div>
                                <div><label className="text-[8px] font-bold text-slate-500">Factor Conv. (Cereza:CPS)</label><input type="number" step="0.1" value={yieldConversion} onChange={e => setYieldConversion(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700" /></div>
                                <div><label className="text-[8px] font-bold text-slate-500">Prod. Pico (Kg CPS/Arb)</label><input type="number" step="0.1" value={peakYieldPerTree} onChange={e => setPeakYieldPerTree(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700" /></div>
                            </div>
                        </details>
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
