"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import "./PremiumSearch.css";

interface PremiumSearchProps {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function PremiumSearch({ value, onChange, placeholder = "Scan database...", onSearch }: PremiumSearchProps) {
  const [internalQuery, setInternalQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const query = value !== undefined ? value : internalQuery;
  const setQuery = onChange ?? setInternalQuery;

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (!query.trim() || isSearching) return;
    setIsSearching(true);
    if (onSearch) onSearch(query);
    setTimeout(() => setIsSearching(false), 2000);
  };

  return (
    <div className="premium-search-container" data-loading={isSearching}>
      <div className="ps-layer ps-glow" />
      <div className="ps-layer ps-border-bg" />
      <div className="ps-layer ps-border-main" />
      <div className="ps-layer ps-border-white" />

      {isSearching ? (
        <div className="wifi-loader-overlay">
          <div id="wifi-loader">
            <svg className="circle-outer" viewBox="0 0 86 86">
              <circle className="back" cx="43" cy="43" r="40"></circle>
              <circle className="front" cx="43" cy="43" r="40"></circle>
            </svg>
            <svg className="circle-middle" viewBox="0 0 60 60">
              <circle className="back" cx="30" cy="30" r="27"></circle>
              <circle className="front" cx="30" cy="30" r="27"></circle>
            </svg>
            <svg className="circle-inner" viewBox="0 0 34 34">
              <circle className="back" cx="17" cy="17" r="14"></circle>
              <circle className="front" cx="17" cy="17" r="14"></circle>
            </svg>
          </div>
        </div>
      ) : (
        <Search className="ps-search-icon w-5 h-5" />
      )}

      <input
        type="text"
        className="premium-search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSearch}
      />

      <button className="ps-filter-btn">
        <SlidersHorizontal className="w-4 h-4 text-on_surface_variant" />
      </button>

      <div className="searching-text" />
    </div>
  );
}
