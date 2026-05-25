sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";
    return Controller.extend("leavemanagement.controller.View1", {

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteView1").attachPatternMatched(this._onRouteMatched, this);
            window.addEventListener("popstate", this._preventBack.bind(this));
        },
        _preventBack: function () {
            const bLoggedIn = sessionStorage.getItem("isLoggedIn");
            if (bLoggedIn) {
                history.pushState(null, null, location.href);
                // ✅ Respect role when preventing back navigation
                const userData = JSON.parse(sessionStorage.getItem("currentUser"));
                const sRoute = userData?.role === "ADMIN" ? "RouteAdmin" : "RouteView2";
                this.getOwnerComponent().getRouter().navTo(sRoute, {}, true);
            }
        },
        _onRouteMatched: function () {
            const bLoggedIn = sessionStorage.getItem("isLoggedIn");
            if (bLoggedIn) {
                history.pushState(null, null, location.href);
                const userData = JSON.parse(sessionStorage.getItem("currentUser"));
                const sRoute = userData?.role === "ADMIN" ? "RouteAdmin" : "RouteView2";
                this.getOwnerComponent().getRouter().navTo(sRoute, {}, true);
            }
        },
        onLogin: function () {
            const email    = this.byId("userId").getValue();
            const password = this.byId("password").getValue();
            if (!email || !password) {
                MessageToast.show("Please enter email and password");
                return;
            }
            const oModel   = this.getOwnerComponent().getModel();
            const oContext = oModel.bindContext("/login(...)");
            oContext.setParameter("email", email);
            oContext.setParameter("password", password);
            oContext.execute().then(() => {
                const result = oContext.getBoundContext().getObject();
                if (result.success) {
                    const userData = {
                        firstName:  result.firstName,
                        lastName:   result.lastName,
                        email:      result.email,
                        Team:       result.Team,
                        employeeId: result.employeeId,
                        isActive:   result.isActive,
                        role:       result.role,       
                        location:   result.location,
                        phNo:       result.phNumber
                    };
                    sessionStorage.setItem("isLoggedIn", "true");
                    sessionStorage.setItem("currentUser", JSON.stringify(userData));
                    const oUserModel = new sap.ui.model.json.JSONModel(userData);
                    this.getOwnerComponent().setModel(oUserModel, "currentUser");
                    MessageToast.show("Welcome " + result.firstName);
                    if (role === "Admin") {
                        this.getOwnerComponent().getRouter().navTo("RouteAdmin");
                    } else {
                        this.getOwnerComponent().getRouter().navTo("RouteView2");
                    }

                } else {
                    this.byId("loginError").setVisible(true);
                    this.byId("loginError").setText(result.message || "Invalid credentials.");
                }

            }).catch(() => {
                this.byId("loginError").setVisible(true);
                this.byId("loginError").setText("Something went wrong. Please try again.");
            });
        }
    });
});