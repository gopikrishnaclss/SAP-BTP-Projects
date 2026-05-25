sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("leavemanagement.controller.Admin", {

        onInit: function () {
            // ── Guard: only ADMIN can access ──
            const userData = JSON.parse(sessionStorage.getItem("currentUser"));
            if (!userData || userData.role !== "ADMIN") {
                this.getOwnerComponent().getRouter().navTo("RouteView1");
                return;
            }

            // ── Restore currentUser model ──
            const oUserModel = new JSONModel(userData);
            this.getOwnerComponent().setModel(oUserModel, "currentUser");

            // ── Admin dashboard model (replace with real OData later) ──
            const oAdminModel = new JSONModel({
                totalEmployees:  12,
                pendingApprovals: 4,
                approvedLeaves:  20,
                rejectedLeaves:   3,
                leaveRequests: [
                    { employeeName: "Ravi Kumar",  leaveType: "Casual", fromDate: "01-Jun-2025", toDate: "02-Jun-2025", totalDays: 2, status: "PENDING"  },
                    { employeeName: "Priya Nair",  leaveType: "Sick",   fromDate: "05-Jun-2025", toDate: "05-Jun-2025", totalDays: 1, status: "APPROVED" },
                    { employeeName: "Arjun Das",   leaveType: "Paid",   fromDate: "10-Jun-2025", toDate: "12-Jun-2025", totalDays: 3, status: "REJECTED" }
                ]
            });
            this.getOwnerComponent().setModel(oAdminModel, "adminModel");
        },

        // ── Sidebar navigation ──
        onNavItemSelect: function (oEvent) {
            const sKey = oEvent.getParameter("item").getKey();
            const oNav = this.byId("adminNavContainer");
            if (sKey === "dashboard") {
                oNav.to(this.byId("adminDashboard"));
            } else if (sKey === "createUser") {
                oNav.to(this.byId("adminCreateUser"));
            }
        },

        // ── Collapse/Expand sidebar ──
        onCollapseExpandPress: function () {
            const oSideNav = this.byId("adminSideNav");
            oSideNav.setExpanded(!oSideNav.getExpanded());
        },

        // ── Approve leave ──
        onApprove: function (oEvent) {
            const oItem    = oEvent.getSource().getBindingContext("adminModel");
            const oModel   = this.getOwnerComponent().getModel("adminModel");
            oModel.setProperty(oItem.getPath() + "/status", "APPROVED");
            MessageToast.show("Leave Approved");
        },

        // ── Reject leave ──
        onReject: function (oEvent) {
            const oItem  = oEvent.getSource().getBindingContext("adminModel");
            const oModel = this.getOwnerComponent().getModel("adminModel");
            oModel.setProperty(oItem.getPath() + "/status", "REJECTED");
            MessageToast.show("Leave Rejected");
        },

        // ── Refresh table ──
        onRefresh: function () {
            MessageToast.show("Refreshed");
            // call your OData read here later
        },

        // ── Create user ──
        onCreateUser: function () {
            const firstName = this.byId("newFirstName").getValue();
            const lastName  = this.byId("newLastName").getValue();
            const email     = this.byId("newEmail").getValue();
            const password  = this.byId("newPassword").getValue();
            const team      = this.byId("newTeam").getValue();
            const location  = this.byId("newLocation").getValue();
            const phone     = this.byId("newPhone").getValue();
            const role      = this.byId("newRole").getSelectedKey();

            if (!firstName || !lastName || !email || !password) {
                MessageBox.error("Please fill all required fields.");
                return;
            }

            // 🔁 Replace with real OData POST later
            MessageBox.success(
                "User '" + firstName + " " + lastName + "' created as " + role + ".",
                { title: "User Created" }
            );
            this.onClearCreateUser();
        },

        // ── Clear create user form ──
        onClearCreateUser: function () {
            ["newFirstName","newLastName","newEmail",
             "newPassword","newTeam","newLocation","newPhone"]
                .forEach(id => this.byId(id).setValue(""));
            this.byId("newRole").setSelectedKey("EMPLOYEE");
        },

        // ── Logout ──
        onLogout: function () {
            MessageBox.confirm("Are you sure you want to logout?", {
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        sessionStorage.clear();
                        this.getOwnerComponent().getRouter().navTo("RouteView1");
                    }
                }
            });
        }
    });
});