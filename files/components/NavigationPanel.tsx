// components/NavigationPanel.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  selectedPlace: { center: [number, number]; name?: string } | null;
  isNavigating: boolean;
  steps: string[];
  currentStepIndex: number;
  onStart: () => void;
  onStop: () => void;
};

export default function NavigationPanel({
                                          selectedPlace,
                                          isNavigating,
                                          steps,
                                          currentStepIndex,
                                          onStart,
                                          onStop,
                                        }: Props) {
  const insets = useSafeAreaInsets();

  if (!selectedPlace) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      {isNavigating ? (
        <>
          {currentStepIndex < steps.length && (
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>
                {steps[currentStepIndex]?.maneuver?.instruction}
              </Text>
            </View>
          )}
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
});
