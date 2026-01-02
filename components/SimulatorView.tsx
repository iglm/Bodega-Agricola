import React, { useState, useMemo } from 'react';
import { 
  Calculator, Sprout, TrendingUp, DollarSign, Clock, Layers, Zap, 
  Target, Wallet, Pickaxe, ArrowRight, Percent, Scale, 
  BarChart3, Lightbulb, Coffee, Info, AlertTriangle, 
  CheckCircle2, Timer, FileDown, Rocket, TreePine, Map,
  ChevronDown, ChevronUp, Minus, Plus, Users, Beaker,
  TrendingDown, ShieldAlert, BarChart, Landmark
} from 'lucide-react';
import { formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';
import { generateSimulationPDF } from '../services/reportService';

interface SimulationYear {
    year: number;
    totalProductionKg: number;
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    cumulativeFlow: number;
    label: string;
    // Campos de desglose para el usuario
    harvestCost: number;
    fertilizationCost: number;
    arvensesCost: number;
    renovationReserve: number;
    fitosanitaryCost: number;
    adminCost: number;
    beneficioCost: number;
    capex: number;
    pricePerKg: number;
    isLiquidityCrisis: boolean;
    /**
     * Fix: Added missing properties used in object creation and report generation
     */
    debtService: number;
    opex: number;
}

type ScenarioType = 'Pessimistic' | 'Realistic' | 'Optimistic';

export const SimulatorView: React.FC = () => {
    const [numTrees, setNumTrees] = useState('10000');
    const [density, setDensity] = useState('7500'); 
    const [marketPrice, setMarketPrice] = useState('1850000'); 
    const [jornalValue, setJornalValue] = useState('75000');
    const [initialCapital, setInitialCapital] = useState('50000000');
    
    const [scenario, setScenario] = useState<ScenarioType>('Realistic');
    const [expandedYear, setExpandedYear] = useState<number | null>(null);

    const simulation = useMemo(() => {
        const totalTrees = parseNumberInput(numTrees) || 1;
        const dens = parseNumberInput(density) || 1;
        const hectares = totalTrees / dens;
        const basePrice = parseNumberInput(marketPrice);
        const jVal = parseNumberInput(jornalValue);
        const initCap = parseNumberInput(initialCapital);

        const factors = {
            Pessimistic: { price: 0.8, yield: 0.85, costs: 1.15 },
            Realistic: { price: 1.0, yield: 1.0, costs: 1.0 },
            Optimistic: { price: 1.2, yield: 1.1, costs: 0.95 }
        };

        const currentFactor = factors[scenario];
        const pKg = (basePrice * currentFactor.price) / 125;

        const yearlyData: SimulationYear[] = [];
        let cumulative = initCap;
        let paybackYear: number | null = null;
        let totalCapexCalc = 0;
        let firstMonthCrisis: number | null = null;

        for (let i = 1; i <= 6; i++) {
            let prodKg = 0;
            let label = "";
            let capex = 0;
            let harvestCost = 0;
            let fertilizationCost = 0;
            let arvensesCost = 0;
            let fitosanitaryCost = 0;
            let renovationReserve = 0;
            let adminCost = 0;
            let beneficioCost = 0;
            let isYearlyCrisis = false;

            if (i === 1) {
                label = "Establecimiento";
                capex = (250 * jVal * currentFactor.costs) * hectares; 
                totalCapexCalc += capex;
            } else if (i === 2) {
                label = "Levante / Sostenimiento";
                capex = (120 * jVal * currentFactor.costs) * hectares;
                totalCapexCalc += capex;
            } else {
                label = i === 4 ? "Pico de Producción" : "Cosecha Estable";
                prodKg = (2800 * (dens / 7000) * currentFactor.yield) * hectares;
                if (i === 3) prodKg *= 0.4; 
                if (i === 4) prodKg *= 1.0; 
                if (i > 4) prodKg *= 0.85; 
                
                // --- MOTOR DE COSTOS BASADO EN REFERENTE VALLE 2024 ---
                // Calculamos un costo base de operación por hectárea
                const baseOperationalCost = (180 * jVal * currentFactor.costs) * hectares;
                
                // Distribución según Referente CPS 2024
                harvestCost = prodKg * 800; // Recolección física
                fertilizationCost = baseOperationalCost * 0.14;
                arvensesCost = baseOperationalCost * 0.11;
                fitosanitaryCost = baseOperationalCost * 0.07;
                adminCost = baseOperationalCost * 0.07;
                beneficioCost = baseOperationalCost * 0.04;
                if (i >= 5) renovationReserve = (prodKg * pKg) * 0.08; // Referente Renovación 8%
            }

            const income = prodKg * pKg;
            /**
             * Fix: Explicitly calculate opex to resolve detailed reporting needs in reportService
             */
            const opex = harvestCost + fertilizationCost + arvensesCost + fitosanitaryCost + adminCost + beneficioCost + renovationReserve;
            const expenses = capex + opex;
            const net = income - expenses;

            // Simulación de Liquidez Mensual
            for (let m = 1; m <= 12; m++) {
                const monthlyExpense = (expenses - harvestCost) / 12 + (harvestCost / 4 && (m >= 10 || m <= 11) ? harvestCost/2 : 0);
                const monthlyIncome = (income / 2) && (m === 10 || m === 11) ? income / 2 : 0;
                cumulative += (monthlyIncome - monthlyExpense);
                if (cumulative < 0 && firstMonthCrisis === null) firstMonthCrisis = (i - 1) * 12 + m;
            }

            if (cumulative < 0) isYearlyCrisis = true;
            if (paybackYear === null && cumulative >= initCap && i > 2) paybackYear = i;

            /**
             * Fix: Included 'opex' and ensured 'debtService' is allowed by SimulationYear interface
             */
            yearlyData.push({
                year: i,
                totalProductionKg: prodKg,
                totalIncome: income,
                totalExpenses: expenses,
                netCashFlow: net,
                cumulativeFlow: cumulative,
                label,
                harvestCost,
                fertilizationCost,
                arvensesCost,
                renovationReserve,
                fitosanitaryCost,
                adminCost,
                beneficioCost,
                capex,
                opex,
                pricePerKg: pKg,
                isLiquidityCrisis: isYearlyCrisis,
                debtService: 0
            });
        }

        const vpn = yearlyData.reduce((acc, y) => acc + (y.netCashFlow / Math.pow(1.12, y.year)), 0);

        return {
            hectares,
            yearlyData,
            vpn,
            paybackYear,
            roi: (vpn / (totalCapexCalc || 1)) * 100,
            totalCapex: totalCapexCalc,
            firstMonthCrisis,
            initCap
        };
    }, [numTrees, density, marketPrice, jornalValue, initialCapital, scenario]);

    const handleExport = () => {
        generateSimulationPDF(simulation, {
            varietyLabel: `Café (${scenario})`,
            techLabel: "Tecnificado Valle 2024",
            numTrees: parseNumberInput(numTrees),
            density: parseNumberInput(density),
            marketPrice: marketPrice.toString(),
            harvestCostKg: "800",
            qualityFactor: 94
        });
    };

    return (
        <div className="space-y-6 pb-40 animate-fade-in">
            <div className="bg-slate-900 p-2 rounded-[2rem] border border-slate-800 flex gap-1 shadow-lg">
                {(['Pessimistic', 'Realistic', 'Optimistic'] as ScenarioType[]).map((s) => (
                    <button key={s} onClick={() => setScenario(s)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${scenario === s ? (s === 'Pessimistic' ? 'bg-red-600 text-white' : s === 'Optimistic' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white') : 'text-slate-500 hover:text-slate-300'}`}>
                        {s === 'Pessimistic' && <TrendingDown className="w-3 h-3" />}
                        {s === 'Realistic' && <BarChart className="w-3 h-3" />}
                        {s === 'Optimistic' && <TrendingUp className="w-3 h-3" />}
                        {s === 'Pessimistic' ? 'Pesimista' : s === 'Realistic' ? 'Realista' : 'Optimista'}
                    </button>
                ))}
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Calculator className="w-8 h-8 text-white" /></div>
                    <div>
                        <h2 className="text-white font-black text-2xl uppercase tracking-tighter italic">Proyección Financiera 2024</h2>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Referente Valle del Cauca - CPS</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500" /> Árboles a Sembrar</label>
                        <input type="text" value={formatNumberInput(numTrees)} onChange={e => setNumTrees(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 rounded-3xl p-6 text-4xl font-black text-white font-mono transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-2 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500" /> Densidad (árb/Ha)</label>
                        <input type="text" value={formatNumberInput(density)} onChange={e => setDensity(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500 rounded-3xl p-6 text-4xl font-black text-white font-mono transition-all outline-none" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/50">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2"><Landmark className="w-4 h-4 text-amber-500" /> Capital de Trabajo Inicial ($)</label>
                        <input type="text" value={formatNumberInput(initialCapital)} onChange={e => setInitialCapital(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-lg font-black text-amber-500 font-mono outline-none" />
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase">Área Requerida</p>
                            <p className="text-2xl font-black text-emerald-500 font-mono">{simulation.hectares.toFixed(2)} <span className="text-xs">Ha</span></p>
                        </div>
                        <Map className="w-10 h-10 text-slate-700" />
                    </div>
                </div>
            </div>

            {simulation.firstMonthCrisis && (
                <div className="bg-red-950/30 border-2 border-red-500/50 p-6 rounded-[2.5rem] flex gap-5 items-center animate-shake shadow-2xl">
                    <div className="p-4 bg-red-600 rounded-2xl shadow-lg"><ShieldAlert className="w-10 h-10 text-white" /></div>
                    <div>
                        <h4 className="text-red-500 font-black text-lg uppercase tracking-tight">Alerta de Iliquidez</h4>
                        <p className="text-xs text-slate-300 leading-tight">Tu capital se agota en el <strong>Mes {simulation.firstMonthCrisis}</strong>. Requieres flujo adicional antes de la primera gran cosecha.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-6 rounded-[2.5rem] shadow-xl text-white text-center transition-colors ${simulation.vpn > 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    <p className="text-[10px] font-black uppercase mb-1 opacity-80">Valor Presente (VPN)</p>
                    <p className="text-2xl font-black font-mono leading-none mb-1">{formatCurrency(simulation.vpn)}</p>
                    <p className="text-[8px] font-bold uppercase">{simulation.vpn > 0 ? 'Proyecto RENTABLE' : 'Proyecto NO VIABLE'}</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Payback</p>
                    <p className="text-2xl font-black text-white">Año {simulation.paybackYear || '-'}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">Retorno Capital</p>
                </div>
                <button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-500 p-6 rounded-[2.5rem] shadow-xl text-white flex flex-col items-center justify-center transition-all active:scale-95">
                    <FileDown className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-black uppercase">Reporte Benchmark</span>
                </button>
            </div>

            <div className="space-y-4">
                <h3 className="text-white font-black text-sm uppercase flex items-center gap-3 px-4 tracking-widest"><Clock className="w-5 h-5 text-indigo-400" /> Flujo Anualizado (Estructura Valle 2024)</h3>
                <div className="space-y-3">
                    {simulation.yearlyData.map(y => {
                        const isProfit = y.netCashFlow >= 0;
                        const isExpanded = expandedYear === y.year;
                        return (
                            <div key={y.year} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border transition-all overflow-hidden ${y.isLiquidityCrisis ? 'border-red-500/50 shadow-red-900/20' : isExpanded ? 'ring-2 ring-emerald-500 shadow-2xl' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                                <button onClick={() => setExpandedYear(isExpanded ? null : y.year)} className="w-full text-left p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg transition-transform ${isExpanded ? 'scale-110 bg-emerald-500' : isProfit ? 'bg-emerald-600' : 'bg-slate-700'}`}>{y.year}</div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase italic flex items-center gap-2">{y.label}{isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">Click para ver estructura técnica</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-2xl font-black font-mono leading-none ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>{isProfit ? '+' : ''}{formatCurrency(y.netCashFlow)}</p>
                                        <p className={`text-[9px] font-black uppercase mt-1 ${y.isLiquidityCrisis ? 'text-red-500' : 'text-slate-500'}`}>{y.isLiquidityCrisis ? 'ALERTA DE CAJA' : 'Caja Neta Anual'}</p>
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-2 bg-slate-50 dark:bg-slate-950/50 animate-fade-in-down">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><Plus className="w-3 h-3"/> Desglose de Ingresos</h4>
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Producción CPS:</span><span className="font-bold text-slate-800 dark:text-white">{Math.round(y.totalProductionKg).toLocaleString()} Kg</span></div>
                                                    <div className="flex justify-between text-sm"><span className="font-black text-slate-400">TOTAL BRUTO:</span><span className="font-black text-emerald-500">{formatCurrency(y.totalIncome)}</span></div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><Minus className="w-3 h-3"/> Desglose Costos (Referente Valle)</h4>
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                                                    {y.harvestCost > 0 && <div className="flex justify-between text-[10px]"><span className="text-slate-500 font-bold">Recolección (49%):</span><span className="font-bold text-red-500">-{formatCurrency(y.harvestCost)}</span></div>}
                                                    {y.fertilizationCost > 0 && <div className="flex justify-between text-[10px]"><span className="text-slate-500">Fertilización (14%):</span><span className="font-bold text-red-500">-{formatCurrency(y.fertilizationCost)}</span></div>}
                                                    {y.arvensesCost > 0 && <div className="flex justify-between text-[10px]"><span className="text-slate-500">Arvenses (11%):</span><span className="font-bold text-red-500">-{formatCurrency(y.arvensesCost)}</span></div>}
                                                    {y.renovationReserve > 0 && <div className="flex justify-between text-[10px]"><span className="text-slate-500">Renovación (8%):</span><span className="font-bold text-red-500">-{formatCurrency(y.renovationReserve)}</span></div>}
                                                    {y.fitosanitaryCost > 0 && <div className="flex justify-between text-[10px]"><span className="text-slate-500">Fitosanitario (7%):</span><span className="font-bold text-red-500">-{formatCurrency(y.fitosanitaryCost)}</span></div>}
                                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                                                    <div className="flex justify-between text-sm"><span className="font-black text-slate-400">TOTAL COSTOS:</span><span className="font-black text-red-500">{formatCurrency(y.totalExpenses)}</span></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`mt-4 p-4 rounded-2xl border text-center ${y.isLiquidityCrisis ? 'bg-red-900/10 border-red-500/30' : 'bg-indigo-900/10 border-indigo-500/10'}`}>
                                            <p className={`text-[10px] font-bold uppercase italic ${y.isLiquidityCrisis ? 'text-red-400' : 'text-indigo-400'}`}>* Saldo disponible al final de este año: {formatCurrency(y.cumulativeFlow)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-indigo-950/20 p-8 rounded-[3rem] border border-indigo-500/20 text-center">
                <Info className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <p className="text-xs text-indigo-200/70 italic leading-relaxed">Esta simulación utiliza algoritmos de proyección basados en el **Referente Técnico CPS Valle del Cauca 2024**. Los costos se distribuyen proporcionalmente para reflejar la realidad económica del sector cafetero. Desarrollado por Lucas Mateo Tabares Franco.</p>
            </div>
        </div>
    );
};
