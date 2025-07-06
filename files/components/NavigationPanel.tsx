// components/NavigationPanel.tsx
import React, {useEffect, useRef, useState} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform, Vibration,
} from "react-native";
import * as Speech from "expo-speech";
import {calculatePathDistance, formatDistance, formatDuration, Place} from "@/files/lib/MapBox";
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {Route} from "@/files/hooks/useDirections";

type Props = {
  selectedPlace: Place | null;
  isNavigating: boolean;
  currentStepIndex: number;
  onStart: () => void;
  onStop: () => void;
  arrived: boolean;
  isOnRoute: boolean;
  currentCoordinate: any;
  route: Route | null;
};

export default function NavigationPanel({
                                          selectedPlace,
                                          isNavigating,
                                          currentStepIndex,
                                          onStart,
                                          onStop,
                                          arrived,
                                          isOnRoute,
                                          currentCoordinate,
                                          route,
                                        }: Props) {
  const [instructions, setInstructions] = useState("");
  const [distanceString, setDistanceString] = useState("");
  const lastSpokenStepIndexRef = useRef<number | null>(null);
  const hasSpokenApproachRef = useRef(true);

  const speakText = (text: string) => {
    console.log("speaking: ", text);
    Vibration.vibrate([0, 300]);
    Speech.speak(text, {
      volume: 1
    });
  }

  const buildDistanceString = (distance:number) => {
    let newDistanceString = "";

    if(distance) {
      if(distance < 1000) {
        const roundedDistance = Math.round(distance / 50) * 50;
        newDistanceString = `${Math.round(roundedDistance)} m`
      }
      else {
        newDistanceString = `${(distance / 1000).toFixed(1)} km`
      }
    }
    return newDistanceString;
  }

  useEffect(() => {
    if (!isNavigating || arrived || !route) return;

    const nextStep = route.steps[currentStepIndex + 1];
    if (!nextStep) return;

    const distance = calculatePathDistance(
      currentCoordinate,
      nextStep.location,
      route.coordinates
    );

    const distanceString = buildDistanceString(distance);
    setDistanceString(distanceString);

    // Speak when within 200 meters of next maneuver (only once)
    if (!hasSpokenApproachRef.current && distance < 200) {
      const approachInstruction = `In ${distanceString}, ${nextStep?.instruction}`;
      speakText(approachInstruction);
      hasSpokenApproachRef.current = true;
    }
  }, [currentCoordinate, isNavigating, arrived, currentStepIndex]);

  useEffect(() => {
    if(!route) return;

    const currentStep = route.steps[currentStepIndex];
    const nextStep = route.steps[currentStepIndex + 1];

    if (!isNavigating || !currentStep) return;

    if (arrived) {
      const instructions = "You have arrived";
      setInstructions(instructions);
      speakText(instructions);
      return;
    }
    else if(!isOnRoute) {
      const instructions = "You are off route";
      setInstructions(instructions);
      speakText(instructions);
      return;
    }

    let distance = 0;
    if (nextStep) {
      distance = calculatePathDistance(
        currentCoordinate,
        nextStep.location,
        route.coordinates
      );
    }

    const newDistanceString = buildDistanceString(distance);
    let newInstructions = "";

    if (currentStepIndex === 0 && nextStep) {
      newInstructions = `${currentStep?.instruction}\nThen in ${newDistanceString}, ${nextStep?.instruction}`;
    } else if (nextStep) {
      newInstructions = `In ${newDistanceString}, ${nextStep?.instruction}`;
    }

    setInstructions(newInstructions);
    setDistanceString(newDistanceString);
    speakText(newInstructions);

    lastSpokenStepIndexRef.current = currentStepIndex;

    if(distance > 500){
      hasSpokenApproachRef.current = false;
    }
  }, [currentStepIndex, isNavigating, arrived, isOnRoute]);

  const getStepIcon = (step: any) => {
    const modifier = step?.modifier;
    const type = step?.type;

    switch (modifier) {
      case "sharp right":
        return <Ionicons name="arrow-forward-sharp" size={24} color="#007AFF" />;
      case "slight right":
        return <Ionicons name="arrow-forward-outline" size={24} color="#007AFF" />;
      case "right":
        return <Ionicons name="arrow-forward" size={24} color="#007AFF" />;

      case "sharp left":
        return <Ionicons name="arrow-back-sharp" size={24} color="#007AFF" />;
      case "slight left":
        return <Ionicons name="arrow-back-outline" size={24} color="#007AFF" />;
      case "left":
        return <Ionicons name="arrow-back" size={24} color="#007AFF" />;

      case "straight":
        return <Ionicons name="arrow-up" size={24} color="#007AFF" />;

      default:
        // fallback based on maneuver type
        switch (type) {
          case "arrive":
            return <FontAwesome5 name="flag-checkered" size={24} color="#28a745" />;
          case "depart":
            return <MaterialCommunityIcons name="navigation" size={24} color="#007AFF" />;
          case "roundabout":
            return <MaterialCommunityIcons name="rotate-right" size={24} color="#007AFF" />;
          default:
            return <Ionicons name="ios-navigate" size={24} color="#007AFF" />;
        }
    }
  };


  if (!selectedPlace || !route) return null;
  const nextStep = route.steps[currentStepIndex + 1];
  const icon = nextStep ? getStepIcon(nextStep) : null;

  return (
    <View style={[styles.container]}>
      {!isNavigating && route && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            🛣 {formatDistance(route.distance)} · ⏱ {formatDuration(route.duration)}
            {route.elevationGain != null && ` · ⛰ +${Math.round(route.elevationGain)} m`}
          </Text>
        </View>
      )}

      {isNavigating ? (
        <>
          <View style={styles.instructionBox}>
            {icon && (
              <View style={styles.iconWrapper}>
                {icon}
              </View>
            )}
            <Text style={styles.instructionText}>
              {instructions}
            </Text>
            <View style={{ height: 1, backgroundColor: "#EEE", marginVertical: 10 }} />
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
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  instructionBox: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    alignItems: "center",
  },
  instructionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
  },
  distanceText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  iconWrapper: {
    backgroundColor: "#E6F0FF",
    padding: 12,
    borderRadius: 50,
    marginBottom: 10,
  },
  summaryBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
  },
});
