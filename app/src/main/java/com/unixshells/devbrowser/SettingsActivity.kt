package com.unixshells.devbrowser

import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity

class SettingsActivity : AppCompatActivity() {

    private lateinit var prefs: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        prefs = getSharedPreferences("devbrowser_settings", Context.MODE_PRIVATE)

        setupViews()
    }

    private fun setupViews() {
        val btnBack = findViewById<ImageButton>(R.id.settingsBack)
        btnBack.setOnClickListener { finish() }

        // JavaScript enabled
        val switchJs = findViewById<Switch>(R.id.switchJavascript)
        switchJs.isChecked = prefs.getBoolean("javascript_enabled", true)
        switchJs.setOnCheckedChangeListener { _, checked ->
            prefs.edit().putBoolean("javascript_enabled", checked).apply()
        }

        // Desktop mode default
        val switchDesktop = findViewById<Switch>(R.id.switchDesktopDefault)
        switchDesktop.isChecked = prefs.getBoolean("desktop_mode_default", true)
        switchDesktop.setOnCheckedChangeListener { _, checked ->
            prefs.edit().putBoolean("desktop_mode_default", checked).apply()
        }

        // Block images
        val switchImages = findViewById<Switch>(R.id.switchBlockImages)
        switchImages.isChecked = prefs.getBoolean("block_images", false)
        switchImages.setOnCheckedChangeListener { _, checked ->
            prefs.edit().putBoolean("block_images", checked).apply()
        }

        // Custom user agent
        val editUa = findViewById<EditText>(R.id.editUserAgent)
        editUa.setText(prefs.getString("custom_user_agent", ""))
        editUa.setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) {
                prefs.edit().putString("custom_user_agent", editUa.text.toString()).apply()
            }
        }

        // Clear data buttons
        findViewById<Button>(R.id.btnClearCache).setOnClickListener {
            android.webkit.WebView(this).clearCache(true)
            Toast.makeText(this, "Cache cleared", Toast.LENGTH_SHORT).show()
        }

        findViewById<Button>(R.id.btnClearCookies).setOnClickListener {
            android.webkit.CookieManager.getInstance().removeAllCookies(null)
            Toast.makeText(this, "Cookies cleared", Toast.LENGTH_SHORT).show()
        }

        findViewById<Button>(R.id.btnClearHistory).setOnClickListener {
            val historyPrefs = getSharedPreferences("devbrowser_history", Context.MODE_PRIVATE)
            historyPrefs.edit().clear().apply()
            Toast.makeText(this, "History cleared", Toast.LENGTH_SHORT).show()
        }

        // DevTools ports
        val editHttpPort = findViewById<EditText>(R.id.editCdpHttpPort)
        val editWsPort = findViewById<EditText>(R.id.editCdpWsPort)
        editHttpPort.setText(prefs.getInt("cdp_http_port", 9222).toString())
        editWsPort.setText(prefs.getInt("cdp_ws_port", 9223).toString())

        editHttpPort.setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) {
                val port = editHttpPort.text.toString().toIntOrNull() ?: 9222
                prefs.edit().putInt("cdp_http_port", port).apply()
            }
        }
        editWsPort.setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) {
                val port = editWsPort.text.toString().toIntOrNull() ?: 9223
                prefs.edit().putInt("cdp_ws_port", port).apply()
            }
        }
    }
}
