sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], (Controller, MessageToast) => {
  "use strict";
  return Controller.extend("leavemanagement.controller.Main", {
    onInit() {
      const oModel = this.getOwnerComponent().getModel();
      const oUserModel = this.getOwnerComponent().getModel("currentUser");
      const empId = oUserModel.getProperty("employeeId")
      const oLeaveBalanceBinding = oModel.bindList("/LeaveBalance");
      oLeaveBalanceBinding.requestContexts().then((aContexts) => {
        const aLeaveBalances = aContexts.map(oContext => oContext.getObject());
        const empLeaveCount = aLeaveBalances.filter((each) => {
        })
        const oUserModel = new sap.ui.model.json.JSONModel(aLeaveBalances);
        this.getOwnerComponent().setModel(oLeaveBalance, "leavebalance");
        console.log(aLeaveBalances);
      });

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
    handleChange: function (oEvent) {
      oDP = oEvent.getSource(),
        sValue = oEvent.getParameter("value"),
        bValid = oEvent.getParameter("valid");
      this._iEvent++;
      if (bValid) {
        oDP.setValueState(ValueState.None);
      } else {
        oDP.setValueState(ValueState.Error);
      }
    },
  });
});