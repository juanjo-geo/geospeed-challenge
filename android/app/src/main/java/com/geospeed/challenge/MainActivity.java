package com.geospeed.challenge;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Cloudflare Turnstile (protección anti-bots de las sesiones de invitado y del inicio de sesión) corre en un
        // iframe de challenges.cloudflare.com y necesita sus cookies dentro del WebView (guía de Cloudflare para apps).
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            CookieManager cookies = CookieManager.getInstance();
            cookies.setAcceptCookie(true);
            cookies.setAcceptThirdPartyCookies(webView, true);
        }
        hideSystemBars();
    }

    // Pantalla completa (modo inmersivo de los juegos): sin barra de notificaciones (hora, red, llamada en curso) ni
    // barra de navegación. Deslizando desde el borde se asoman un momento y se esconden solas; el gesto y el botón de
    // "atrás" siguen funcionando. Se reaplica al recuperar el foco, porque Android las vuelve a mostrar después de un
    // diálogo, un anuncio, la hoja de compartir o al volver a la app. (capacitor.config.ts → SystemBars.hidden.)
    private void hideSystemBars() {
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        bars.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        bars.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }
}
