plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.unixshells.devbrowser"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.unixshells.devbrowser"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

// DevTools frontend is pre-built from Chromium source and checked into
// app/src/main/assets/devtools_frontend/. To rebuild it:
//   1. Build devtools-frontend in your Chromium checkout:
//      autoninja -C out/Release third_party/devtools-frontend/src/front_end
//   2. Copy the built files:
//      ./scripts/copy-devtools.sh

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.webkit:webkit:1.9.0")

    // NanoHTTPD for local HTTP server (serves DevTools frontend)
    implementation("org.nanohttpd:nanohttpd:2.3.1")
    implementation("org.nanohttpd:nanohttpd-websocket:2.3.1")
}
