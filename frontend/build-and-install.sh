#!/bin/bash

# Usage: ./build-and-install-apk.sh [debug|release]
BUILD_TYPE=${1:-release}

# Validate input
if [[ "$BUILD_TYPE" != "debug" && "$BUILD_TYPE" != "release" ]]; then
  echo "❌ Invalid build type: $BUILD_TYPE"
  echo "Usage: $0 [debug|release]"
  exit 1
fi

# Build the APK
echo "🔨 Building $BUILD_TYPE APK..."
cd android || exit 1
CAPITALIZED_BUILD_TYPE="$(echo "$BUILD_TYPE" | tr '[:lower:]' '[:upper:]' | cut -c1)$(echo "$BUILD_TYPE" | cut -c2-)"
./gradlew "assemble${CAPITALIZED_BUILD_TYPE}" || { echo "❌ Build failed"; exit 1; }
cd - > /dev/null

# Determine APK path
APK_PATH="./android/app/build/outputs/apk/$BUILD_TYPE/app-$BUILD_TYPE.apk"

# Check if APK was built
if [ ! -f "$APK_PATH" ]; then
  echo "❌ APK not found at $APK_PATH"
  exit 1
fi

# Install the APK
echo "📱 Installing APK: $APK_PATH"
adb install -r "$APK_PATH"

# Report result
if [ $? -eq 0 ]; then
  echo "✅ $BUILD_TYPE APK installed successfully!"
else
  echo "❌ Failed to install $BUILD_TYPE APK"
fi
