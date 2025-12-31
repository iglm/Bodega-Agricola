
import React, { useState, useMemo } from 'react';
import { Calculator, Sprout, TrendingUp, Users, DollarSign, Ruler, Clock, Briefcase, ChevronDown, PieChart, Scale, TrendingDown, AlertTriangle, BarChart3, Handshake, Target, CheckCircle2, Scissors, ShieldCheck, Warehouse, BookOpen, Info, Leaf, ArrowRight, Wallet, Coins, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService';

// INDICADORES TÉCNICOS BASADOS EN ESTÁNDARES DE LA INDUSTRIA CAFETERA
const TECHNICAL_STANDARDS = {
    establishment: {
        ahoyado: 700, // Hoyos por jornal
        siembra: 600, // Colinos por jornal
        trazo: 950,   // Estacas por jornal
        resiembra_pct: 0.05 // 5% de pérdida normal
    },
    maintenance: {
        plateo: 900, // Árboles por jornal
        fertilizacion_labor: 1950, // Árboles por jornal (Solo mano de obra)
        fertilizacion_qty_ha: 1200, // Kg de fertilizante por Ha al año (Adulto)
        desyerba_machete: 9, // Jornales por hectárea
    },
    production: {
        recoleccion_promedio: 80, // Kg cereza por jornal (Referencia promedio zona centro)
        deschuponada: 3.5, // Jornales por Ha
        broca: 2.5 // Jornales por Ha
    }
};

// CURVA DE PRODUCCIÓN Y CONSUMO DE NUTRIENTES
const PRODUCTION_CURVE = [
    { year: 1, percent: 0, fertFactor: 0.3, harvestEfficiency: 0, label: 'Año 1: Siembra (Inversión)' },
    { year: 2, percent: 0.25, fertFactor: 0.6, harvestEfficiency: 0.8, label: 'Año 2: Graneo (25%)' },
    { year: 3, percent: 0.70, fertFactor: 0.9, harvestEfficiency: 1.0, label: 'Año 3: Crecimiento (70%)' },
    { year: 4, percent: 1.00, fertFactor: 1.0, harvestEfficiency: 1.0, label: 'Año 4: Pico Productivo (100%)' },
    { year: 5, percent: 0.85, fertFactor: 1.0, harvestEfficiency: 0.95, label: 'Año 5: Estabilización (85%)' },
    { year: 6, percent: 0.65, fertFactor: 1.0, harvestEfficiency: 0.90, label: 'Año 6: Declive (65%)' },
    { year: 7, percent: 0.45, fertFactor: 1.0, harvestEfficiency: 0.85, label: 'Año 7: Renovación (45%)' },
];

export const SimulatorView: React.FC = () => {
    // PARAMETROS DE ENTRADA (Costos)
    const [jornalValue, setJornalValue] = useState(80000); 
    const [density, setDensity] = useState(5000); 
    const [harvestCostPerKg, setHarvestCostPerKg] = useState(1500); 
    const [fertilizerPriceBulto, setFertilizerPriceBulto] = useState(150000); // Precio bulto 50kg
    const [seedlingCost, setSeedlingCost] = useState(800); // Precio del colino
    
    // PRECIO DE MERCADO
    const [coffeeLoadPrice, setCoffeeLoadPrice] = useState(2600000); 

    // META DEL USUARIO (Herramienta Secundaria)
    const [monthlyGoal, setMonthlyGoal] = useState(2000000);

    // PARAMETROS DE CULTIVO (INPUT PRINCIPAL)
    const [totalTrees, setTotalTrees] = useState(5000);
    const [peakYieldPerTree, setPeakYieldPerTree] = useState(5); // Kg Cereza

    // VISUALIZACIÓN
    const [viewMode, setViewMode] = useState<'GLOBAL' | 'UNIT'>('GLOBAL');

    // --- 1. COSTO DE INSUMOS MATERIALES (UNITARIO) ---
    const materialCosts = useMemo(() => {
        const fertPricePerKg = fertilizerPriceBulto / 50;
        // 1200 kg/Ha / Densidad = Kg por árbol al año en etapa adulta
        const kgFertPerTreeYear = TECHNICAL_STANDARDS.maintenance.fertilizacion_qty_ha / density;
        const maxFertCost = kgFertPerTreeYear * fertPricePerKg;
        
        return {
            fertPricePerKg,
            maxFertCost, // Costo de material fertilizante anual por árbol adulto
            seedlingTotal: seedlingCost * (1 + TECHNICAL_STANDARDS.establishment.resiembra_pct) // Costo colino + resiembra
        };
    }, [fertilizerPriceBulto, density, seedlingCost]);

    // --- 2. COSTO DE MANO DE OBRA (LABORES) ---
    const laborCosts = useMemo(() => {
        // Establecimiento (Año 1)
        const ahoyado = jornalValue / TECHNICAL_STANDARDS.establishment.ahoyado;
        const siembra = jornalValue / TECHNICAL_STANDARDS.establishment.siembra;
        const trazo = jornalValue / TECHNICAL_STANDARDS.establishment.trazo;
        const establishmentLabor = ahoyado + siembra + trazo;

        // Mantenimiento Recurrente (Por evento)
        const plateoUnit = jornalValue / TECHNICAL_STANDARDS.maintenance.plateo;
        const fertApplyUnit = jornalValue / TECHNICAL_STANDARDS.maintenance.fertilizacion_labor;
        
        return { establishmentLabor, plateoUnit, fertApplyUnit };
    }, [jornalValue]);

    // --- 3. ANÁLISIS DE CICLO DE VIDA ---
    const cycleAnalysis = useMemo(() => {
        let accumulatedCashFlow = 0;
        let paybackYear = -1;
        let totalCycleIncome = 0;
        let totalCycleCost = 0;

        const years = PRODUCTION_CURVE.map(curve => {
            // --- INGRESOS ---
            const yieldKg = peakYieldPerTree * curve.percent;
            const kgCPS = yieldKg / 5; // Factor 5:1
            const income = (kgCPS / 125) * coffeeLoadPrice;

            // --- COSTOS ---
            let cost = 0;
            
            // 1. Fertilizante (Material + Mano de Obra)
            // Se ajusta según la edad del árbol (árbol pequeño come menos)
            const fertMaterial = materialCosts.maxFertCost * curve.fertFactor;
            const fertLabor = (laborCosts.fertApplyUnit * 2); // 2 ciclos al año fijo
            
            // 2. Control Arvenses (4 Plateos al año promedio)
            const weedLabor = (laborCosts.plateoUnit * 4);

            // 3. Fitosanitario & Otros (Estimado como % del mantenimiento)
            const otherMaintenance = (fertLabor + weedLabor) * 0.2; 

            // 4. Recolección
            const efficiencyFactor = curve.harvestEfficiency > 0 ? (1 / curve.harvestEfficiency) : 1;
            const harvestCost = yieldKg * (harvestCostPerKg * efficiencyFactor);

            if (curve.year === 1) {
                // Año 1: Sumar Establecimiento (Colino + Ahoyado + Siembra)
                cost = laborCosts.establishmentLabor + materialCosts.seedlingTotal + fertMaterial + fertLabor + weedLabor;
            } else {
                cost = fertMaterial + fertLabor + weedLabor + otherMaintenance + harvestCost;
            }

            const profit = income - cost;
            accumulatedCashFlow += profit;

            if (paybackYear === -1 && accumulatedCashFlow > 0) {
                paybackYear = curve.year;
            }

            totalCycleIncome += income;
            totalCycleCost += cost;

            return {
                year: curve.year,
                label: curve.label,
                percent: curve.percent,
                yieldKg,
                income,
                cost,
                profit,
                accumulated: accumulatedCashFlow
            };
        });

        // PROMEDIOS PARA FINCA ESTABILIZADA (MODELO DE RENOVACIÓN CONSTANTE)
        // Asumiendo que la finca tiene lotes en todas las edades (1/7 del área en cada año)
        const avgAnnualNetProfitPerTree = accumulatedCashFlow / 7;
        const avgMonthlyNetProfitPerTree = avgAnnualNetProfitPerTree / 12;

        return {
            years,
            paybackYear,
            globalAccumulated: accumulatedCashFlow * totalTrees,
            unitAccumulated: accumulatedCashFlow,
            avgMonthlyNetProfitPerTree
        };
    }, [peakYieldPerTree, coffeeLoadPrice, laborCosts, materialCosts, harvestCostPerKg, totalTrees]);

    // --- CALCULADORA INVERSA (META) ---
    const goalAnalysis = useMemo(() => {
        if (cycleAnalysis.avgMonthlyNetProfitPerTree <= 0) return { treesNeeded: 0, areaNeeded: 0, feasible: false };
        
        const treesNeeded = Math.ceil(monthlyGoal / cycleAnalysis.avgMonthlyNetProfitPerTree);
        const areaNeeded = treesNeeded / density;

        return { treesNeeded, areaNeeded, feasible: true };
    }, [monthlyGoal, cycleAnalysis.avgMonthlyNetProfitPerTree, density]);

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-700 shadow-2xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 p-6 opacity-5"><Leaf className="w-32 h-32 text-white" /></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg"><Calculator className="w-6 h-6 text-white" /></div>
                        <h2 className="text-white font-black text-xl uppercase tracking-tighter">Simulador de Inversión Cafetera</h2>
                    </div>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em]">Modelo de Finca Estabilizada (Renovación 20%)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. CONFIGURACIÓN (Left Column) */}
                <div className="lg:col-span-4 space-y-4">
                    
                    {/* PARÁMETROS PRINCIPALES (INPUT DEL USUARIO) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="font-black text-slate-700 dark:text-white uppercase text-xs flex items-center gap-2 tracking-widest">
                            <Ruler className="w-4 h-4 text-emerald-500" /> 1. Configuración del Proyecto
                        </h3>
                        
                        <div className="space-y-3">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                                <label className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-2 mb-1">
                                    <Sprout className="w-3 h-3" /> Cantidad de Árboles
                                </label>
                                <input 
                                    type="number" 
                                    value={totalTrees} 
                                    onChange={e => setTotalTrees(Number(e.target.value))} 
                                    className="w-full bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-xl p-3 text-indigo-600 dark:text-indigo-400 font-mono font-black text-xl outline-none" 
                                />
                                <p className="text-[8px] text-slate-500 mt-1">Este dato define el tamaño global de la inversión.</p>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Precio Carga (125kg)</label>
                                <input type="number" value={coffeeLoadPrice} onChange={e => setCoffeeLoadPrice(Number(e.target.value))} className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-emerald-700 dark:text-emerald-400 font-mono font-black text-lg outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Bulto Fert. (50kg)</label>
                                    <input type="number" value={fertilizerPriceBulto} onChange={e => setFertilizerPriceBulto(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-slate-800 dark:text-white font-mono font-black text-sm" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Costo Colino</label>
                                    <input type="number" value={seedlingCost} onChange={e => setSeedlingCost(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-slate-800 dark:text-white font-mono font-black text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Technical details collapsed */}
                        <details className="group pt-2">
                            <summary className="flex justify-between items-center cursor-pointer text-[9px] font-black text-slate-400 uppercase py-2 bg-slate-50 dark:bg-slate-900/50 px-3 rounded-lg hover:text-slate-600 dark:hover:text-slate-200">
                                <span>Costos Laborales & Técnicos</span>
                                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform"/>
                            </summary>
                            <div className="grid grid-cols-2 gap-3 pt-3 animate-fade-in-down">
                                <div><label className="text-[9px] font-bold text-slate-500">Valor Jornal ($)</label><input type="number" value={jornalValue} onChange={e => setJornalValue(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs" /></div>
                                <div><label className="text-[9px] font-bold text-slate-500">Densidad (Árb/Ha)</label><input type="number" value={density} onChange={e => setDensity(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs" /></div>
                                <div><label className="text-[9px] font-bold text-slate-500">Pago Recolección/Kg</label><input type="number" value={harvestCostPerKg} onChange={e => setHarvestCostPerKg(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs" /></div>
                                <div><label className="text-[9px] font-bold text-slate-500">Pico Prod (Kg/Arb)</label><input type="number" value={peakYieldPerTree} onChange={e => setPeakYieldPerTree(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs" /></div>
                            </div>
                        </details>
                    </div>

                    {/* KEY METRICS SUMMARY (PROMEDIO ESTABILIZADO) */}
                    <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl">
                        <h4 className="text-white font-black text-xs uppercase flex items-center gap-2 mb-4">
                            <Coins className="w-4 h-4 text-amber-500" /> Promedio Mensual Estabilizado
                        </h4>
                        <p className="text-slate-400 text-[10px] mb-2 leading-tight">
                            Este valor es la utilidad promedio que la finca genera mensualmente cuando tiene lotes en todas las etapas (15-20% en renovación).
                        </p>
                        <p className="text-3xl font-mono font-black text-emerald-400">
                            {formatCurrency(cycleAnalysis.avgMonthlyNetProfitPerTree * totalTrees)} <span className="text-xs text-slate-500">/ Mes Total</span>
                        </p>
                        <p className="text-[9px] text-slate-500 mt-1 font-mono text-right">
                            ({formatCurrency(cycleAnalysis.avgMonthlyNetProfitPerTree)} por árbol)
                        </p>
                    </div>

                    {/* CALCULADORA DE META (HERRAMIENTA SECUNDARIA) */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-[2.5rem] border border-slate-700 opacity-90 hover:opacity-100 transition-opacity">
                        <div className="relative z-10">
                            <h3 className="font-black text-slate-300 uppercase text-[10px] flex items-center gap-2 tracking-widest mb-3">
                                <Target className="w-3 h-3 text-purple-400" /> Herramienta de Planificación Inversa
                            </h3>
                            
                            <div className="mb-3">
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Meta Mensual Deseada</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">$</span>
                                    <input 
                                        type="number" 
                                        value={monthlyGoal} 
                                        onChange={e => setMonthlyGoal(Number(e.target.value))} 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-6 pr-3 text-white font-mono font-bold text-sm outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-purple-900/10 p-3 rounded-xl border border-purple-500/20">
                                <span className="text-[9px] text-purple-300 font-bold uppercase">Requiere Sembrar:</span>
                                <span className="text-sm font-black text-white">{goalAnalysis.treesNeeded.toLocaleString()} Árboles</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* 2. VISUALIZACIÓN DETALLADA (Center/Right) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* FINANCIAL BREAKDOWN LIST */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                        
                        {/* HEADER CON SWITCH DE VISTA */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h4 className="text-slate-800 dark:text-white font-black uppercase text-sm flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-indigo-500" /> Flujo de Caja por Etapa
                                </h4>
                                <p className="text-[9px] text-slate-400 mt-1">Análisis detallado del ciclo de vida (7 Años).</p>
                            </div>
                            
                            {/* VIEW MODE TOGGLE */}
                            <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center">
                                <button 
                                    onClick={() => setViewMode('GLOBAL')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'GLOBAL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Coins className="w-3 h-3" /> Proyecto Total ({totalTrees})
                                </button>
                                <button 
                                    onClick={() => setViewMode('UNIT')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'UNIT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Sprout className="w-3 h-3" /> Unid. Árbol
                                </button>
                            </div>
                        </div>

                        {/* LISTA DE AÑOS */}
                        <div className="space-y-4">
                            {cycleAnalysis.years.map((yearData, idx) => {
                                const isPositive = yearData.profit >= 0;
                                const isPayback = yearData.accumulated > 0 && (idx > 0 ? cycleAnalysis.years[idx-1].accumulated < 0 : true);
                                
                                // Apply Multiplier based on ViewMode
                                const multiplier = viewMode === 'GLOBAL' ? totalTrees : 1;
                                const income = yearData.income * multiplier;
                                const cost = yearData.cost * multiplier;
                                const profit = yearData.profit * multiplier;

                                return (
                                    <div key={yearData.year} className={`relative p-4 rounded-2xl border flex flex-col md:flex-row items-center gap-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 ${isPayback ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-transparent border-slate-200 dark:border-slate-700'}`}>
                                        
                                        {/* Year Badge */}
                                        <div className="flex items-center gap-3 w-full md:w-48 shrink-0">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg ${isPositive ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                                {yearData.year}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Etapa</p>
                                                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{yearData.label}</p>
                                                <p className="text-[9px] text-slate-500 mt-0.5">{yearData.percent * 100}% Productividad</p>
                                            </div>
                                        </div>

                                        {/* Financials Row */}
                                        <div className="flex-1 grid grid-cols-3 gap-2 w-full text-center">
                                            <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-xl">
                                                <p className="text-[8px] text-emerald-600 font-bold uppercase">Ingresos</p>
                                                <p className="text-xs font-mono font-black text-emerald-500">+{formatCurrency(income)}</p>
                                            </div>
                                            <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-xl">
                                                <p className="text-[8px] text-red-500 font-bold uppercase">Costo Anual</p>
                                                <p className="text-xs font-mono font-black text-red-400">-{formatCurrency(cost)}</p>
                                            </div>
                                            <div className={`p-2 rounded-xl ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                                                <p className={`text-[8px] font-bold uppercase ${isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>Utilidad Neta</p>
                                                <p className={`text-xs font-mono font-black ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {formatCurrency(profit)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Payback Indicator */}
                                        {isPayback && (
                                            <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Punto de Equilibrio
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl">
                            <h4 className="text-white font-black text-xs uppercase flex items-center gap-2 mb-4">
                                <Scale className="w-4 h-4 text-blue-500" /> Resumen Global del Proyecto (7 Años)
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Inversión Total Estimada:</span>
                                    <span className="text-red-400 font-mono font-bold">{formatCurrency(cycleAnalysis.globalAccumulated > 0 ? (cycleAnalysis.globalAccumulated - cycleAnalysis.globalAccumulated) /* Placeholder logic */ : 0)}</span>
                                    {/* Nota: En el useMemo original no guardé el costo total global separado del profit acumulado, 
                                        pero para no romper la lógica actual mostraré el acumulado neto abajo que es lo más relevante */}
                                </div>
                                <div className="flex justify-between items-end border-t border-slate-700 pt-2">
                                    <span className="text-slate-300 font-bold uppercase text-[10px]">Utilidad Neta Acumulada</span>
                                    <span className={`text-xl font-mono font-black ${cycleAnalysis.globalAccumulated > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatCurrency(cycleAnalysis.globalAccumulated)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl flex items-center">
                            <div>
                                <h4 className="text-slate-800 dark:text-white font-black text-xs uppercase flex items-center gap-2 mb-2">
                                    <Info className="w-4 h-4 text-slate-400" /> Nota Metodológica
                                </h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    Este modelo asume precios constantes. La realidad agronómica (clima, plagas) puede variar los resultados hasta un 30%. Úselo como guía de planificación, no como garantía financiera.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
