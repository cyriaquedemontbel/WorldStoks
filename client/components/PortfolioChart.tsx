import React, { useState, useMemo, useRef, useCallback } from 'react';
import { User, Stock } from '../types';

interface ChartPoint {
    date: Date;
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
    const formattedPrice = point.price.toLocaleString('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedDate = point.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="chart-tooltip" style={{ left: clientX, top: clientY }}>
            <div className="chart-tooltip__price">{formattedPrice}</div>
            <div className="chart-tooltip__date">{formattedDate}</div>
        </div>
    );
};

export const PortfolioChart = ({ user, stocks }: { user: User, stocks: Stock[] }) => {
    const [timeframe, setTimeframe] = useState<Timeframe>('1M');
    const [hoveredData, setHoveredData] = useState<{ point: ChartPoint, svgX: number, svgY: number, clientX: number, clientY: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const color = 'var(--primary)';
    const gradientId = `portfolioChartGradient-${timeframe}`;

    const dataPoints = useMemo(() => {
        const daysToFilter = TIMEFRAME_DAYS[timeframe];
        
        const userHoldings = Object.entries(user.portfolio)
            .map(([ticker, quantity]) => {
                const stockData = stocks.find(s => s.ticker === ticker);
                return (stockData && quantity > 0) ? { ...stockData, quantity } : null;
            })
            .filter((holding): holding is (Stock & { quantity: number }) => holding !== null);
            
        if (userHoldings.length === 0) return [];

        const now = new Date();
        const startDate = new Date();
         if (isFinite(daysToFilter)) {
            startDate.setDate(now.getDate() - daysToFilter);
        }

        const allHistories = userHoldings.map(holding => ({
            quantity: holding.quantity,
            history: isFinite(daysToFilter)
                ? holding.history.filter(point => point.date >= startDate.getTime())
                : holding.history
        }));

        if (allHistories.some(h => h.history.length === 0)) return [];
        
        // Use the first stock's timeline as the reference
        const referenceHistory = allHistories[0].history;
        
        const portfolioHistory: ChartPoint[] = referenceHistory.map((refPoint, index) => {
            let totalValue = 0;
            
            allHistories.forEach(h => {
                // Find the closest point in time, or assume synchronized histories
                // For this simulation, we'll assume synchronized indices is good enough.
                const point = h.history[index];
                if (point) {
                    totalValue += point.price * h.quantity;
                }
            });

            return { date: new Date(refPoint.date), price: totalValue };
        });
        
        return portfolioHistory;

    }, [user.portfolio, stocks, timeframe]);

    const { pathData, areaPathData, maxValue, minValue } = useMemo(() => {
        if (dataPoints.length < 2) return { pathData: 'M 0,50 L 100,50', areaPathData: 'M 0,50 L 100,50 V 100 H 0 Z', maxValue: 0, minValue: 0 };
        
        const max = Math.max(...dataPoints.map(p => p.price));
        const min = Math.min(...dataPoints.map(p => p.price));
        const range = max - min;
        
        const buildPath = (points: ChartPoint[]) => {
            if (range === 0) return `M 0,50 L 100,50`;
            return points
                .map((p, i) => {
                    const x = (i / (points.length - 1)) * 100;
                    const y = 100 - ((p.price - min) / range) * 90 - 5;
                    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
                })
                .join(' ');
        };

        const path = buildPath(dataPoints);
        return { pathData: path, areaPathData: `${path} V 100 H 0 Z`, maxValue: max, minValue: min };
    }, [dataPoints]);

    const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || dataPoints.length === 0) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const width = rect.width;
        
        const index = Math.min(
            dataPoints.length - 1,
            Math.max(0, Math.round((offsetX / width) * (dataPoints.length - 1)))
        );
        
        const point = dataPoints[index];
        const range = maxValue - minValue;
        
        const svgX = (index / (dataPoints.length - 1)) * 100;
        const svgY = range === 0 ? 50 : 100 - ((point.price - minValue) / range) * 90 - 5;

        setHoveredData({ point, svgX, svgY, clientX: event.clientX, clientY: event.clientY });
    }, [dataPoints, maxValue, minValue]);

    const handleMouseLeave = useCallback(() => {
        setHoveredData(null);
    }, []);

    const userHasHoldings = Object.values(user.portfolio).some(qty => qty > 0);
    if (!userHasHoldings) {
        return null; // Don't render the chart if the portfolio is empty
    }

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
                        <path d={pathData} fill="none" stroke={color} strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round" />
                        {hoveredData && (
                            <>
                                <line x1={hoveredData.svgX} y1="0" x2={hoveredData.svgX} y2="100" stroke={color} strokeWidth="0.2" strokeDasharray="2 2" />
                                <circle cx={hoveredData.svgX} cy={hoveredData.svgY} r="1.5" fill={color} stroke="var(--background-dark)" strokeWidth="0.5" />
                            </>
                        )}
                    </svg>
                </div>
                <div className="chart-timeframes">
                    {(['1S', '1M', '1A', 'Max'] as Timeframe[]).map(tf => (
                        <button key={tf} onClick={() => setTimeframe(tf)} className={timeframe === tf ? 'active' : ''}>
                            {tf}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};