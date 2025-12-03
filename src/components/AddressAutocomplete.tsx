import { useRef, useState } from "react";
import css from "./AddressAutocomplete.module.css";
import type { AddressData, DaDataSuggestion } from "../types";
import { useClickOutside } from "../hooks/useClickOutside";
import { getFormatAddressData } from "../helpers";
import { DADATA_API_KEY, DADATA_URL } from "../constants";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";

export const AddressAutocomplete = ({
  onAddressSelect,
}: {
  onAddressSelect: (address: AddressData) => void;
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<DaDataSuggestion>>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const getAutocompleteData = async () => {
    const response = await fetch(DADATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${DADATA_API_KEY}`,
      },
      body: JSON.stringify({
        query: query,
        count: 10,
      }),
    });
    const data = await response.json();
    setSuggestions(data.suggestions);
    setShowDropdown(true);
  };

  useClickOutside(wrapperRef, () => setShowDropdown(false));
  const debouncedGetAutocompleteData = useDebouncedCallback(
    getAutocompleteData,
    200
  );

  const inputHandleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);

    try {
      debouncedGetAutocompleteData();
    } catch (error) {
      console.error("Error fetching autocomplete data:", error);
    }
  };

  const handleSelectAddress = (suggestion: DaDataSuggestion) => {
    setQuery(suggestion.value);
    setShowDropdown(false);
    setShowDropdown(false);
    const addressData = getFormatAddressData(suggestion);
    setSuggestions([]);

    if (onAddressSelect) {
      onAddressSelect(addressData);
    }
  };

  const handleClear = (): void => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div className={css.addressAutocomplete}>
      <div ref={wrapperRef} className={css.inputWrapper}>
        <input
          value={query}
          onChange={inputHandleChange}
          className={css.addressInput}
          type="text"
          placeholder="Начните вводить адрес..."
        />
        {query && (
          <button
            onClick={handleClear}
            className={css.clearButton}
            type="button"
          >
            ✕
          </button>
        )}
        {showDropdown && suggestions.length > 0 && (
          <ul className={css.suggestionsDropdown}>
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.data.fias_id}-${index}`}
                onClick={() => handleSelectAddress(suggestion)}
                className={css.suggestionItem}
              >
                <div className={css.suggestionValue}>{suggestion.value}</div>
                {suggestion.data.geo_lat && suggestion.data.geo_lon && (
                  <div className={css.suggestionCoords}>
                    📍 {suggestion.data.geo_lat}, {suggestion.data.geo_lon}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
