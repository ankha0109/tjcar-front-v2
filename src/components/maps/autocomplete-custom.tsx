import React, { FormEvent, useCallback, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useAutocompleteSuggestions } from "./hooks/use-autocomplete-suggestions";
import { AutoComplete, Input } from "antd";

interface Props {
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
}

export const AutocompleteCustom = ({ onPlaceSelect }: Props) => {
  const places = useMapsLibrary("places");

  const [inputValue, setInputValue] = useState<string>("");
  const { suggestions, resetSession } = useAutocompleteSuggestions(inputValue);

  const handleInput = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSuggestionClick = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!places) return;
      if (!suggestion.placePrediction) return;

      const place = suggestion.placePrediction.toPlace();

      await place.fetchFields({
        fields: [
          "viewport",
          "location",
          "svgIconMaskURI",
          "iconBackgroundColor",
        ],
      });

      setInputValue("");

      // calling fetchFields invalidates the session-token, so we now have to call
      // resetSession() so a new one gets created for further search
      resetSession();

      onPlaceSelect(place);
    },
    [places, onPlaceSelect]
  );

  return (
    <div className="m-4">
      <AutoComplete
        value={inputValue}
        onChange={(value) => handleInput(value)}
        placeholder="Хайлт хийх"
        options={suggestions.map((suggestion) => ({
          label: suggestion.placePrediction?.text.text,
          value: suggestion.placePrediction?.placeId,
        }))}
        onSelect={(value) => {
          const selected = suggestions.find(
            (s) => s.placePrediction?.placeId === value
          );
          if (selected) {
            handleSuggestionClick(selected);
          }
        }}
        style={{ width: 300 }}
      />

      {/* {suggestions.length > 0 && (
        <ul className="custom-list">
          {suggestions.map((suggestion, index) => {
            return (
              <li
                key={index}
                className="custom-list-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.placePrediction?.text.text}
              </li>
            );
          })}
        </ul>
      )} */}
    </div>
  );
};
