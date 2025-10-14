import React, { useState, useRef, useCallback, useEffect } from 'react';
import { User, Stock, Transaction } from '../types';

interface ChartPoint {
  date: number;
  value: number;
}

type Timeframe = '1S' | '1M' | '1A' | 'Max';

const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  '1S': 7,
  '1M': 30,
  '1A': 365,
  'Max': Infinity,
};
const Tooltip = ({ data }: { data: { point: ChartPoint; clientX: number; clientY: number } | null }) => {
  if (!data) return null;
  const { point, clientX, clientY } = data;
  const formattedValue = point.value.toLocaleString('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  const formattedDate = new Date(point.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  return (
    <div className="chart-tooltip" style={{ left: clientX, top: clientY }}>
      <div className="chart-tooltip__price">{formattedValue}</div>
      <div className="chart-tooltip__date">{formattedDate}</div>
    </div>
  );
};
interface PortfolioChartProps {
  user: User | null;
  stocks: Stock[];
}

export const PortfolioChart = ({ user, stocks }: PortfolioChartProps) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [hoveredData, setHoveredData] = useState<{ point: ChartPoint; svgX: number; svgY: number; clientX: number; clientY: number } | null>(null);
  const [dataPoints, setDataPoints] = useState<ChartPoint[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const color = 'var(--primary)';
  const gradientId = `portfolioChartGradient-${timeframe}`;

  useEffect(() => {
    if (!user || !stocks.length) {
      setDataPoints([]);
      return;
    }

    const now = Date.now();
    const daysToFilter = TIMEFRAME_DAYS[timeframe];
    const startDate = isFinite(daysToFilter) ? now - daysToFilter * 24 * 60 * 60 * 1000 : 0;

    const portfolio: Record<string, number> = {};
    const points: ChartPoint[] = [];

    // Transactions triées et filtrées
    const txs = (user.transactions ?? [])
      .filter(tx => tx.date >= startDate)
      .sort((a, b) => a.date - b.date);

    txs.forEach((tx, idx) => {
      portfolio[tx.ticker] = (portfolio[tx.ticker] || 0) + tx.quantity;

      // Valeur figée : chaque point = somme des quantités * prix de la transaction pour chaque ticker
      let totalValue = 0;
      Object.entries(portfolio).forEach(([ticker, qty]) => {
        if (qty === 0) return;
        // On cherche la dernière transaction pour ce ticker avant ou à la date courante
        const lastTx = txs.slice(0, idx + 1).reverse().find(t => t.ticker === ticker);
        const price = lastTx ? (lastTx.pricePerShare ?? lastTx.price) : stocks.find(s => s.ticker === ticker)?.price ?? 0;
        totalValue += price * qty;
      });
      points.push({ date: tx.date, value: totalValue });
    });

    // Point final aujourd'hui = valeur actuelle des actions
    let totalValue = 0;
    Object.entries(user.portfolio ?? {}).forEach(([ticker, { quantity }]) => {
      if (quantity === 0) return;
      const stock = stocks.find(s => s.ticker === ticker);
      if (!stock) return;
      totalValue += stock.price * quantity;
    });
    points.push({ date: now, value: totalValue });

    setDataPoints(points);
  }, [user, stocks, timeframe]);

  // Calcul du path SVG
  const { pathData, areaPathData, maxValue, minValue } = (() => {
    if (dataPoints.length < 2) return { pathData: '', areaPathData: '', maxValue: 0, minValue: 0 };
    const max = Math.max(...dataPoints.map(p => p.value));
    const min = Math.min(...dataPoints.map(p => p.value));
    const range = Math.max(max - min, 1);

    const path = dataPoints.map((p, i) => {
      const x = (i / (dataPoints.length - 1)) * 100;
      const y = 100 - ((p.value - min) / range) * 90 - 5;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    return { pathData: path, areaPathData: `${path} V 100 H 0 Z`, maxValue: max, minValue: min };
  })();

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || dataPoints.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const index = Math.min(dataPoints.length - 1, Math.max(0, Math.round((offsetX / rect.width) * (dataPoints.length - 1))));
    const point = dataPoints[index];
    const range = Math.max(maxValue - minValue, 1);
    const svgX = (index / (dataPoints.length - 1)) * 100;
    const svgY = 100 - ((point.value - minValue) / range) * 90 - 5;
    if (!isNaN(svgX) && !isNaN(svgY)) {
      setHoveredData({ point, svgX, svgY, clientX: event.clientX, clientY: event.clientY });
    }
  }, [dataPoints, maxValue, minValue]);

  const handleMouseLeave = useCallback(() => setHoveredData(null), []);

  const userHasHoldings = (!!user?.transactions && user.transactions.length > 0) || (!!user?.portfolio && Object.values(user.portfolio).some(p => p.quantity > 0));
  if (!userHasHoldings) return <p>Aucune action ou transaction pour afficher le graphique.</p>;

  return (
    <div className="portfolio-chart-container">
      <h3>Évolution du Portefeuille</h3>
      <div className="stock-chart-container" ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <Tooltip data={hoveredData} />
        <div className="stock-detail-page__chart" role="img" aria-label={`Graphique de la performance du portefeuille sur ${timeframe}`}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={areaPathData} fill={`url(#${gradientId})`} stroke="none" />
            <path d={pathData} fill="none" stroke={color} strokeWidth={0.5} strokeLinejoin="round" strokeLinecap="round" />

            {dataPoints.map((p, i) => {
              const x = (i / (dataPoints.length - 1)) * 100;
              const y = 100 - ((p.value - minValue) / (maxValue - minValue || 1)) * 90 - 5;
              if (isNaN(x) || isNaN(y)) return null;
              return <circle key={i} cx={x} cy={y} r={0.8} fill={color} stroke="var(--background-dark)" strokeWidth={0.2} />;
            })}

            {hoveredData && (
              <>
                <line x1={hoveredData.svgX} y1={0} x2={hoveredData.svgX} y2={100} stroke={color} strokeWidth={0.2} strokeDasharray="2 2" />
                <circle cx={hoveredData.svgX} cy={hoveredData.svgY} r={1.5} fill={color} stroke="var(--background-dark)" strokeWidth={0.5} />
              </>
            )}
          </svg>
        </div>

        <div className="chart-timeframes">
          {(['1S','1M','1A','Max'] as Timeframe[]).map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} className={timeframe === tf ? 'active' : ''}>{tf}</button>
          ))}
        </div>
      </div>
    </div>
  );
};
