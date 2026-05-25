#!/bin/bash
set -e

# Build release APK for UniWhere Android
# Handles: Node 20 via nvm, Android SDK path, expo prebuild, ProGuard rules, Gradle

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NODE_20="/home/worker-node-4/.nvm/versions/node/v20.20.2/bin/node"
ANDROID_SDK="/home/worker-node-4/Android/Sdk"
NODE_WRAPPER="$HOME/bin/node"

cd "$PROJECT_DIR"

# 1. Activate Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

# Ensure ~/bin/node wrapper points to Node 20 (Gradle uses system PATH)
mkdir -p "$HOME/bin"
cat > "$NODE_WRAPPER" <<EOF
#!/bin/bash
exec $NODE_20 "\$@"
EOF
chmod +x "$NODE_WRAPPER"
export PATH="$HOME/bin:$PATH"
export ANDROID_HOME="$ANDROID_SDK"

echo "Using node: $(node --version)"
echo "ANDROID_HOME: $ANDROID_HOME"

# 2. Prebuild (regenerate android/ native project)
npx expo prebuild --platform android --clean

# 3. Restore local.properties (Gradle needs NODE_BINARY for subprocesses)
echo "NODE_BINARY=$NODE_20" > android/local.properties

# 4. Restore ProGuard rules (expo.modules.* classes must not be stripped by R8)
cat >> android/app/proguard-rules.pro <<'EOF'

# expo-modules-core — R8 strips internal Kotlin classes used at runtime via
# reflection inside expo module definitions (TypeDescriptor, etc.)
-keep class expo.modules.** { *; }
-keep interface expo.modules.** { *; }
-keepattributes *Annotation*, Signature, RuntimeVisibleAnnotations, EnclosingMethod, InnerClasses
EOF

# 5. Build release APK
cd android
./gradlew assembleRelease --no-daemon

APK_PATH="$PROJECT_DIR/android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "✓ Build complete: $APK_PATH"
echo "  Size: $(du -h "$APK_PATH" | cut -f1)"
echo ""
echo "Install with:"
echo "  adb install -r $APK_PATH"
