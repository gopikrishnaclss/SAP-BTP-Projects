sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        
        onInit() {
            this._getTokenAndLoad();
        },
        _getTokenAndLoad() {
            // Step 1 — Get token from XSUAA
            fetch("/myservice-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: "grant_type=client_credentials"
            })
            .then(res => res.json())
            .then(tokenData => {
                const sToken = tokenData.access_token;
                console.log("Token:", sToken.substring(0, 30));
                // Step 2 — Call Products with token
                return fetch("/myservice/Products", {
                    headers: {
                        "Authorization": "Bearer " + sToken,
                        "Accept": "application/json"
                    }
                });
            })
            .then(res => res.json())
            .then(data => {
                console.log("Products:", data);
                const oModel = new JSONModel(data.value || []);
                this.getView().setModel(oModel, "products");
                MessageToast.show("Loaded " + (data.value || []).length + " products");
            })
            .catch(err => {
                console.error("Error:", err.message);
                
            });
        }
    });
});