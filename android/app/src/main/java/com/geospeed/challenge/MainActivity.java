package com.geospeed.challenge;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebView;
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
    }
}
