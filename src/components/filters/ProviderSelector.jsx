import { useMemo } from 'react';

import React from 'react';

export default function ProviderSelector({
  providerOptions,
  providers,
  providerSearch,
  onProviderSearchChange,
  onProviderToggle,
  onProviderRemove,
  loading
}) {
  const filteredProviders = useMemo(() => {
    if (!providerSearch) return providerOptions;
    return providerOptions.filter(p =>
      p.toLowerCase().includes(providerSearch.toLowerCase())
    );
  }, [providerOptions, providerSearch]);

  if (loading) {
    return (
      <div className="filter-group">
        <label>
          Streaming Providers
          <div className="loading-spinner">
            <sl-spinner></sl-spinner>
          </div>
        </label>
      </div>
    );
  }

  return (
    <div className="filter-group">
      <label>
        Streaming Providers
        <div className="multi-select">
          <input
            type="text"
            placeholder="Search providers"
            value={providerSearch}
            onChange={(e) => onProviderSearchChange(e.target.value)}
          />
          <div className="selected-tags">
            {providers.map(provider => (
              <sl-tag
                key={provider}
                size="small"
                removable
                onSlRemove={() => onProviderRemove(provider)}
              >
                {provider}
              </sl-tag>
            ))}
          </div>
          <div className="options">
            {filteredProviders.map(provider => (
              <label key={provider}>
                <input
                  type="checkbox"
                  checked={providers.includes(provider)}
                  onChange={() => onProviderToggle(provider)}
                />
                {provider}
              </label>
            ))}
          </div>
        </div>
      </label>
    </div>
  );
}
