import React, { useState, useMemo, useEffect, useRef } from "react";
import { StockCard } from "../components/StockCard";
import { Stock, Page, User } from "../types";

interface HomePageProps {
  stocks: Stock[];
  user: User;
  onStockSelect: (ticker: string) => void;
  onNavigate: (page: Page) => void;
  onOpenTradeModal: (stock: Stock, type: "buy" | "sell") => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  stocks,
  user,
  onStockSelect,
  onNavigate,
  onOpenTradeModal,
}) => {
  const [stockList, setStockList] = useState<Stock[]>(stocks);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => setStockList(stocks), [stocks]);


  const filteredStocks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return stockList.filter((stock) => {
      const name = stock?.name?.toLowerCase() ?? "";
      const ticker = stock?.ticker?.toLowerCase() ?? "";
      return name.includes(query) || ticker.includes(query);
    });
  }, [stockList, searchQuery]);

  return (
    <section className="home-page">
      <header className="home-page__header">
        <h1>Le Marché Mondial au Bout des Doigts</h1>
        <p className="intro-text">
          Investissez dans des actions basées sur des équipes, des personnalités et bien plus encore.
        </p>
      </header>

      <div className="search-bar-container">
        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z" />
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
        </div>



        {filteredStocks.length > 0 ? (
          <div className="stock-list">
            {filteredStocks.map((stock) => (
              <React.Fragment key={stock.ticker}>
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
