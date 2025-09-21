import React, {useState, useEffect, useRef} from "react";
import {
  View,
  StyleSheet,
  Text, Alert,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { MAPBOX_ACCESS_TOKEN } from '@env';
import {SafeAreaView} from 'react-native-safe-area-context';
import useCurrentLocation from "@/files/hooks/UseCurrentLocation";
import {
  calculatePathDistance,
  isOnStepPath,
  LatLng, Place
} from "@/files/lib/MapBox";
import MapViewComponent from "@/files/components/MapView";
import NavigationPanel from "@/files/components/NavigationPanel";
import * as Location from "expo-location";
import { Accuracy } from "expo-location";
import * as Speech from 'expo-speech';
import {useDirections} from "@/files/hooks/useDirections";
import {useGeocoding} from "@/files/hooks/useGeocoding";
import StartEndSearch, {SearchMode} from "@/files/components/StartEndSearch";
import { LOCATION_TASK_NAME } from "@/files/hooks/locationTask";
import {setOnBackgroundLocationUpdate} from "@/files/hooks/locationTask";
import {useReverseGeocoding} from "@/files/hooks/useReverseGeocoding";

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default function Index() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [startPlace, setStartPlace] = useState<Place|null>(null);
  const [endPlace, setEndPlace] = useState<Place|null>(null);
  const [waypoints, setWaypoints] = useState<Place[]>([]);
  const currentCoordinateRef = useRef<LatLng | null>(null);
  const currentStepIndexRef = useRef<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<LatLng>>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [isOnRoute, setIsOnRoute] = useState(true);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentCoordinate, setCurrentCoordinate] = useCurrentLocation();
  const [searchMode, setSearchMode] = useState<SearchMode>({type: "end"});
  const { routes, getDirections, isLoadingDirections, setSelectedRoute, selectedRoute } = useDirections();
  const { searchResults, search, isLoadingGeocoding, fetchSearchResults } = useGeocoding();
  const { reverseGeocode } = useReverseGeocoding();

  const mockLocation = false;

  const startBackgroundLocationTracking = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission required", "Background location access is needed for navigation.");
      return;
    }

    const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log("startBackgroundLocationTracking", isStarted);
    if (!isStarted) {
      console.log("startBackgroundLocationTracking starting");

      try{
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 1,
          timeInterval: 1000,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "Cycling Navigation",
            notificationBody: "Your ride is being tracked in the background",
            notificationColor: "#007AFF"
          }
        });
      }
      catch (error) {
        console.error("startBackgroundLocationTracking error", error);
      }
      console.log("startBackgroundLocationTracking started");
    }
  };

  const stopBackgroundLocationTracking = async () => {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isStarted) {
      console.log("stopBackgroundLocationTracking stopping");
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  };

  useEffect(() => {
    currentCoordinateRef.current = currentCoordinate;

    if(!startPlace && currentCoordinate != null){
      console.log("currentCoordinate", currentCoordinate)
      setStartPlace({
        name: "Current Location",
        center: currentCoordinate
      })
    }
  }, [currentCoordinate]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    setOnBackgroundLocationUpdate(async (coords) => {
      console.log("setOnBackgroundLocationUpdate", coords);
      setCurrentCoordinate(coords);
      checkAdvanceStep(coords, currentStepIndex);
    });
  }, [isNavigating]);

  useEffect(() => {
    if (isNavigating) {
      startBackgroundLocationTracking();
    }
    else {
      stopBackgroundLocationTracking();
      setOnBackgroundLocationUpdate(null);
    }

    return () => {
      stopBackgroundLocationTracking();
    };
  }, [isNavigating]);

  useEffect(() => {
    console.log("getDirections", startPlace, endPlace)

    if (!isNavigating && startPlace && endPlace) {
      console.log("getDirections", startPlace, endPlace)
      getDirections([startPlace.center, ...waypoints.map(place => place.center), endPlace.center]);
    }
  }, [startPlace, endPlace, waypoints]);

  const handleWaypointAdded = (place:Place) => {
    console.log("handleWaypointAdded", place)
    setWaypoints((prev) => [...prev, place]);
  };

  const handleWaypointRemoved = (index:number) => {
    console.log("handleWaypointRemoved", index)
    setWaypoints((prev) =>
      prev.filter((_, waypointIndex) => index != waypointIndex)
    );
  };

  const handleWaypointChanged = (place:Place, index:number) => {
    console.log("handleWaypointChanged", place)
    setWaypoints((prev) => {
      prev[index] = place;
      return prev;
    });
  };

  const handleStartPlaceSelected = (place:Place) => {
    if(!isNavigating) {
      setStartPlace(place);
    }
  };

  const handleEndPlaceSelected = (place:Place) => {
    if(!isNavigating) {
      setEndPlace(place);
    }
  };

  const buildPlaceFromCoordinates = async (coordinates:LatLng):Promise<Place> => {
    const feature = await reverseGeocode(coordinates);
    return {
      center: coordinates,
      name: feature?.place_name,
    }
  }

  const handleMapPress = async (event) => {
    const coords = event.geometry.coordinates as LatLng;

    if(!isNavigating){
      console.log("handleMapPress", searchMode)
      if(searchMode?.type == "waypoint"){
        if(searchMode?.index < waypoints.length){
          handleWaypointChanged(await buildPlaceFromCoordinates(coords), searchMode?.index);
        }
        else{
          handleWaypointAdded(await buildPlaceFromCoordinates(coords));
        }
      }
      else if(searchMode?.type == "start"){
        setStartPlace(await buildPlaceFromCoordinates(coords));
      }
      else if(searchMode?.type == "end"){
        setEndPlace(await buildPlaceFromCoordinates(coords));
      }
      setSearchMode(null);
      setSuggestions([]);
    }
    else if(mockLocation){
      setCurrentCoordinate(coords);
    }
  }

  const handleMapLongPress = async (event) => {
    const coords = event.geometry.coordinates as LatLng;

    if(!isNavigating){
      console.log("handleMapLongPress", searchMode)

      if(searchMode?.type == "waypoint"){
        if(searchMode?.index < waypoints.length){
          handleWaypointChanged(await buildPlaceFromCoordinates(coords), searchMode?.index);
        }
        else{
          handleWaypointAdded(await buildPlaceFromCoordinates(coords));
        }
      }
      else if(searchMode?.type == "start"){
        setStartPlace(await buildPlaceFromCoordinates(coords));
      }
      else{
        setEndPlace(await buildPlaceFromCoordinates(coords));
      }
      setSuggestions([]);
    }
  }

  useEffect(() => {
    if(!mockLocation){
      return trackUserMovement();
    }
  }, [isNavigating]);

  const trackUserMovement = () => {
    let subscription: Location.LocationSubscription;

    const startWatching = async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Accuracy.High,
          timeInterval: 1000, // update every second
          distanceInterval: 1, // or every meter
        },
        (location) => {
          const coords: LatLng = [
            location.coords.longitude,
            location.coords.latitude,
          ];
          setCurrentCoordinate(coords);
        }
      );
    };
    startWatching();
    return () => {
      subscription?.remove();
    };
  }

  const checkAdvanceStep = (position: LatLng, currentStepIndex: number) => {
    if (!steps || steps.length === 0 || currentStepIndex >= steps.length){
      return;
    }
    const step = steps[currentStepIndex];
    const lastStep = steps[steps.length - 1];

    if (!step){
      return;
    }

    if(calculatePathDistance(position, lastStep.location, routeCoordinates) < 15){
      setArrived(true);
      setIsOnRoute(true);
      return;
    }

    if(isOnStepPath(position, step)){
      console.log("Still on current step.")
      setIsOnRoute(true);
      return;
    }

    for(let stepIndex = currentStepIndex + 1; stepIndex < steps.length; stepIndex++){
      let futureStep = steps[stepIndex];

      if(isOnStepPath(position, futureStep)){
        setCurrentStepIndex(stepIndex);
        setIsOnRoute(true);
        console.log("On next step.");
        return;
      }
    }
    console.log("Off route");
    setIsOnRoute(false);
  };

  const startNavigating = () => {
    if(selectedRoute){
      setSteps(selectedRoute.steps);
      setRouteCoordinates(selectedRoute.coordinates);
      setIsNavigating(true);
      setArrived(false);
      setIsOnRoute(true);
      setCurrentStepIndex(0);
    }
  }

  const stopNavigating = () => {
    setIsNavigating(false);
    Speech.stop();
  }

  if (!currentCoordinate) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapViewComponent
        mockLocation={mockLocation}
        currentCoordinate={currentCoordinate}
        startPlace={startPlace}
        endPlace={endPlace}
        waypoints={waypoints}
        routes={routes}
        selectedRoute={selectedRoute}
        setSelectedRoute={setSelectedRoute}
        onMapPress={handleMapPress}
        onMapLongPress={handleMapLongPress}
        isNavigating={isNavigating}
      />
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="box-none"
      >
        {!isNavigating && (
          <View style={{ flex: 1, justifyContent: "flex-start" }} pointerEvents="box-none">
            <StartEndSearch startPlace={startPlace}
                            endPlace={endPlace}
                            waypoints={waypoints}
                            onAddWaypoint={handleWaypointAdded}
                            onRemoveWaypoint={handleWaypointRemoved}
                            onChangeWaypoint={handleWaypointChanged}
                            searchMode={searchMode}
                            setSearchMode={setSearchMode}
                            onSelectStart={handleStartPlaceSelected}
                            onSelectEnd={handleEndPlaceSelected}
                            onSwap={() => {
                              setEndPlace(startPlace);
                              setStartPlace(endPlace);
                            }}
                            onSearch={(query) => fetchSearchResults(query, currentCoordinateRef.current)}>

            </StartEndSearch>
          </View>
        )}
        <View style={{ flex: 1, position: "relative" }}>


          <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
            <NavigationPanel
              selectedPlace={endPlace}
              isNavigating={isNavigating}
              route={selectedRoute}
              currentStepIndex={currentStepIndex}
              onStart={startNavigating}
              onStop={stopNavigating}
              arrived={arrived}
              isOnRoute={isOnRoute}
              currentCoordinate={currentCoordinate}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapHint: {
    backgroundColor: "#fff",
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    alignItems: "center",
    zIndex: 1000,
  },
});

