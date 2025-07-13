import React, {useState, useEffect, useRef} from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Place } from "@/files/lib/MapBox";

export type SearchMode = { type: "waypoint" | "start" | "end", index?: number };

type Props = {
  startPlace: Place | null;
  endPlace: Place | null;
  waypoints: Place[];
  onSelectStart: (place: Place) => void;
  onSelectEnd: (place: Place) => void;
  onAddWaypoint: (place: Place) => void;
  onRemoveWaypoint: (index: number) => void;
  onChangeWaypoint: (place: Place, index: number) => void;
  setSearchMode: (value: SearchMode | null) => void;
  searchMode: SearchMode | null;
  onSwap: () => void;
  onSearch: (query: string) => Promise<Place[]>;
};

export default function StartEndSearch({
                                         startPlace,
                                         endPlace,
                                         waypoints,
                                         searchMode,
                                         setSearchMode,
                                         onSelectStart,
                                         onSelectEnd,
                                         onAddWaypoint,
                                         onRemoveWaypoint,
                                         onChangeWaypoint,
                                         onSwap,
                                         onSearch,
                                       }: Props) {
  const [expandSearchBar, setExpandSearchBar] = useState<boolean>(false);
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
    if (searchMode?.type === "start") {
      onSelectStart(place);
    } else if (searchMode?.type === "end") {
      onSelectEnd(place);
    } else if (searchMode?.type === "waypoint") {
      if (searchMode?.index < waypoints.length) {
        onChangeWaypoint(place, searchMode.index);
      } else {
        onAddWaypoint(place);
      }
    }
    setExpandSearchBar(false);
    setQuery("");
    setResults([]);
  };

  const handleChooseOnMap = () => {
    if (searchMode) {
      console.log("onChooseOnMap", searchMode);
      setSearchMode(searchMode);
      setExpandSearchBar(false);
      setQuery("");
      setResults([]);
    }
  };

  const placeLabel = (place:Place|null) => {
    let returnValue = null;

    if(place?.name){
      returnValue = place.name;
    }
    else if(place?.center){
      returnValue = `${place.center[0]},${place.center[1]}`;
    }
    return returnValue;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.inputBox} onPress={() => {
        setSearchMode({type: "start"})
        setExpandSearchBar(true);
      }}>
        <Text style={styles.inputText}>{placeLabel(startPlace) || "Choose starting point"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.swapButton} onPress={onSwap}>
        <Ionicons name="swap-vertical" size={20} color="#007AFF" />
      </TouchableOpacity>

      {waypoints.map((place, index) => (
        <TouchableOpacity
          key={index}
          style={styles.inputBox}
          onPress={() => {
            setSearchMode({ type: "waypoint", index });
            setExpandSearchBar(true);
          }}
          onLongPress={() => onRemoveWaypoint(index)}
        >
          <Text style={styles.inputText}>
            {placeLabel(place) || `Waypoint ${index + 1}`} (long press to remove)
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.inputBox, { borderColor: "#007AFF" }]}
        onPress={() => {
          setSearchMode({type: "waypoint", index: waypoints.length})
          setExpandSearchBar(true);
        }}
      >
        <Text style={[styles.inputText, { color: "#007AFF" }]}>+ Add Waypoint</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.inputBox} onPress={() => {
        setSearchMode({type: "end"});
        setExpandSearchBar(true);
      }}>
        <Text style={styles.inputText}>{placeLabel(endPlace) || "Choose destination"}</Text>
      </TouchableOpacity>

      <Modal visible={expandSearchBar} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            ref={inputRef}
            style={styles.modalInput}
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${searchMode?.type === "start" ? "start" : "destination"}...`}
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
          <TouchableOpacity onPress={() => {
            setSearchMode(null)
            setExpandSearchBar(false);
          }} style={styles.cancelButton}>
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
