import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {Alert} from "react-native";
import {LatLng} from "@/files/lib/MapBox";

export default function useCurrentLocation() {
  const [location, setLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use the map."
        );
        return;
      };
      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation([
        userLocation.coords.longitude,
        userLocation.coords.latitude,
      ]);
    })();
  }, []);

  return [location, setLocation];
}
