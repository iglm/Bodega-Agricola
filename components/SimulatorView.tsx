
import React, { useState, useMemo } from 'react';
import { 
  Calculator, Sprout, TrendingUp, DollarSign, Clock, Layers, Zap, 
  Target, Wallet, FlaskConical, Pickaxe, ArrowRight, 
  ChevronRight, Percent, Scale, Package, Landmark, 
  BarChart3, Lightbulb, Gem, ArrowUpRight, Coffee, Layout, Info, AlertTriangle, Activity, User, Target as TargetIcon, ShieldAlert, TrendingDown, Timer, CheckCircle2, ShieldX, ShieldCheck, Landmark as Bank, CloudRain, TrendingUp as Trend, Coins
} from 'lucide-react';
import { formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';

interface SimulationYear {
    year: number;
    productionPerc: number;
    capex: number;
    opex: number;
    debtService: number; // Nuevo: Pago de intereses y capital
    income: number;
    margin: number;
    netCashFlow: number;
}

export const SimulatorView: React.FC = () => {
    const [cropType, setCropType] = useState<'COFFEE' | 'PLANTAIN'>('COFFEE');
    
    // ENTRADAS BÁSICAS
    const [numTrees, setNumTrees] = useState('10000');
    const [density, setDensity] = useState('7500'); 
    const [marketPrice, setMarketPrice] = useState('1750000'); 
    const [jornalValue, setJornalValue] = useState('70000');

    // CONFIGURACIÓN AVANZADA (Para que sea profesional)
    const [inflation, setInflation] = useState('5'); // % Inflación anual de costos
    const [riskFactor, setRiskFactor] = useState('0'); // % Reducción de cosecha por clima/plagas
    const [includeCredit, setIncludeCredit] = useState(false);
    const [loanAmount, setLoanAmount] = useState('50000000');
    const [interestRate, setInterestRate] = useState('14'); // EA%
    const [loanYears, setLoanYears] = useState('5');

    const simulation = useMemo(() => {
        const totalPlants = parseNumberInput(numTrees) || 1;
        const dens = parseNumberInput(density) || 1;
        const hectares = totalPlants / dens;
        const jVal = parseNumberInput(jornalValue);
        const price = parseNumberInput(marketPrice);
        const infl = (parseNumberInput(inflation) / 100) + 1;
        const risk = 1 - (parseNumberInput(riskFactor) / 100);

        const isCoffee = cropType === 'COFFEE';
        const cycleYears = isCoffee ? 6 : 2; 

        // Lógica de Crédito (Amortización constante a capital)
        const principal = parseNumberInput(loanAmount);
        const rate = parseNumberInput(interestRate) / 100;
        const term = parseNumberInput(loanYears);
        const annualPrincipal = principal / term;

        // Curva de Rendimiento
        const getDensityYieldFactor = (d: number) => {
            if (isCoffee) {
                if (d < 4500) return 0.55;
                if (d < 6500) return 0.90;
                if (d <= 9500) return 1.15;
                return 0.95;
            } else {
                return d < 2500 ? 1.0 : 1.8;
            }
        };

        const yieldFactor = getDensityYieldFactor(dens);
        const baseYieldPotential = isCoffee ? 19 : 14; 
        const annualMaxYield = baseYieldPotential * yieldFactor * hectares * risk;

        const yearlyData: SimulationYear[] = [];
        let totalNetProfit = 0;
        let cumulativeCashFlow = 0;

        for (let i = 1; i <= cycleYears; i++) {
            // Ajuste por inflación acumulada
            const currentInflFactor = Math.pow(infl, i - 1);
            
            let prodPerc = 0;
            let yearCapex = 0;
            let yearOpex = 0;
            let debtService = 0;

            // Cálculo de deuda
            if (includeCredit && i <= term) {
                const remainingPrincipal = principal - (annualPrincipal * (i - 1));
                const interest = remainingPrincipal * rate;
                debtService = annualPrincipal + interest;
            }

            if (isCoffee) {
                if (i === 1) { yearCapex = (190 * jVal) * hectares * currentInflFactor; prodPerc = 0; }
                else if (i === 2) { yearCapex = (90 * jVal) * hectares * currentInflFactor; prodPerc = 0; }
                else if (i === 3) { yearOpex = (120 * jVal) * hectares * currentInflFactor; prodPerc = 0.45; }
                else { yearOpex = (160 * jVal) * hectares * currentInflFactor; prodPerc = 1.0; }
            } else {
                if (i === 1) { yearCapex = (140 * jVal) * hectares * currentInflFactor; prodPerc = 0.40; }
                else { yearOpex = (120 * jVal) * hectares * currentInflFactor; prodPerc = 1.0; }
            }

            const yearIncome = annualMaxYield * prodPerc * price;
            const yearMargin = yearIncome - (yearCapex + yearOpex);
            const netCashFlow = yearMargin - debtService;
            
            yearlyData.push({ 
                year: i, 
                productionPerc: prodPerc * 100, 
                capex: yearCapex, 
                opex: yearOpex, 
                debtService,
                income: yearIncome, 
                margin: yearMargin,
                netCashFlow
            });
            
            totalNetProfit += yearMargin;
            cumulativeCashFlow += netCashFlow;
        }

        // VPN (Valor Presente Neto) - Tasa de descuento del 12% (Estándar agro)
        const discountRate = 0.12;
        const vpn = yearlyData.reduce((acc, y) => acc + (y.netCashFlow / Math.pow(1 + discountRate, y.year)), includeCredit ? 0 : -parseNumberInput(loanAmount));

        return {
            hectares,
            totalNetProfit,
            cumulativeCashFlow,
            vpn,
            yearlyData,
            cycleYears,
            yieldHaLabel: isCoffee ? `${(annualMaxYield/hectares).toFixed(1)} Cargas/Ha` : `${(annualMaxYield/hectares).toFixed(1)} Ton/Ha`,
            isHealthy: vpn > 0
        };
    }, [cropType, numTrees, density, marketPrice, jornalValue, inflation, riskFactor, includeCredit, loanAmount, interestRate, loanYears]);

    return (
        <div className="space-y-6 pb-28 animate-fade-in">
            {/* CARD DE RESULTADO FINANCIERO MAESTRO */}
            <div className={`bg-slate-900 rounded-[3.5rem] border-4 p-10 shadow-2xl relative overflow-hidden transition-all duration-700 ${simulation.isHealthy ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-5"><Landmark className="w-64 h-64 text-white" /></div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div className="space-y-4">
                        <div className={`px-4 py-1.5 rounded-full inline-flex items-center gap-2 border ${simulation.isHealthy ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                            {simulation.isHealthy ? <ShieldCheck className="w-4 h-4" /> : <ShieldX className="w-4 h-4" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{simulation.isHealthy ? 'Viabilidad Financiera Alta' : 'Proyecto con Riesgo de Valor'}</span>
                        </div>
                        <h2 className="text-white font-black text-5xl tracking-tighter leading-none">Simulador <br/><span className="text-emerald-500 text-3xl">Empresarial 360</span></h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
                                <p className="text-[9px] text-slate-500 font-black uppercase">VPN (Tasa 12%)</p>
                                <p className={`text-xl font-black font-mono ${simulation.vpn > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(simulation.vpn)}</p>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
                                <p className="text-[9px] text-slate-500 font-black uppercase">Pico Producción</p>
                                <p className="text-xl font-black text-white font-mono">{simulation.yieldHaLabel}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-950/80 p-8 rounded-[3rem] border border-white/10 text-center shadow-2xl">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Utilidad Neta del Ciclo</p>
                        <p className={`text-5xl font-black font-mono tracking-tighter ${simulation.totalNetProfit > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(simulation.totalNetProfit)}</p>
                        <div className="h-px bg-white/10 my-6" />
                        <div className="flex justify-between items-center px-4">
                            <div className="text-left"><p className="text-[8px] text-slate-500 font-black uppercase">Flujo Caja Real</p><p className="text-sm font-black text-indigo-400 font-mono">{formatCurrency(simulation.cumulativeCashFlow)}</p></div>
                            <div className="text-right"><p className="text-[8px] text-slate-500 font-black uppercase">Hectáreas</p><p className="text-sm font-black text-white font-mono">{simulation.hectares.toFixed(2)} Ha</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MÓDULOS DE CONFIGURACIÓN PROFESIONAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Módulo de Producción */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Sprout className="w-5 h-5 text-emerald-500" /> Producción</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setCropType('COFFEE')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${cropType === 'COFFEE' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500'}`}><Coffee className="w-6 h-6"/><span className="text-[10px] font-black uppercase">Café</span></button>
                        <button onClick={() => setCropType('PLANTAIN')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${cropType === 'PLANTAIN' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500'}`}><Layout className="w-6 h-6"/><span className="text-[10px] font-black uppercase">Plátano</span></button>
                    </div>
                    <div className="space-y-4">
                        <div><label className="text-[9px] font-black text-slate-500 uppercase ml-2">Población (Árboles)</label><input type="text" value={formatNumberInput(numTrees)} onChange={e => setNumTrees(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-100 dark:bg-slate-950 border-none rounded-xl p-3 text-lg font-black text-slate-800 dark:text-white" /></div>
                        <div><label className="text-[9px] font-black text-slate-500 uppercase ml-2">Densidad (árb/Ha)</label><input type="text" value={formatNumberInput(density)} onChange={e => setDensity(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-100 dark:bg-slate-950 border-none rounded-xl p-3 text-lg font-black text-indigo-400" /></div>
                    </div>
                </div>

                {/* 2. Módulo de Stress Test y Macro (Nuevo) */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-500" /> Macro & Riesgos</h4>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2"><label className="text-[9px] font-black text-slate-500 uppercase">Inflación Anual Costos</label><span className="text-[10px] font-black text-indigo-500">{inflation}%</span></div>
                            <input type="range" min="0" max="15" value={inflation} onChange={e => setInflation(e.target.value)} className="w-full accent-indigo-500" />
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-3xl border border-amber-200 dark:border-amber-900/30">
                            <div className="flex justify-between mb-2"><label className="text-[9px] font-black text-amber-600 uppercase flex items-center gap-1"><CloudRain className="w-3 h-3"/> Riesgo Climático</label><span className="text-[10px] font-black text-amber-600">{riskFactor}%</span></div>
                            <input type="range" min="0" max="50" value={riskFactor} onChange={e => setRiskFactor(e.target.value)} className="w-full accent-amber-500" />
                            <p className="text-[8px] text-slate-500 mt-2 italic leading-tight">Reduce la producción neta anual por factores externos.</p>
                        </div>
                        <div><label className="text-[9px] font-black text-slate-500 uppercase ml-2">Precio Venta ({cropType === 'COFFEE' ? 'Carga' : 'Kg'})</label><input type="text" value={formatNumberInput(marketPrice)} onChange={e => setMarketPrice(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-100 dark:bg-slate-950 border-none rounded-xl p-3 text-lg font-black text-emerald-600" /></div>
                    </div>
                </div>

                {/* 3. Módulo de Financiamiento (Nuevo) */}
                <div className={`p-8 rounded-[3rem] border transition-all duration-500 shadow-xl space-y-5 ${includeCredit ? 'bg-indigo-600 border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-center">
                        <h4 className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${includeCredit ? 'text-white' : 'text-slate-400'}`}><Bank className="w-5 h-5" /> Crédito Bancario</h4>
                        <button onClick={() => setIncludeCredit(!includeCredit)} className={`w-12 h-6 rounded-full relative transition-all ${includeCredit ? 'bg-indigo-400' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${includeCredit ? 'right-1' : 'left-1'}`} /></button>
                    </div>
                    
                    {includeCredit ? (
                        <div className="space-y-4 animate-fade-in">
                            <div><label className="text-[9px] font-black text-indigo-100 uppercase ml-2">Monto Solicitado</label><input type="text" value={formatNumberInput(loanAmount)} onChange={e => setLoanAmount(parseNumberInput(e.target.value).toString())} className="w-full bg-indigo-700 border-none rounded-xl p-3 text-lg font-black text-white" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] font-black text-indigo-100 uppercase ml-1">Tasa EA%</label><input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full bg-indigo-700 border-none rounded-xl p-3 text-sm font-black text-white" /></div>
                                <div><label className="text-[9px] font-black text-indigo-100 uppercase ml-1">Plazo (Años)</label><input type="number" value={loanYears} onChange={e => setLoanYears(e.target.value)} className="w-full bg-indigo-700 border-none rounded-xl p-3 text-sm font-black text-white" /></div>
                            </div>
                            <div className="bg-indigo-800/50 p-4 rounded-2xl"><p className="text-[8px] text-indigo-200 uppercase font-bold mb-1">Amortización Anual Promedio</p><p className="text-sm font-black text-white font-mono">{formatCurrency((parseNumberInput(loanAmount)/parseNumberInput(loanYears)) + (parseNumberInput(loanAmount) * (parseNumberInput(interestRate)/100)))}</p></div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 text-center"><Bank className="w-12 h-12 mb-2" /><p className="text-[10px] font-black uppercase">Sin Financiamiento</p><p className="text-[8px] font-bold">Activa el crédito para calcular servicio a la deuda.</p></div>
                    )}
                </div>
            </div>

            {/* TABLA DE FLUJO DE CAJA DETALLADA */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[3.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-slate-800 dark:text-white font-black text-xs uppercase flex items-center gap-3 tracking-[0.3em]"><Trend className="w-5 h-5 text-indigo-500" /> Flujo de Caja Anualizado</h3>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full uppercase">Ciclo a {simulation.cycleYears} años</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {simulation.yearlyData.map(y => (
                        <div key={y.year} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Año {y.year}</span>
                                <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase">{y.productionPerc}% Prod</span>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between"><span className="text-[10px] text-slate-500 font-bold">Ingresos</span><span className="text-xs font-black text-emerald-500">{formatCurrency(y.income)}</span></div>
                                <div className="flex justify-between"><span className="text-[10px] text-slate-500 font-bold">Inversión (Capex)</span><span className="text-xs font-black text-red-400">-{formatCurrency(y.capex)}</span></div>
                                <div className="flex justify-between"><span className="text-[10px] text-slate-500 font-bold">Costos (Opex)</span><span className="text-xs font-black text-red-400">-{formatCurrency(y.opex)}</span></div>
                                {y.debtService > 0 && <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2"><span className="text-[10px] text-indigo-400 font-bold">Servicio Deuda</span><span className="text-xs font-black text-indigo-400">-{formatCurrency(y.debtService)}</span></div>}
                            </div>

                            <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase">Caja Neta</span>
                                <span className={`text-sm font-black font-mono ${y.netCashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{y.netCashFlow >= 0 ? '+' : ''}{formatCurrency(y.netCashFlow)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
