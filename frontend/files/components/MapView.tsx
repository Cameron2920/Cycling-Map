// components/MapView.tsx
import React, {useEffect, useRef} from "react";
import { View, StyleSheet } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import {Route} from "@/files/hooks/useDirections";
import {getBoundingBox, LatLng, Place} from "@/files/lib/MapBox";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {RouteView} from "@/files/components/RouteView";

type Props = {
  currentCoordinate: LatLng;
  endPlace: Place | null;
  startPlace: Place | null;
  waypoints: Place[];
  routeCoordinates: Array<LatLng>;
  routes: Array<Route>;
  selectedRoute: Route;
  setSelectedRoute: (Route: any) => void;
  onMapPress: (event: any) => void;
  onMapLongPress: (event: any) => void;
  mockLocation: boolean;
  isNavigating: boolean;
};

export default function MapViewComponent({
                                           currentCoordinate,
                                           startPlace,
                                           endPlace,
                                           waypoints,
                                           selectedRoute,
                                           setSelectedRoute,
                                           routes,
                                           onMapPress,
                                           onMapLongPress,
                                           mockLocation,
                                           isNavigating,
                                         }: Props) {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapRef = useRef(null);

  // Using a gesture detector because MapboxGL.MapView.onLongPress does not work on Android (as of 2025-09-14)
  const longPressGesture = Gesture.LongPress()
    .runOnJS(true)
    .onStart(async event => {
      if (event) {
        const mapPoint = await mapRef.current.getCoordinateFromView([event.x, event.y])
        console.log("longPressGesture", event, mapPoint);

        if (mapPoint) {
          onMapLongPress({
            geometry: {
              coordinates: mapPoint,
            }
          })
        }
      }
    })

  useEffect(() => {
    if(cameraRef.current){
      if (routes.length > 0) {
        const bbox = getBoundingBox(routes);

        if (bbox) {
          cameraRef.current.fitBounds(
            [bbox.minX, bbox.minY], // southwest
            [bbox.maxX, bbox.maxY], // northeast
            100, // padding
            1000 // animation duration (ms)
          );
        }
      }
      else {
        cameraRef.current.setCamera({
          centerCoordinate: endPlace?.center ?? currentCoordinate,
          zoomLevel: 14, // adjust default zoom
          animationDuration: 1000,
        });
      }
    }
  }, [routes, endPlace]);

  const sortRoutes = (routes, selectedRoute) => {
    if (!selectedRoute) return routes;
    return [
      ...routes.filter((route) => route !== selectedRoute),
      selectedRoute, // push selected one to end
    ];
  }

  return (
    <GestureDetector gesture={longPressGesture}>
      <View style={{ flex: 1 }} collapsable={false}>
        <MapboxGL.MapView style={StyleSheet.absoluteFill}
                          ref={mapRef}
                          onPress={onMapPress}>
          <MapboxGL.Camera zoomLevel={13} ref={cameraRef} />
          <MapboxGL.UserLocation visible={!mockLocation} />
          {mockLocation && (
            <MapboxGL.PointAnnotation
              id="mock-user"
              coordinate={currentCoordinate}
            >
              <View style={styles.markerContainer}>
                <View style={styles.userMarker} />
              </View>
            </MapboxGL.PointAnnotation>
          )}

          {sortRoutes(routes, selectedRoute).map((route, index) => (
            <MapboxGL.ShapeSource
              key={`route-${index}`}
              id={`routeSource-${index}`}
              shape={{
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: route.coordinates,
                },
              }}
              onPress={() => setSelectedRoute(route)}
            >
              <MapboxGL.LineLayer
                id={`routeLine-touch-${index}`}
                style={{
                  lineColor: "transparent",
                  lineWidth: 20, // bigger hitbox
                }}
              />
              <MapboxGL.LineLayer
                id={`routeLine-outline-${index}`}
                style={{
                  lineColor: "#808080",
                  lineWidth: route === selectedRoute ? 7 : 5,
                  lineOpacity: 0.9,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <MapboxGL.LineLayer
                id={`routeLine-${index}`}
                style={{
                  lineColor: route === selectedRoute ? "#007AFF" : "#A0A0A0",
                  lineWidth: route === selectedRoute ? 5 : 3,
                  lineOpacity: route === selectedRoute ? 1 : 0.7,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </MapboxGL.ShapeSource>
          ))}

          {endPlace && (
            <MapboxGL.PointAnnotation
              id="selectedPlace"
              coordinate={endPlace.center}
            >
              <View style={styles.markerContainer}>
                <View style={styles.marker} />
              </View>
              <MapboxGL.Callout title={endPlace.name} />
            </MapboxGL.PointAnnotation>
          )}

          {startPlace && (
            <MapboxGL.PointAnnotation
              id="selectedPlace"
              coordinate={startPlace.center}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.marker, {backgroundColor: "green"}]} />
              </View>
              <MapboxGL.Callout title={startPlace.name} />
            </MapboxGL.PointAnnotation>
          )}

          {waypoints.map((waypoint, index) => (
            <MapboxGL.PointAnnotation
              id={'waypoint' + index.toString()}
              key={index.toString()}
              coordinate={waypoint.center}
            >
              <View style={styles.markerContainer}>
                <View style={styles.waypointMarker} />
              </View>
              <MapboxGL.Callout title={waypoint.name} />
            </MapboxGL.PointAnnotation>
          ))}
        </MapboxGL.MapView>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
  },
  waypointMarker: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "green",
    borderColor: "white",
    borderWidth: 2,
  },
  marker: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "red",
    borderColor: "white",
    borderWidth: 2,
  },
  userMarker: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "blue",
    borderColor: "white",
    borderWidth: 2,
  },
});
