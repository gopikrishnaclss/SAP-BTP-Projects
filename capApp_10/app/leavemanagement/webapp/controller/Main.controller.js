sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/m/MessageToast"],
  (Controller, MessageToast) => {
    "use strict";
    return Controller.extend("leavemanagement.controller.Main", {
      onInit() {
        this._getLeaveBalance();
        this.empId;
        //clear the web history for don't allow user to go back to previous page without logout
        // var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        // sap.ui.core.routing.HashChanger.getInstance().attachEvent("hashChanged", function(oEvent) {
        //     var sNewHash = oEvent.getParameter("newHash");

        //     // Force the current view to stay (you can change route name if needed)
        //     if (sNewHash === "" && this.getOwnerComponent().getModel('coreGlobal').getProperty('/_allowNavigation') == false) {
        //     }
        //   }.bind(this));
        //   oRouter.navTo("RouteView2", {}, true); // true = replace history
      },
      _getLeaveBalance: function () {
        const oModel = this.getOwnerComponent().getModel();
        const oUserModel = this.getOwnerComponent().getModel("currentUser");
         
        if (oUserModel && oUserModel.getData().employeeId) {
          this.empId = oUserModel.getData().employeeId;
          sessionStorage.setItem("employeeId", this.empId);
        } else {
          this.empId = sessionStorage.getItem("employeeId");
        }
        if (!this.empId) { 
          this.getOwnerComponent().getRouter().navTo("RouteView1");
          return;
        }
        const oLeaveBalanceBinding = oModel.bindList("/LeaveBalances");
        oLeaveBalanceBinding.requestContexts().then((aContexts) => {
          const aLeaveBalances = aContexts.map((oContext) =>
            oContext.getObject(),
          );
          var empLeaveCount = aLeaveBalances.filter(
            (each) => each.employee_employeeId == this.empId,
          );

          var leaveTypes = {};

          empLeaveCount.forEach((each) => {
            if (each.leaveType_leaveTypeId === 1) {
              leaveTypes.Casual = each.remaningLeaves;
            } else if (each.leaveType_leaveTypeId === 2) {
              leaveTypes.Sick = each.remaningLeaves;
            } else if (each.leaveType_leaveTypeId === 3) {
              leaveTypes.Paid = each.remaningLeaves;
            }
          });

          const oUserModel = new sap.ui.model.json.JSONModel(leaveTypes);
          this.getOwnerComponent().setModel(oUserModel, "leavebalance");
        });
      },
      onnavigation(oEvent) {
        const oItem = oEvent.getParameter("item");
        this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
        const sKey = oEvent.getParameter("item").getKey();
        //  Load the appropriate view
        switch (sKey) {
          case "page1":
            this.byId("pageContainer").to(this.createId("page1"));
            break;
          case "page2":
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
        sessionStorage.clear();
        MessageToast.show("Logged out successfully");
        this.getOwnerComponent().getRouter().navTo("RouteView1");
      },
      onCollapseExpandPress() {
        const oSideNavigation = this.byId("sideNavigation"),
          bExpanded = oSideNavigation.getExpanded();
        oSideNavigation.setExpanded(!bExpanded);
      },
      handleChange: function (oEvent) {
        ((oDP = oEvent.getSource()),
          (sValue = oEvent.getParameter("value")),
          (bValid = oEvent.getParameter("valid")));
        this._iEvent++;
        if (bValid) {
          oDP.setValueState(ValueState.None);
        } else {
          oDP.setValueState(ValueState.Error);
        }
      },

      onApplyLeave() {
        const oModel = this.getOwnerComponent().getModel();
        const oUserModel = this.getOwnerComponent().getModel("currentUser");
         
        var fromDateObj = this.getView().byId("DP1").getDateValue();
        var toDateObj = this.getView().byId("DP2").getDateValue();
        const leaveTypeId = this.getView().byId("Leave").getSelectedItem().getText()
        const reason = this.getView().byId("reason").getValue();

        if (!fromDateObj || !toDateObj || !leaveTypeId || !reason) {
          sap.m.MessageToast.show("Please fill all fields");
          return;
        }
        var fromDate = fromDateObj.toISOString().split("T")[0];
        var toDate = toDateObj.toISOString().split("T")[0];
        const oListBinding = oModel.bindList("/LeaveRequests");

        const oContext = oListBinding.create({
          employee_employeeId: this.empId,
          leaveType_leaveTypeId: parseInt(leaveTypeId),
          fromDate: fromDate,
          toDate: toDate,
          reason: reason,
        });

        oContext
          .created()
          .then(() => {
            sap.m.MessageToast.show("Leave applied successfully");
            this._resetApplyLeaveForm();
          })
          .catch((err) => {
            console.error("Error:", err);
            sap.m.MessageBox.error(err.message || "Failed to apply leave");
          });
      },

      _resetApplyLeaveForm() {
        this.getView().byId("DP1").setValue("");
        this.getView().byId("DP2").setValue("");
        this.getView().byId("Leave").setSelectedKey("");
        this.getView().byId("reason").setValue("");
        this._getLeaveBalance();
      },
    });
  },
);
