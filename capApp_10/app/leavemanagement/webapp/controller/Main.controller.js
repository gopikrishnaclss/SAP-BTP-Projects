sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], (Controller, MessageToast) => {
  "use strict";
  return Controller.extend("leavemanagement.controller.Main", {
    onInit() {
      // const oCurrentUser = this.getOwnerComponent().getModel("currentUser");
      // const oname = oCurrentUser.getProperty("/name")      
      // this.byId("employeeInput").setValue(oname)
    },
    onnavigation(oEvent) {
      const oItem = oEvent.getParameter("item");
      this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
      const sKey = oEvent.getParameter("item").getKey();
      //  Load the appropriate view
      switch (sKey) {
        case "Apply Leave":
          this.byId("pageContainer").to(this.createId("page1"));
          break;
        case "EscalationLevel":
          this.byId("pageContainer").to(this.createId("page2"));
          break;
        case "ThresholdBase":
          this.byId("pageContainer").to(this.createId("page3"));
          break;
        case "ExceptionTypeMaster":
          this.byId("pageContainer").to(this.createId("page4"));
          break;
        case "EscalationMaster":
          this.byId("pageContainer").to(this.createId("page5"));
          break;
      }
    },
    onLogout() {
      MessageToast.show("Logged out successfully");
      this.getOwnerComponent().getRouter().navTo("RouteView1");
    },
    onCollapseExpandPress() {
      const oSideNavigation = this.byId("sideNavigation"),
      bExpanded = oSideNavigation.getExpanded();
      oSideNavigation.setExpanded(!bExpanded);
    },
    applyLeave() {
    },
  });
});