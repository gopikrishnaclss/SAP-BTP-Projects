sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/ValueState"
], function (Controller, MessageToast,MessageBox, Fragment, JSONModel, ValueState) {

  "use strict";

  return Controller.extend("leavemanagement.controller.Main", {
    onInit() {
      this.empId;
      // Restore User Model After Refresh
      const oStoredUser = sessionStorage.getItem("currentUser");
      if (oStoredUser) {
        const oUserData = JSON.parse(oStoredUser);
        const oUserModel = new JSONModel(oUserData);
        this.getOwnerComponent().setModel(oUserModel, "currentUser");
      } else {
        // If no session redirect login
        this.getOwnerComponent().getRouter().navTo("RouteView1");
        return;
      }
      // prevent this back button go to login screen
      history.pushState(null, null, location.href);
      window.onpopstate = function () {
        history.go(1);
      };
      this._getLeaveBalance();
    },
    onAfterRendering: function () {
      const oTitle = this.byId("idTitle");
      if (oTitle) {
        oTitle.$().off("click").on("click", function () {
          this.onGoHome();
        }.bind(this));
      }
    },
    onGoHome: function () {
      const oNavContainer = sap.ui.getCore().byId(
        this.createId("pageContainer")
      );
      const oHomePage = sap.ui.getCore().byId(
        this.createId("Home")
      );
      oNavContainer.to(oHomePage);
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
      });
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
    pressUserIcon: async function (oEvent) {
      if (!this._oPopover) {
        this._oPopover = await Fragment.load({
          name: "leavemanagement.fragments.UserDetail",
          controller: this
        });
        this.getView().addDependent(this._oPopover);
      }
      this._oPopover.openBy(oEvent.getSource());
    },
    onListItemPress: function (oEvent) {
      const sTitle = oEvent.getSource().getTitle();
      switch (sTitle) {
        case "Sign Out":
          sessionStorage.clear();
          MessageToast.show("Logged out successfully");
          this.getOwnerComponent().getRouter().navTo("RouteView1", {}, true);
          break;
        case "About":
          MessageToast.show("About clicked");
          break;
        case "Settings":
          MessageToast.show("Settings clicked");
          break;
        case "Change Password":
          this.onChangePasswordFragmentOpen();
          break;
        default:
          MessageToast.show(sTitle + " clicked");
          break;
      }
    },
    onChangePasswordFragmentOpen: function () {
      if (!this.oChangePasswordDialog) {
        this.oChangePasswordDialog = sap.ui.xmlfragment(
          "leavemanagement.fragments.ChangePassword", this);
        this.getView().addDependent(this.oChangePasswordDialog);
      }
      this.oChangePasswordDialog.open();
    },
    onUpdatePassword: function () {
      const sUserId = sap.ui.getCore().byId("userId").getValue();
      const sOldPassword = sap.ui.getCore().byId("idOldPassword").getValue();
      const sNewPassword = sap.ui.getCore().byId("idNewPassword").getValue();
      const sConfirmPassword = sap.ui.getCore().byId("idConformPassword").getValue();
      if (!sOldPassword || !sNewPassword || !sConfirmPassword) {
        MessageBox.information("Please fill all fields");
        return;
      }
      if (sNewPassword !== sConfirmPassword) {
        MessageBox.information("New Password and Confirm Password do not match");
        return;
      }
      MessageBox.information("Password updated successfully");
    },
    onChangePasswordFragmentClose: function () {
      this.oChangePasswordDialog.close();
    },
    onHolidayListButtonPress: async function () {
      const aHolidays = [
        {
          date: "01-01-2026",
          day: "Thursday",
          name: "New Year"
        },
        {
          date: "26-01-2026",
          day: "Monday",
          name: "Republic Day"
        },
        {
          date: "15-08-2026",
          day: "Saturday",
          name: "Independence Day"
        },
        {
          date: "02-10-2026",
          day: "Friday",
          name: "Gandhi Jayanti"
        }
      ];
      const oHolidayModel = new sap.ui.model.json.JSONModel({
        holidays: aHolidays
      });
      if (!this.oHolidayDialog) {
        this.oHolidayDialog = await sap.ui.core.Fragment.load({
          name: "leavemanagement.fragments.HolidayList",
          controller: this
        });
        this.getView().addDependent(this.oHolidayDialog);
      }
      this.oHolidayDialog.setModel(oHolidayModel, "holiday");
      this.oHolidayDialog.open();
    },
    onCloseHolidayDialog: function () {
      this.oHolidayDialog.close();
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
      const leaveTypeId = this.getView().byId("Leave").getSelectedKey();
      const reason = this.getView().byId("reason").getValue();

      if (!fromDateObj || !toDateObj || !leaveTypeId || !reason) {
        MessageToast.show("Please fill all fields");
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
    }
  });
});