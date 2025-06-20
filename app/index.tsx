import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Button, Alert } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';

// TODO: Update key

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function Index() {
  const [query, setQuery] = useState("");
  const [coordinate, setCoordinate] = useState<null | [number, number]>(null); // User's coordinates

  useEffect(() => {
    (async () => {
      // Request user location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required to use the map.");
        return;
      }

      // Get device's current location
      const userLocation = await Location.getCurrentPositionAsync({});
      setCoordinate([userLocation.coords.longitude, userLocation.coords.latitude]);
    })();
  }, []);

  const searchLocation = async () => {
    if (!query) {
      Alert.alert("Error", "Please enter a location to search.");
      return;
    }

    try {
      // Use the Mapbox Geocoding API to fetch the coordinates for the entered query
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const { center } = data.features[0];
        setCoordinate(center); // Update the map's center coordinate
      } else {
        Alert.alert("Error", "Location not found, please try again.");
      }
    } catch (error) {
      console.error("Failed to fetch location:", error);
      Alert.alert("Error", "An error occurred while searching for the location.");
    }
  };

  // Render map only after getting user's current location
  if (!coordinate) {
    return (
      <View style={styles.loadingContainer}>
        <MapboxGL.MapView style={{ flex: 1 }} />
        <View style={styles.loadingMessage}>
          <Button title="Fetching User Location..." disabled />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Mapbox map view */}
      <MapboxGL.MapView style={{ flex: 1 }}>
        <MapboxGL.Camera zoomLevel={13} centerCoordinate={coordinate} />
        <MapboxGL.UserLocation visible={true} />
      </MapboxGL.MapView>

      {/* Search bar container */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location"
          value={query}
          onChangeText={setQuery}
        />
        <Button title="Search" onPress={searchLocation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    elevation: 5, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMessage: {
    position: "absolute",
    bottom: 20,
  },
});
