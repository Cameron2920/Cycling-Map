import React, {useState, useEffect, useRef} from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Place } from "@/files/lib/MapBox";

type Props = {
  startPlace: Place | null;
  endPlace: Place | null;
  onSelectStart: (place: Place) => void;
  onSelectEnd: (place: Place) => void;
  setPickingFromMap: (value: string) => void;
  pickingFromMap:string;
  onSwap: () => void;
  onSearch: (query: string) => Promise<Place[]>;
};

export default function StartEndSearch({
                                         startPlace,
                                         endPlace,
                                         pickingFromMap,
                                         setPickingFromMap,
                                         onSelectStart,
                                         onSelectEnd,
                                         onSwap,
                                         onSearch,
                                       }: Props) {
  const [searchMode, setSearchMode] = useState<"start" | "end" | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if(query.length > 0){
        onSearch(query).then(results => {
          setResults(results);
        });
      }
    }, 300);
  }, [query]);

  useEffect(() => {
    if (searchMode && inputRef.current) {
      console.log("focusing text input", inputRef.current != null);

      setTimeout(() => {
        console.log("Focus!")
        inputRef.current?.focus();
      }, 300);
    }
  }, [searchMode]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSelect = (place: Place) => {
    if (searchMode === "start") {
      onSelectStart(place);
    } else if (searchMode === "end") {
      onSelectEnd(place);
    }
    setSearchMode(null);
    setQuery("");
    setResults([]);
  };

  const handleChooseOnMap = () => {
    if (searchMode) {
      setPickingFromMap(searchMode);
      setSearchMode(null);
      setQuery("");
      setResults([]);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.inputBox} onPress={() => setSearchMode("start")}>
        <Text style={styles.inputText}>{startPlace?.name || "Choose starting point"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.swapButton} onPress={onSwap}>
        <Ionicons name="swap-vertical" size={20} color="#007AFF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.inputBox} onPress={() => setSearchMode("end")}>
        <Text style={styles.inputText}>{endPlace?.name || "Choose destination"}</Text>
      </TouchableOpacity>

      <Modal visible={searchMode !== null} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            ref={inputRef}
            style={styles.modalInput}
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${searchMode === "start" ? "start" : "destination"}...`}
          />
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity style={styles.chooseOnMap} onPress={handleChooseOnMap}>
                <Text style={styles.chooseOnMapText}>📍 Choose on map</Text>
              </TouchableOpacity>
            }
          />
          <TouchableOpacity onPress={() => setSearchMode(null)} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 5,
    margin: 10,
  },
  inputBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  inputText: {
    color: "#333",
  },
  swapButton: {
    alignSelf: "center",
    marginVertical: 6,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  modalInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  cancelButton: {
    marginTop: 10,
    alignSelf: "center",
  },
  cancelText: {
    color: "#007AFF",
  },
  chooseOnMap: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  chooseOnMapText: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
