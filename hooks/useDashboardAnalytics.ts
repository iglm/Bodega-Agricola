
import { useMemo } from 'react';
import { InventoryItem, CostCenter, Movement } from '../types';
import { getStorageUsage } from '../services/imageService';

export interface RenovationAnalysis {
  totalHa: number;
  renovationHa: number;
  productionHa: number;
  renovationPct: number;
  status: 'CRITICAL' | 'OPTIMAL' | 'GROWTH';
  message: string;
  colorClass: string;
  bgClass: string;
}

export interface InventoryAnalytics {
  totalValue: number;
  lowStockCount: number;
  abcMap: Record<string, 'A' | 'B' | 'C'>;
  idleCapitalValue: number;
}

export interface StorageUsage {
  used: number;
  percent: number;
}

export const useDashboardAnalytics = (
  inventory: InventoryItem[],
  costCenters: CostCenter[],
  movements: Movement[]
) => {
  
  // 1. Storage Calculation
  const storage: StorageUsage = useMemo(() => getStorageUsage(), []);

  // 2. Renovation Cycle Analysis (Agronomic Health)
  const renovationAnalysis: RenovationAnalysis = useMemo(() => {
    const totalHa = costCenters.reduce((sum, c) => sum + (c.area || 0), 0);
    const renovationHa = costCenters
      .filter(c => c.stage === 'Levante')
      .reduce((sum, c) => sum + (c.area || 0), 0);
    const productionHa = totalHa - renovationHa;
    const renovationPct = totalHa > 0 ? (renovationHa / totalHa) * 100 : 0;

    let status: 'CRITICAL' | 'OPTIMAL' | 'GROWTH' = 'OPTIMAL';
    let message = "Ciclo saludable.";
    let colorClass = "text-emerald-500";
    let bgClass = "bg-emerald-500";

    if (renovationPct < 10) {
      status = 'CRITICAL';
      message = "Alerta: Cafetal envejecido. Riesgo.";
      colorClass = "text-red-500";
      bgClass = "bg-red-500";
    } else if (renovationPct > 20) {
      status = 'GROWTH';
      message = "Fase de alta inversión.";
      colorClass = "text-indigo-400";
      bgClass = "bg-indigo-500";
    } else {
      message = "Renovación sostenible.";
    }

    return { totalHa, renovationHa, productionHa, renovationPct, status, message, colorClass, bgClass };
  }, [costCenters]);

  // 3. Inventory Intelligence (ABC & Idle Capital)
  const inventoryAnalytics: InventoryAnalytics = useMemo(() => {
    const totalValue = inventory.reduce((acc, item) => acc + (item.currentQuantity * item.averageCost), 0);
    const lowStockCount = inventory.filter(i => i.minStock && i.currentQuantity <= i.minStock).length;

    // A. ABC Classification
    const sortedByValue = [...inventory]
      .map(item => ({ ...item, stockValue: item.currentQuantity * item.averageCost }))
      .sort((a, b) => b.stockValue - a.stockValue);

    let accumulatedValue = 0;
    const abcMap: Record<string, 'A' | 'B' | 'C'> = {};

    sortedByValue.forEach(item => {
      accumulatedValue += item.stockValue;
      const percent = (accumulatedValue / (totalValue || 1)) * 100;
      if (percent <= 80) abcMap[item.id] = 'A';
      else if (percent <= 95) abcMap[item.id] = 'B';
      else abcMap[item.id] = 'C';
    });

    // B. Idle Capital (> 45 days without output)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 45);

    let idleCapitalValue = 0;
    inventory.forEach(item => {
      const lastOut = movements
        .filter(m => m.itemId === item.id && m.type === 'OUT')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (item.currentQuantity > 0) {
        if (!lastOut || new Date(lastOut.date) < thresholdDate) {
          idleCapitalValue += (item.currentQuantity * item.averageCost);
        }
      }
    });

    return { totalValue, lowStockCount, abcMap, idleCapitalValue };
  }, [inventory, movements]);

  return {
    storage,
    renovationAnalysis,
    inventoryAnalytics
  };
};
