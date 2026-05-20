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
        const leaveTypeId = this.getView()
          .byId("Leave")
          .getSelectedItem()
          .getText();
        const reason = this.getView().byId("reason").getValue();
        if (!fromDateObj || !toDateObj || !leaveTypeId || !reason) {
          sap.m.MessageToast.show("Please fill all fields");
          return;
        }
        const fromDate = this.formatDateLocal(fromDateObj)
        const toDate = this.formatDateLocal(toDateObj)
        const oListBinding = oModel.bindList("/LeaveRequests");
        oListBinding.create({
          employee_employeeId: this.empId,
          leaveType_leaveTypeId: parseInt(leaveTypeId),
          fromDate,
          toDate,
          reason,
        });

        // Submit batch manually
        oModel.submitBatch("$auto").then(() => {
          const aMessages = sap.ui
            .getCore()
            .getMessageManager()
            .getMessageModel()
            .getData();

          // Backend validation error exists
          if (aMessages.length > 0) {
            const msg = aMessages[0].message;
            MessageToast.show(msg);

            return;
          }

          // Success
          MessageToast.show("Leave applied successfully");

          this._resetApplyLeaveForm();

          oModel.refresh();
        });
        // const oListBinding = oModel.bindList(
        //   "/LeaveRequests",
        //   undefined,
        //   undefined,
        //   undefined,
        //   {
        //     $$updateGroupId: "$direct",
        //   },
        // );

        // const oContext = oListBinding.create(
        //   {
        //     employee_employeeId: this.empId,
        //     leaveType_leaveTypeId: parseInt(leaveTypeId),
        //     fromDate: fromDate,
        //     toDate: toDate,
        //     reason: reason,
        //   },
        //   true,
        //   false,
        //   false,
        // );

        // oContext
        //   .created()
        //   .then(() => {
        //     sap.m.MessageToast.show("Leave applied successfully");
        //     this._resetApplyLeaveForm();
        //     oModel.refresh();
        //   })
        //   .catch((err) => {
        //     // err.message contains the req.reject() message from CAP
        //     sap.m.MessageBox.error(err.message || "Failed to apply leave");
        //   });
      },
      formatDateLocal(oDate) {
        // Accept native Date, UI5Date or objects that expose a Date value
        let d;
        if (!oDate) {
          return "";
        }
        // If it's a UI5 control (DatePicker) it may provide getDateValue()
        if (typeof oDate.getDateValue === "function") {
          d = oDate.getDateValue();
        } else if (oDate instanceof Date) {
          d = oDate;
        } else {
          // Fallback: try to construct a Date
          d = new Date(oDate);
        }

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
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
