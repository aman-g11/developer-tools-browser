-keep class org.nanohttpd.** { *; }
-keepclassmembers class * extends org.nanohttpd.protocols.http.NanoHTTPD {
    *;
}
