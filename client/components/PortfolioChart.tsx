import React, { useState, useMemo, useRef, useCallback } from 'react';
import { User, Stock } from '../types';

interface ChartPoint {
    date: number;
    price: number;
}

type Timeframe = '1S' | '1M' | '1A' | 'Max';

const TIMEFRAME_DAYS: Record<Timeframe, number> = {
    '1S': 7,
    '1M': 30,
    '1A': 365,
    'Max': Infinity,
};

const Tooltip = ({ data }: { data: { point: ChartPoint, clientX: number, clientY: number } | null }) => {
    if (!data) return null;
    const { point, clientX, clientY } = data;
    const formattedPrice = point.price.toLocaleString('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
    const formattedDate = new Date(point.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    return (
        <div className="chart-tooltip" style={{ left: clientX, top: clientY }}>
            <div className="chart-tooltip__price">{formattedPrice}</div>
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
    const [hoveredData, setHoveredData] = useState<{ point: ChartPoint, svgX: number, svgY: number, clientX: number, clientY: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const color = 'var(--primary)';
    const gradientId = `portfolioChartGradient-${timeframe}`;

    const dataPoints = useMemo(() => {
        if (!user?.portfolio || !stocks.length) return [];

        const daysToFilter = TIMEFRAME_DAYS[timeframe];
        const now = Date.now();
        const startDate = isFinite(daysToFilter) ? now - daysToFilter * 24 * 60 * 60 * 1000 : 0;

        const holdings = Object.entries(user.portfolio)
            .map(([ticker, { quantity }]) => {
                if (quantity <= 0) return null;
                const stockData = stocks.find(s => s.ticker === ticker);
                if (!stockData || !stockData.history?.length) return null;
                const filteredHistory = isFinite(daysToFilter)
                    ? stockData.history.filter(p => p.date >= startDate)
                    : stockData.history;
                return { ...stockData, quantity, history: filteredHistory };
            })
            .filter((h): h is Stock & { quantity: number; history: ChartPoint[] } => h !== null && h.history.length > 0);

        if (!holdings.length) return [];

        const referenceHistory = holdings[0].history;
        return referenceHistory.map((refPoint, index) => {
            const totalValue = holdings.reduce((sum, h) => {
                const point = h.history[index];
                return sum + (point?.price ?? 0) * h.quantity;
            }, 0);
            return { date: refPoint.date, price: totalValue };
        });
    }, [user, stocks, timeframe]);

    const { pathData, areaPathData, maxValue, minValue } = useMemo(() => {
        if (dataPoints.length < 2) return { pathData: 'M 0,50 L 100,50', areaPathData: 'M 0,50 L 100,50 V 100 H 0 Z', maxValue: 0, minValue: 0 };
        const max = Math.max(...dataPoints.map(p => p.price));
        const min = Math.min(...dataPoints.map(p => p.price));
        const range = max - min || 1;

        const path = dataPoints.map((p, i) => {
            const x = (i / (dataPoints.length - 1)) * 100;
            const y = 100 - ((p.price - min) / range) * 90 - 5;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ');

        return { pathData: path, areaPathData: `${path} V 100 H 0 Z`, maxValue: max, minValue: min };
    }, [dataPoints]);

    const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || dataPoints.length === 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const index = Math.min(dataPoints.length - 1, Math.max(0, Math.round((offsetX / rect.width) * (dataPoints.length - 1))));
        const point = dataPoints[index];
        const range = maxValue - minValue || 1;
        const svgX = (index / (dataPoints.length - 1)) * 100;
        const svgY = 100 - ((point.price - minValue) / range) * 90 - 5;
        setHoveredData({ point, svgX, svgY, clientX: event.clientX, clientY: event.clientY });
    }, [dataPoints, maxValue, minValue]);

    const handleMouseLeave = useCallback(() => setHoveredData(null), []);

    const userHasHoldings = !!user?.portfolio && Object.values(user.portfolio).some(p => p.quantity > 0);
    if (!userHasHoldings) return <p>Aucune action détenue pour afficher le graphique.</p>;

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
                        {hoveredData && (
                            <>
                                <line x1={hoveredData.svgX} y1="0" x2={hoveredData.svgX} y2="100" stroke={color} strokeWidth={0.2} strokeDasharray="2 2" />
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
