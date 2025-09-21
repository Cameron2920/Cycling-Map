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

  const addWaypoint = () => {
    setSearchMode({type: "waypoint", index: waypoints.length})
    setExpandSearchBar(true);
  }

  return (
    <View style={styles.container}>
      {/* Start */}
      <View style={styles.row}>
        <Ionicons name="ellipse-outline" size={18} color="#007AFF" style={styles.iconLeft} />
        <TouchableOpacity
          style={styles.searchField}
          onPress={() => {
            setSearchMode({ type: "start" });
            setExpandSearchBar(true);
          }}
        >
          <Text style={styles.searchText}>
            {placeLabel(startPlace) || "Choose starting point"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onSwap}>
          <Ionicons name="swap-vertical" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Waypoints */}
      {waypoints.map((place, index) => (
        <View key={index} style={styles.row}>
          <Ionicons name="stop-outline" size={18} color="#888" style={styles.iconLeft} />
          <TouchableOpacity
            style={styles.searchField}
            onPress={() => {
              setSearchMode({ type: "waypoint", index });
              setExpandSearchBar(true);
            }}
          >
            <Text style={styles.searchText}>
              {placeLabel(place) || `Waypoint ${index + 1}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => onRemoveWaypoint(index)}>
            <Ionicons name="close" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Destination */}
      <View style={styles.row}>
        <Ionicons name="flag-outline" size={18} color="#FF3B30" style={styles.iconLeft} />
        <TouchableOpacity
          style={styles.searchField}
          onPress={() => {
            setSearchMode({ type: "end" });
            setExpandSearchBar(true);
          }}
        >
          <Text style={styles.searchText}>
            {placeLabel(endPlace) || "Choose destination"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={addWaypoint}>
          <Ionicons name="add-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={expandSearchBar} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.searchHeader}>
            <Ionicons name="search-outline" size={20} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              ref={inputRef}
              style={styles.modalInput}
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${searchMode?.type}...`}
            />
            <TouchableOpacity
              onPress={() => {
                setSearchMode(null);
                setExpandSearchBar(false);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelect(item)}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.chooseOnMap}
                onPress={handleChooseOnMap}
              >
                <Text style={styles.chooseOnMapText}>📍 Choose on map</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 4,
    margin: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  searchField: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  searchText: {
    color: "#333",
  },
  iconButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f2f2f2",
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
  },
  resultItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  cancelText: {
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 10,
  },
  chooseOnMap: {
    margin: 16,
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

