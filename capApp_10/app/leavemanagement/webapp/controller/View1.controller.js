sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";
    return Controller.extend("leavemanagement.controller.View1", {
        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteView1").attachPatternMatched( this._onRouteMatched,this);
            // Prevent browser back after login
            window.addEventListener( "popstate",this._preventBack.bind(this));
        },
        _preventBack: function () {
            const bLoggedIn = sessionStorage.getItem("isLoggedIn");
            if (bLoggedIn) {
                history.pushState(null, null, location.href);
                this.getOwnerComponent().getRouter().navTo("RouteView2",{},true);
            }
        },
        __onRouteMatched: function () {
            const bLoggedIn = sessionStorage.getItem("isLoggedIn");
            if (bLoggedIn) {
                history.pushState(null, null, location.href);
                this.getOwnerComponent().getRouter().navTo("RouteView2", {}, true);
            }
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
                        firstName: result.firstName,
                        lastName:result.lastName,
                        email: result.email,
                        Team: result.Team,
                        employeeId: result.employeeId,
                        isActive:result.isActive,
                        
                    };
                    // STORE SESSION
                    sessionStorage.setItem("isLoggedIn", "true");
                    sessionStorage.setItem(
                        "currentUser",
                        JSON.stringify(userData)
                    );
                    const oUserModel = new sap.ui.model.json.JSONModel(userData);
                    MessageToast.show("Welcome " + result.firstName);
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