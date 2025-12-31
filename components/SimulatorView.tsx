
import React, { useState, useMemo } from 'react';
import { Calculator, Sprout, TrendingUp, Users, DollarSign, Trees, Ruler, Clock, Leaf, Info, HelpCircle, Briefcase, ChevronDown, CheckCircle2, FlaskConical, Scissors, PieChart, Scale, TrendingDown, AlertTriangle, BarChart3, CalendarRange } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService';

// INDICADORES TÉCNICOS BASADOS EN LA TABLA ADJUNTA (VALLE DEL CAUCA / EJE CAFETERO)
const TECHNICAL_STANDARDS = {
    establishment: {
        ahoyado: 700, // Hoyos por jornal
        siembra: 600, // Colinos por jornal
        trazo: 950,   // Estacas por jornal
    },
    maintenance: {
        plateo: 900, // Árboles por jornal
        fertilizacion: 1950, // Árboles por jornal
        desyerba_machete: 9, // Jornales por hectárea
        aplicacion_herbicida: 2.5, // Jornales por hectárea
    },
    production: {
        recoleccion_promedio: 80, // Kg cereza por jornal (Referencia promedio)
        deschuponada: 3.5, // Jornales por Ha
        broca: 2.5 // Jornales por Ha
    }
};

// CURVA DE PRODUCCIÓN COLOMBIA (REF. CENICAFÉ - VAR. CASTILLO/CENICAFÉ 1)
const PRODUCTION_CURVE = [
    { year: 1, percent: 0, label: 'Año 1: Levante (Inversión)' },
    { year: 2, percent: 0.20, label: 'Año 2: Cuchuco (20%)' },
    { year: 3, percent: 0.70, label: 'Año 3: Crecimiento (70%)' },
    { year: 4, percent: 1.00, label: 'Año 4: Pico Productivo (100%)' },
    { year: 5, percent: 0.90, label: 'Año 5: Sostenimiento (90%)' },
    { year: 6, percent: 0.75, label: 'Año 6: Declive (75%)' },
    { year: 7, percent: 0.55, label: 'Año 7: Agotamiento (Renovar)' },
];

type ServiceType = 'ADMIN' | 'FERT' | 'WEED' | 'PEST';

export const SimulatorView: React.FC = () => {
    // PARAMETROS DE ENTRADA
    const [jornalValue, setJornalValue] = useState(60000); // Valor día con carga prestacional base
    const [density, setDensity] = useState(5000); // Árboles por Ha
    const [harvestCostPerKg, setHarvestCostPerKg] = useState(850); // Pago por Kilo Recolectado (Cereza)
    
    // PRECIO DE MERCADO
    const [coffeeLoadPrice, setCoffeeLoadPrice] = useState(2200000); // Precio Carga 125kg CPS

    // VOLUMEN DE LA FINCA A ADMINISTRAR
    const [totalTrees, setTotalTrees] = useState(5000);

    // PARAMETROS DE CULTIVO
    const [freqPlateos, setFreqPlateos] = useState(4);
    const [freqFert, setFreqFert] = useState(3);
    const [peakYieldPerTree, setPeakYieldPerTree] = useState(5); // Kg Cereza/Árbol EN EL PICO (AÑO 4)

    // CONFIGURACIÓN DE COTIZACIÓN
    const [serviceType, setServiceType] = useState<ServiceType>('ADMIN');
    const [margin, setMargin] = useState(15); 

    // --- 1. COSTO BASE DE LEVANTE (AÑO 1 - INVERSIÓN) ---
    const establishmentCostPerTree = useMemo(() => {
        // Labores únicas
        const ahoyado = jornalValue / TECHNICAL_STANDARDS.establishment.ahoyado;
        const siembra = jornalValue / TECHNICAL_STANDARDS.establishment.siembra;
        const trazo = jornalValue / TECHNICAL_STANDARDS.establishment.trazo;
        
        // Labores recurrentes año 1
        const plateos = (jornalValue / TECHNICAL_STANDARDS.maintenance.plateo) * freqPlateos;
        const fert = (jornalValue / TECHNICAL_STANDARDS.maintenance.fertilizacion) * freqFert;

        // Insumos estimados (40% labor / 60% insumo en arranque)
        const labor = ahoyado + siembra + trazo + plateos + fert;
        const inputs = labor * 0.8; // Colinos, abono siembra, cal, micorrizas

        return labor + inputs;
    }, [jornalValue, freqPlateos, freqFert]);

    // --- 2. COSTO BASE MANTENIMIENTO ANUAL (AÑOS 2-7) ---
    // Sin incluir recolección, que es variable
    const maintenanceCostPerTree = useMemo(() => {
        const plateos = (jornalValue / TECHNICAL_STANDARDS.maintenance.plateo) * freqPlateos;
        const fert = (jornalValue / TECHNICAL_STANDARDS.maintenance.fertilizacion) * freqFert;
        
        // Labores culturales (Deschuponada, Broca) convertidas a por árbol
        const deschuponada = (TECHNICAL_STANDARDS.production.deschuponada * jornalValue) / density;
        const broca = (TECHNICAL_STANDARDS.production.broca * jornalValue) / density;

        const labor = plateos + fert + deschuponada + broca;
        const inputs = labor * 1.1; // Fertilizante es el costo más alto en producción

        return labor + inputs;
    }, [jornalValue, freqPlateos, freqFert, density]);

    // --- 3. ANÁLISIS DE CICLO DE VIDA (7 AÑOS) ---
    const cycleAnalysis = useMemo(() => {
        let accumulatedCashFlow = 0;
        let paybackYear = -1;
        let totalCycleYieldKg = 0;
        let totalCycleIncome = 0;
        let totalCycleCost = 0;

        const years = PRODUCTION_CURVE.map(curve => {
            // Producción del año (Kg Cereza)
            const yieldKg = peakYieldPerTree * curve.percent;
            
            // Ingresos
            // Factor 5kg Cereza = 1kg Pergamino Seco. 1 Carga = 125kg CPS.
            const kgCPS = yieldKg / 5;
            const income = (kgCPS / 125) * coffeeLoadPrice;

            // Costos
            let cost = 0;
            if (curve.year === 1) {
                cost = establishmentCostPerTree;
            } else {
                // Costo variable de recolección aumenta en años viejos por altura del árbol (Simulado +10% en año 6 y 7)
                const harvestInefficiency = curve.year >= 6 ? 1.15 : 1.0;
                const harvestCost = yieldKg * harvestCostPerKg * harvestInefficiency;
                
                cost = maintenanceCostPerTree + harvestCost;
            }

            const profit = income - cost;
            accumulatedCashFlow += profit;

            if (paybackYear === -1 && accumulatedCashFlow > 0) {
                paybackYear = curve.year;
            }

            totalCycleYieldKg += yieldKg;
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

        const averageAnnualProfit = accumulatedCashFlow / 7;
        const averageYield = totalCycleYieldKg / 7;
        const roi = (accumulatedCashFlow / totalCycleCost) * 100;

        return {
            years,
            paybackYear,
            accumulatedCashFlow,
            averageAnnualProfit,
            averageYield,
            roi,
            totalCycleCost,
            totalCycleYieldKg
        };
    }, [peakYieldPerTree, coffeeLoadPrice, establishmentCostPerTree, maintenanceCostPerTree, harvestCostPerKg]);

    // --- CÁLCULO DE PROPUESTA (BASADO EN PROMEDIO DE CICLO) ---
    const proposal = useMemo(() => {
        // Usamos el costo promedio anual del ciclo para "suavizar" la propuesta
        const avgAnnualCostPerTree = cycleAnalysis.totalCycleCost / 7;
        const totalAnnualOpEx = avgAnnualCostPerTree * totalTrees;

        let serviceGlobalCost = 0;
        let title = "";
        let description = "";

        if (serviceType === 'ADMIN') {
            // Administración sobre el gasto promedio
            serviceGlobalCost = totalAnnualOpEx * 0.10; 
            title = "Administración Integral (Ciclo Completo)";
            description = "Gestión técnica del ciclo de 7 años. Tarifa plana basada en el promedio de costos operativos para suavizar el flujo de caja del cliente.";
        } 
        else if (serviceType === 'FERT') {
            const laborFert = (jornalValue / TECHNICAL_STANDARDS.maintenance.fertilizacion) * freqFert * totalTrees;
            serviceGlobalCost = laborFert * (1 + (margin/100));
            title = "Plan Nutricional Anual";
            description = `Ejecución de ${freqFert} ciclos de fertilización. Valor estandarizado para años 2 a 7.`;
        }
        else if (serviceType === 'WEED') {
            const laborPlateo = (jornalValue / TECHNICAL_STANDARDS.maintenance.plateo) * freqPlateos * totalTrees;
            serviceGlobalCost = laborPlateo * (1 + (margin/100));
            title = "Manejo Integrado de Arvenses";
            description = `Control de coberturas nobles y ${freqPlateos} plateos al año. Tarifa unificada.`;
        }

        return { 
            totalAnnualOpEx,
            serviceGlobalCost, 
            serviceCostPerTree: serviceGlobalCost / totalTrees,
            title, 
            description 
        };
    }, [serviceType, totalTrees, cycleAnalysis, margin, jornalValue, freqFert, freqPlateos]);

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-700 shadow-2xl text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg"><Calculator className="w-6 h-6 text-white" /></div>
                    <h2 className="text-white font-black text-xl uppercase tracking-tighter">Simulador de Ciclo de Vida (7 Años)</h2>
                </div>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em]">Modelo Biológico Cenicafé - Castillo/Cenicafé 1</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. CONFIGURACIÓN (Left Column) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="font-black text-slate-700 dark:text-white uppercase text-xs flex items-center gap-2 tracking-widest">
                            <Ruler className="w-4 h-4 text-emerald-500" /> Parámetros del Proyecto
                        </h3>
                        
                        <div className="bg-emerald-900/10 p-4 rounded-2xl border border-emerald-500/20 mb-2">
                            <label className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2 mb-1">
                                <DollarSign className="w-3 h-3" /> Precio Carga (125 Kg CPS)
                            </label>
                            <input 
                                type="number" 
                                value={coffeeLoadPrice} 
                                onChange={e => setCoffeeLoadPrice(Number(e.target.value))} 
                                className="w-full bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-xl p-3 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xl outline-none" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Árboles Totales</label>
                                <input type="number" value={totalTrees} onChange={e => setTotalTrees(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-slate-800 dark:text-white font-mono font-black text-sm" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Pico (Kg/Árb)</label>
                                <input type="number" value={peakYieldPerTree} onChange={e => setPeakYieldPerTree(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-slate-800 dark:text-white font-mono font-black text-sm" />
                                <p className="text-[8px] text-slate-400 text-center mt-1">Año 4 (Máximo)</p>
                            </div>
                        </div>

                        {/* Technical details collapsed */}
                        <details className="group pt-2">
                            <summary className="flex justify-between items-center cursor-pointer text-[9px] font-black text-slate-400 uppercase py-2 bg-slate-50 dark:bg-slate-900/50 px-3 rounded-lg hover:text-slate-600 dark:hover:text-slate-200">
                                <span>Costos Laborales Avanzados</span>
                                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform"/>
                            </summary>
                            <div className="grid grid-cols-2 gap-3 pt-3 animate-fade-in-down">
                                <div><label className="text-[9px] font-bold text-slate-500">Valor Jornal ($)</label><input type="number" value={jornalValue} onChange={e => setJornalValue(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs" /></div>
                                <div><label className="text-[9px] font-bold text-slate-500">Densidad (Árb/Ha)</label><input type="number" value={density} onChange={e => setDensity(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs" /></div>
                                <div><label className="text-[9px] font-bold text-slate-500">Pago Recolección/Kg</label><input type="number" value={harvestCostPerKg} onChange={e => setHarvestCostPerKg(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs" /></div>
                                <div><label className="text-[9px] font-bold text-slate-500">Ciclos Fert/Año</label><input type="number" value={freqFert} onChange={e => setFreqFert(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs" /></div>
                            </div>
                        </details>
                    </div>

                    {/* KEY METRICS SUMMARY */}
                    <div className="bg-slate-900 p-5 rounded-[2.5rem] border border-slate-700 shadow-lg space-y-4">
                        <h4 className="text-white font-black uppercase text-xs flex items-center gap-2">
                            <Scale className="w-4 h-4 text-amber-500" /> Resultados del Ciclo
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] text-slate-400 uppercase font-bold">Flujo Caja Total</p>
                                <p className={`text-lg font-mono font-black ${cycleAnalysis.accumulatedCashFlow > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(cycleAnalysis.accumulatedCashFlow)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[9px] text-slate-400 uppercase font-bold">ROI (7 Años)</p>
                                <p className={`text-lg font-mono font-black ${cycleAnalysis.roi > 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                                    {cycleAnalysis.roi.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-700">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Punto de Retorno (Payback)</p>
                            <p className="text-white font-bold text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                {cycleAnalysis.paybackYear > 0 ? `Se recupera en el Año ${cycleAnalysis.paybackYear}` : 'No retorna inversión en 7 años'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. VISUALIZACIÓN DEL CICLO (Center/Right) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* CHART VISUALIZER */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-x-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-slate-800 dark:text-white font-black uppercase text-sm flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-500" /> Flujo de Caja por Edad del Cultivo
                            </h4>
                            <div className="flex gap-3 text-[9px] font-bold uppercase">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Inversión</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Utilidad</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Declive</span>
                            </div>
                        </div>

                        <div className="flex items-end gap-2 h-48 min-w-[500px]">
                            {cycleAnalysis.years.map((yearData) => {
                                const maxVal = Math.max(...cycleAnalysis.years.map(y => Math.abs(y.profit)));
                                // Evitar división por cero
                                const safeMax = maxVal === 0 ? 1 : maxVal;
                                const heightPercent = (Math.abs(yearData.profit) / safeMax) * 80; // 80% max height
                                
                                const isNegative = yearData.profit < 0;
                                const isDecline = yearData.year >= 6;
                                const isPeak = yearData.year === 4;

                                return (
                                    <div key={yearData.year} className="flex-1 flex flex-col items-center group relative">
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] p-2 rounded-lg pointer-events-none z-10 w-28 text-center border border-slate-700 shadow-xl">
                                            <p className="font-bold text-amber-400">{yearData.label}</p>
                                            <p className="font-mono text-white text-xs my-1">{formatCurrency(yearData.profit)}</p>
                                            <p className="text-slate-400">{yearData.yieldKg.toFixed(1)} Kg/Árbol</p>
                                        </div>

                                        {/* Positive Bar Space */}
                                        <div className="h-1/2 w-full flex items-end justify-center border-b border-slate-300 dark:border-slate-600">
                                            {!isNegative && (
                                                <div 
                                                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 hover:opacity-80 ${isDecline ? 'bg-amber-500' : isPeak ? 'bg-emerald-500' : 'bg-emerald-400'}`} 
                                                    style={{ height: `${heightPercent}%` }}
                                                ></div>
                                            )}
                                        </div>
                                        
                                        {/* Negative Bar Space */}
                                        <div className="h-1/2 w-full flex items-start justify-center">
                                            {isNegative && (
                                                <div 
                                                    className="w-full max-w-[40px] bg-red-500 rounded-b-lg transition-all duration-500 hover:opacity-80" 
                                                    style={{ height: `${heightPercent}%` }}
                                                ></div>
                                            )}
                                        </div>

                                        <span className="text-[10px] font-black text-slate-500 mt-2">AÑO {yearData.year}</span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase">{yearData.percent * 100}% Prod</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SERVICE QUOTER (UPDATED) */}
                    <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-indigo-500/30 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="space-y-3 flex-1">
                                <h3 className="font-black text-white uppercase text-sm flex items-center gap-2 tracking-widest">
                                    <Briefcase className="w-5 h-5 text-indigo-400" /> Cotizador Estabilizado
                                </h3>
                                <p className="text-[10px] text-slate-400 leading-relaxed max-w-md">
                                    Esta herramienta calcula una <strong>Tarifa Plana</strong> para contratos de largo plazo, promediando los costos bajos del inicio y los altos del pico productivo.
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setServiceType('ADMIN')} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${serviceType === 'ADMIN' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600 text-slate-400'}`}>Admin</button>
                                    <button onClick={() => setServiceType('FERT')} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${serviceType === 'FERT' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-600 text-slate-400'}`}>Fertilización</button>
                                    <button onClick={() => setServiceType('WEED')} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${serviceType === 'WEED' ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-600 text-slate-400'}`}>Arvenses</button>
                                </div>
                            </div>

                            <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 min-w-[250px] text-center">
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">{proposal.title}</p>
                                <div className="flex items-end justify-center gap-2 mb-2">
                                    <p className="text-3xl font-black text-white font-mono">{formatCurrency(proposal.serviceGlobalCost / 12)}</p>
                                    <span className="text-[10px] font-bold text-slate-400 mb-1">/ Mes</span>
                                </div>
                                <div className="text-[9px] text-slate-500 bg-slate-900/50 p-2 rounded-lg">
                                    <span className="block font-bold uppercase text-emerald-500">Costo Real Promedio:</span>
                                    {formatCurrency(cycleAnalysis.totalCycleCost / 7)} / Año (Toda la Finca)
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
