import React, { useEffect, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

type Suggestion = {
  id: string;
  place_name: string;
  center: [number, number];
};

type Props = {
  query: string;
  setQuery: (text: string) => void;
  setSuggestions: (s: Suggestion[]) => void;
  fetchSuggestions: (text: string) => void;
  suggestions: Suggestion[];
  onSuggestionSelect: (center: [number, number], name: string) => void;
};

export default function SearchBar({
                                    query,
                                    setQuery,
                                    fetchSuggestions,
                                    setSuggestions,
                                    suggestions,
                                    onSuggestionSelect,
                                  }: Props) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <View style={styles.searchContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location"
          value={query}
          onChangeText={handleTextChange}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearButton}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() =>
                  onSuggestionSelect(item.center, item.place_name)
                }
              >
                <Text>{item.place_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  clearButton: {
    fontSize: 18,
    color: "#888",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dropdown: {
    backgroundColor: "white",
    borderRadius: 5,
    paddingVertical: 5,
    width: "100%",
    maxHeight: 150,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});
