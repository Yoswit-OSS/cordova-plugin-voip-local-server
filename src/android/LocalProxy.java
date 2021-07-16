package com.local.meeting.cordova;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

public class LocalProxy extends CordovaPlugin {
    public static final String TAG = "LocalProxy";

    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("setProxy".equals(action)) {
            try {
                setupProxy(args.getString(0), args.getString(1));
                callbackContext.success();
            } catch (Exception e) {
                e.printStackTrace();
                callbackContext.error(e.getMessage());
            }
        }
        else if ("resetProxy".equals(action)) {
            try {
                setupProxy("", "");
                callbackContext.success();
            } catch (Exception e) {
                e.printStackTrace();
                callbackContext.error(e.getMessage());
            }
        }
        else {
            return false;
        }
        return true;
    }

    private void setupProxy(String host, String port) {
        System.setProperty("http.proxyHost", host);
        System.setProperty("http.proxyPort", port);
        System.setProperty("https.proxyHost", host);
        System.setProperty("https.proxyPort", port);
        System.setProperty("socksProxyHost", host);
        System.setProperty("socksProxyPort", port);
    }
}
