import React, { useState, useMemo, useEffect, useRef } from "react";
import { StockCard } from "../components/StockCard";
import { Stock, Page, User } from "../types";

interface HomePageProps {
  stocks?: Stock[];
  user: User;
  onStockSelect: (ticker: string) => void;
  onNavigate: (page: Page) => void;
  onOpenTradeModal: (stock: Stock, type: "buy" | "sell") => void;
}

export const HomePage = ({
  stocks = [],
  user,
  onStockSelect,
  onNavigate,
  onOpenTradeModal,
}: HomePageProps) => {
  const [stockList, setStockList] = useState<Stock[]>(stocks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMarketUpdating, setIsMarketUpdating] = useState(false);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);

  const prevIsUpdatingRef = useRef(isMarketUpdating);

  // Confirmation de mise à jour
  useEffect(() => {
    if (prevIsUpdatingRef.current && !isMarketUpdating) {
      setShowUpdateConfirmation(true);
      const timer = setTimeout(() => setShowUpdateConfirmation(false), 2500);
      return () => clearTimeout(timer);
    }
    prevIsUpdatingRef.current = isMarketUpdating;
  }, [isMarketUpdating]);

  // Filtrage des stocks selon la recherche
  const filteredStocks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return stockList.filter((stock) => {
      const name = stock?.name?.toLowerCase() ?? "";
      const ticker = stock?.ticker?.toLowerCase() ?? "";
      return name.includes(query) || ticker.includes(query);
    });
  }, [stockList, searchQuery]);

  // Met à jour le marché uniquement avec les données du backend
  const handleUpdateMarket = async () => {
    try {
      setIsMarketUpdating(true);
      const res = await fetch("http://localhost:5000/api/stocks/update-market", {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const data = await res.json();

      // On met à jour seulement si on reçoit des stocks
      if (Array.isArray(data.stocks)) {
        setStockList(data.stocks);
      }
    } catch (err) {
      console.error("Erreur updateMarket:", err);
    } finally {
      setIsMarketUpdating(false);
    }
  };

  return (
    <section className="home-page">
      <header className="home-page__header">
        <h1>Le Marché Mondial au Bout des Doigts</h1>
        <p className="intro-text">
          Investissez dans des actions basées sur des équipes, des personnalités et bien plus encore.
        </p>
      </header>

      <div className="search-bar-container">
        <svg
          className="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
        </svg>
        <input
          type="search"
          className="search-bar"
          placeholder="Rechercher un marché (ex: PSG, Bitcoin...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Rechercher un marché"
        />
      </div>

      <div className="stock-list-section">
        <div className="home-page__markets-header">
          <h2>Marchés Populaires</h2>
          <div className="home-page__actions">
            {showUpdateConfirmation && <span className="update-confirmation">Marché mis à jour !</span>}
            <button
              className="btn btn--primary"
              onClick={handleUpdateMarket}
              disabled={isMarketUpdating}
            >
              {isMarketUpdating ? "Mise à jour..." : "Actualiser le marché"}
            </button>
          </div>
        </div>

        {isMarketUpdating && !showUpdateConfirmation && (
          <div className="market-update-overlay">
            <div className="loader" role="status">
              <span className="sr-only">Chargement...</span>
            </div>
            <span>Mise à jour du marché...</span>
          </div>
        )}

        {filteredStocks.length > 0 ? (
          <div className="stock-list">
            {filteredStocks.map((stock, index) => (
              <React.Fragment key={stock._id || stock.ticker || index}>
                <StockCard
                  stock={stock}
                  user={user}
                  onStockSelect={onStockSelect}
                  onNavigate={onNavigate}
                  onOpenTradeModal={onOpenTradeModal}
                />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <p className="no-results">Aucun marché ne correspond à votre recherche.</p>
        )}
      </div>
    </section>
  );
};
