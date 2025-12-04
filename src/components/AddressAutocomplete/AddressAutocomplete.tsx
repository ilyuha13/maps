import { useRef, useState } from "react";
import css from "./AddressAutocomplete.module.css";
import {
  type LoadingState,
  type AddressData,
  type DaDataSuggestion,
} from "../../types";
import { useClickOutside } from "../../hooks/useClickOutside";
import { getFormatAddressData } from "../../helpers";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { env } from "../../env.ts";

export const AddressAutocomplete = ({
  onAddressSelect,
}: {
  onAddressSelect: (address: AddressData | null) => void;
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<DaDataSuggestion>>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: "idle",
  });

  const getAutocompleteData = async () => {
    setLoadingState({ status: "loading" });
    try {
      const response = await fetch(env.VITE_DADATA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${env.VITE_DADATA_API_KEY}`,
        },
        body: JSON.stringify({
          query: query,
          count: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Ошибка API: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.suggestions) {
        throw new Error("Некорректный формат ответа API");
      }
      setSuggestions(data.suggestions);
      setShowDropdown(true);
      setLoadingState({ status: "success", data: undefined });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      setLoadingState({ status: "error", error: errorMessage });
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  useClickOutside(wrapperRef, () => setShowDropdown(false));
  const debouncedGetAutocompleteData = useDebouncedCallback(
    getAutocompleteData,
    200
  );

  const inputHandleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);

    if (!value.trim()) {
      setLoadingState({ status: "idle" });
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debouncedGetAutocompleteData();
  };

  const handleSelectAddress = (suggestion: DaDataSuggestion) => {
    setQuery(suggestion.value);
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
    if (onAddressSelect) {
      onAddressSelect(null);
    }
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
        {loadingState.status === "loading" && (
          <div className={css.loadingIndicator}>
            <span className={css.spinner}></span>
          </div>
        )}

        {loadingState.status === "error" && (
          <div className={css.errorMessage}>⚠️ {loadingState.error}</div>
        )}
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
