sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("leavemanagement.controller.View1", {
        onInit() {
        },
        onLogin() {
            const email = this.byId("userId").getValue();
            const password = this.byId("password").getValue();
            if (!email || !password) {
                MessageToast.show("Please enter email and password");
                return;
            }
            const oModel = this.getOwnerComponent().getModel();
            const oContext = oModel.bindContext("/login(...)");
            oContext.setParameter("email", email);
            oContext.setParameter("password", password);
            oContext.execute().then(() => {
                const result = oContext.getBoundContext().getObject();
                if (result.success) {    
                    const userData = {
                        name:result.name,
                        email:result.email,
                        department:result.department,
                        managerId:result.managerId,                      
                    }
                    const oUserModel = new sap.ui.model.json.JSONModel(userData);
                    MessageToast.show("Welcome " + result.name);
                    this.getOwnerComponent().setModel(oUserModel, "currentUser");
                    this.getOwnerComponent().getRouter().navTo("RouteView2");
                } else {
                    MessageToast.show(result.message);
                }
            }).catch(() => {
                MessageToast.show("Error during login");
            });
        }
    });
});