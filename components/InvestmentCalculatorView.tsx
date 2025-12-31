
import React, { useState } from 'react';
// Imported AlertTriangle for the error message icon
import { X, DollarSign, Calculator, Plus, Trash2, Percent, Info, Eraser, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService'; // Reusing formatCurrency

export const InvestmentCalculatorView: React.FC = () => {
  const [initialInvestment, setInitialInvestment] = useState<string>('');
  const [cashFlows, setCashFlows] = useState<string[]>(['', '', '']); // 3 years by default
  const [discountRate, setDiscountRate] = useState<string>('');
  const [npvResult, setNpvResult] = useState<number | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const handleAddCashFlow = () => {
    setCashFlows([...cashFlows, '']);
  };

  const handleRemoveCashFlow = (index: number) => {
    setCashFlows(cashFlows.filter((_, i) => i !== index));
  };

  const handleCashFlowChange = (index: number, value: string) => {
    const newCashFlows = [...cashFlows];
    newCashFlows[index] = value;
    setCashFlows(newCashFlows);
  };

  const handleCalculateNPV = () => {
    setNpvResult(null);
    setCalculationError(null);

    const initialInvNum = parseFloat(initialInvestment);
    if (isNaN(initialInvNum) || initialInvNum <= 0) {
      setCalculationError('La inversión inicial debe ser un número positivo.');
      return;
    }

    const discountRateNum = parseFloat(discountRate);
    if (isNaN(discountRateNum) || discountRateNum <= 0 || discountRateNum > 100) {
      setCalculationError('La tasa de descuento debe ser un porcentaje (0-100).');
      return;
    }
    const r = discountRateNum / 100;

    let currentNpv = -initialInvNum; // Initial investment is an outflow

    const parsedCashFlows = cashFlows.map(cf => parseFloat(cf)).filter(cf => !isNaN(cf));

    if (parsedCashFlows.length === 0) {
        setCalculationError('Debe ingresar al menos un flujo de caja anual.');
        return;
    }

    for (let i = 0; i < parsedCashFlows.length; i++) {
      currentNpv += parsedCashFlows[i] / Math.pow(1 + r, i + 1);
    }

    setNpvResult(currentNpv);
  };

  const handleClear = () => {
    setInitialInvestment('');
    setCashFlows(['', '', '']);
    setDiscountRate('');
    setNpvResult(null);
    setCalculationError(null);
  };

  const getResultColorClass = (npv: number | null) => {
    if (npv === null) return 'text-slate-400';
    if (npv > 0) return 'text-emerald-500';
    if (npv < 0) return 'text-red-500';
    return 'text-blue-500';
  };

  const getResultText = (npv: number | null) => {
    if (npv === null) return 'Ingrese datos para calcular';
    if (npv > 0) return 'Proyecto viable, genera riqueza';
    if (npv < 0) return 'Proyecto no viable, destruye riqueza';
    return 'Proyecto indiferente (VPN = 0)';
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-indigo-600/20 p-2.5 rounded-xl border border-indigo-500/30">
          <Calculator className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-white font-black text-xl">Calculadora de Inversión (VPN)</h3>
          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">Viabilidad de Proyectos a Largo Plazo</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Inversión Inicial */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Inversión Inicial (Salida de Capital)</label>
          <input
            type="number"
            value={initialInvestment}
            onChange={(e) => setInitialInvestment(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ej: 5000000"
            required
          />
        </div>

        {/* Flujos de Caja Anuales */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Flujos de Caja Netos Anuales</label>
          <div className="space-y-2">
            {cashFlows.map((cf, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="text-slate-500 text-sm w-8 shrink-0">Año {index + 1}:</span>
                <input
                  type="number"
                  value={cf}
                  onChange={(e) => handleCashFlowChange(index, e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ej: 1500000"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCashFlow(index)}
                  className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                  title="Eliminar Año"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddCashFlow}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Añadir Año
            </button>
          </div>
        </div>

        {/* Tasa de Descuento */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tasa de Descuento (Riesgo)</label>
          <div className="relative">
            <input
              type="number"
              value={discountRate}
              onChange={(e) => setDiscountRate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pl-10 text-white font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej: 8 (para 8%)"
              min="0"
              max="100"
              required
            />
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>
          <div className="bg-blue-900/10 p-3 rounded-xl border border-blue-500/20 flex items-start gap-3 mt-2 text-[10px] text-slate-400 italic leading-tight">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p>
              Considere la tasa de interés de oportunidad. Puede usar la tasa de créditos de FINAGRO para proyectos agrícolas (ej. 12-18% E.A.) o la tasa de un CDT como alternativa de inversión (ej. 8-10% E.A.).
            </p>
          </div>
        </div>
      </div>

      {calculationError && (
        <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2 uppercase animate-shake">
          <AlertTriangle className="w-4 h-4" /> {calculationError}
        </div>
      )}

      {/* Resultados y Acciones */}
      <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Valor Presente Neto (VPN)</p>
          <p className={`text-3xl font-black font-mono ${getResultColorClass(npvResult)}`}>
            {npvResult !== null ? formatCurrency(npvResult) : '$ 0'}
          </p>
          <p className={`text-xs font-bold mt-2 ${getResultColorClass(npvResult)}`}>
            {getResultText(npvResult)}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCalculateNPV}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/30 active:scale-95"
          >
            <Calculator className="w-5 h-5" /> Calcular VPN
          </button>
          <button
            onClick={handleClear}
            className="p-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors active:scale-95"
            title="Limpiar Calculadora"
          >
            <Eraser className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};