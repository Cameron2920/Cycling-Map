// components/NavigationPanel.tsx
import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform, Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import {calculatePathDistance} from "@/files/lib/MapBox";

type Props = {
  selectedPlace: { center: [number, number]; name?: string } | null;
  isNavigating: boolean;
  steps: any[];
  currentStepIndex: number;
  onStart: () => void;
  onStop: () => void;
  arrived: boolean;
  currentCoordinate: any;
  routeCoordinates: any;
};

export default function NavigationPanel({
                                          selectedPlace,
                                          isNavigating,
                                          steps,
                                          currentStepIndex,
                                          onStart,
                                          onStop,
                                          arrived,
                                          currentCoordinate,
                                          routeCoordinates,
                                        }: Props) {
  const insets = useSafeAreaInsets();
  const [instructions, setInstructions] = useState("");
  const [distanceString, setDistanceString] = useState("");

  const speakText = (text: string) => {
    console.log("speaking: ", text);
    Vibration.vibrate([0, 300]);
    Speech.speak(text, {
      volume: 1
    });
  }
  console.log("nav panel currentStepIndex: ", currentStepIndex)

  const buildDistanceString = (distance:number) => {
    let newDistanceString = "";

    if(distance) {
      if(distance < 1000) {
        newDistanceString = `${Math.round(distance)} m`
      }
      else {
        newDistanceString = `${(distance / 1000).toFixed(1)} km`
      }
    }
    return newDistanceString;
  }

  useEffect(() => {
    let nextStep = steps[currentStepIndex + 1];

    if (isNavigating && nextStep) {
      let distance = calculatePathDistance(currentCoordinate, nextStep.maneuver.location, routeCoordinates);
      setDistanceString(buildDistanceString(distance));
    }
  }, [currentCoordinate]);

  useEffect(() => {
    let currentStep = steps[currentStepIndex];
    let nextStep = steps[currentStepIndex + 1];

    if (isNavigating && currentStep) {
      if(arrived){
        let newInstructions = "You have arrived";
        setInstructions(newInstructions);
        speakText(newInstructions);
        return;
      }
      let distance = 0;

      if(nextStep) {
        distance = calculatePathDistance(currentCoordinate, nextStep.maneuver.location, routeCoordinates);
      }
      let newInstructions = "";
      let newDistanceString = buildDistanceString(distance);

      if(currentStepIndex == 0){
        newInstructions = `${currentStep?.maneuver?.instruction} \nThen in ${newDistanceString}\n ${nextStep?.maneuver?.instruction}`;
      }
      else{
        newInstructions = `In ${newDistanceString}\n${nextStep?.maneuver?.instruction}`;
      }
      setDistanceString(newDistanceString);
      setInstructions(newInstructions);
      speakText(newInstructions);
    }
  }, [currentStepIndex, isNavigating, arrived]);

  if (!selectedPlace) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      {isNavigating ? (
        <>
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>
              {instructions}
            </Text>
            <Text style={styles.distanceText}>
              {distanceString}
            </Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={onStop}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.button} onPress={onStart}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  instructionBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    marginBottom: 10,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  instructionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  distanceText: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
    textAlign: "center",
  },
});
