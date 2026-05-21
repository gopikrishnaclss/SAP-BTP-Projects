sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/ValueState",
  ],
  function (
    Controller,
    MessageToast,
    MessageBox,
    Fragment,
    JSONModel,
    ValueState,
  ) {
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
        this._getLeaveRequests();
      },
      onAfterRendering: function () {
        const oTitle = this.byId("idTitle");
        if (oTitle) {
          oTitle
            .$()
            .off("click")
            .on(
              "click",
              function () {
                this.onGoHome();
              }.bind(this),
            );
        }
      },
      onGoHome: function () {
        const oNavContainer = sap.ui
          .getCore()
          .byId(this.createId("pageContainer"));
        const oHomePage = sap.ui.getCore().byId(this.createId("Home"));
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
        const oLeaveBalanceBinding = oModel.bindList(
          "/LeaveBalances",
          undefined,
          undefined,
          undefined,
          {
            $filter: `employee_employeeId eq '${this.empId}'`,
            $expand: "leaveType",
          },
        );
        oLeaveBalanceBinding.requestContexts().then((aContexts) => {
          const aLeaveBalances = aContexts.map((oContext) =>
            oContext.getObject(),
          );
          // Transform array -> object
          const oFormattedData = {};
          aLeaveBalances.forEach((item) => {
            const sLeaveType = item.leaveType.leaveType;
            oFormattedData[sLeaveType] = item;
          });
          const oLeaveBalanceModel = new sap.ui.model.json.JSONModel(
            oFormattedData,
          );
          this.getOwnerComponent().setModel(oLeaveBalanceModel, "leavebalance");
        });
      },
      _getLeaveRequests: function () {
        const oModel = this.getOwnerComponent().getModel();
        const oLeaveRequestsBinding = oModel.bindList(
          "/LeaveRequests",
          undefined,
          undefined,
          undefined,
          {
            $filter: `employee_employeeId eq '${this.empId}'`,
            $expand: "leaveType",
          },
        );
        oLeaveRequestsBinding.requestContexts().then((aContexts) => {
          const aLeaveRequestsBalances = aContexts.map((oContext) =>
            oContext.getObject(),
          );
          const oLeaveRequestsModel = new sap.ui.model.json.JSONModel(
            aLeaveRequestsBalances,
          );
          this.getOwnerComponent().setModel(
            oLeaveRequestsModel,
            "leaveRequest",
          );
        });
      },

      onApplyLeave() {
        const oModel = this.getOwnerComponent().getModel();
        const oUserModel = this.getOwnerComponent().getModel("currentUser");
        const empId = this.empId
        const fromDateObj = this.getView().byId("DP1").getDateValue();
        const toDateObj = this.getView().byId("DP2").getDateValue();
        const leaveTypeId = this.getView().byId("Leave").getSelectedKey(); // ← fixed
        const reason = this.getView().byId("reason").getValue();

        if (!fromDateObj || !toDateObj || !leaveTypeId || !reason) {
          sap.m.MessageToast.show("Please fill all fields");
          return;
        }

        const fromDate = fromDateObj.toISOString().split("T")[0];
        const toDate = toDateObj.toISOString().split("T")[0];

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
            const msg = aMessages[2].message;
            MessageToast.show(msg);
            return;
          }
          MessageBox.success("Leave applied successfully");
          this._resetApplyLeaveForm();
          oModel.refresh();
        });
      },
      onnavigation: function (oEvent) {
        const sKey = oEvent.getParameter("item").getKey();
        const oNavContainer = this.byId("pageContainer");
        switch (sKey) {
          case "page1":
            oNavContainer.to(this.byId("page1"));
            break;
        }
      },
      pressUserIcon: async function (oEvent) {
        if (!this._oPopover) {
          this._oPopover = await Fragment.load({
            name: "leavemanagement.fragments.UserDetail",
            controller: this,
          });
          this.getView().addDependent(this._oPopover);
        }
        this._oPopover.openBy(oEvent.getSource());
      },
      onListItemPress: function (oEvent) {
        const oNavContainer = this.byId("pageContainer");
        const sId = oEvent.getSource().getId();
        switch (sId) {
          case "Profile":
            oNavContainer.to(this.byId("page2"));
            break;
          case "SignOut":
            sessionStorage.clear();
            MessageToast.show("Logged out successfully");
            this.getOwnerComponent().getRouter().navTo("RouteView1", {}, true);
            break;
          case "ChangePassword":
            this.onChangePasswordFragmentOpen();
            break;
          default:
            MessageToast.show(sId + " clicked");
            break;
        }
      },
      onChangePasswordFragmentOpen: function () {
        if (!this.oChangePasswordDialog) {
          this.oChangePasswordDialog = sap.ui.xmlfragment(
            "leavemanagement.fragments.ChangePassword",
            this,
          );
          this.getView().addDependent(this.oChangePasswordDialog);
        }
        this.oChangePasswordDialog.open();
      },
      onUpdatePassword: function () {
        const sUserId = sap.ui.getCore().byId("userId").getValue();
        const sOldPassword = sap.ui.getCore().byId("idOldPassword").getValue();
        const sNewPassword = sap.ui.getCore().byId("idNewPassword").getValue();
        const sConfirmPassword = sap.ui
          .getCore()
          .byId("idConformPassword")
          .getValue();
        if (!sOldPassword || !sNewPassword || !sConfirmPassword) {
          MessageBox.information("Please fill all fields");
          return;
        }
        if (sNewPassword !== sConfirmPassword) {
          MessageBox.information(
            "New Password and Confirm Password do not match",
          );
          return;
        }
        MessageBox.information("Password updated successfully");
      },
      onChangePasswordFragmentClose: function () {
        this.oChangePasswordDialog.close();
      },
      onHolidayListButtonPress: async function () {
        // const oHolidayModel = new sap.ui.model.json.JSONModel({
        //   holidays: aHolidays,
        // });
        if (!this.oHolidayDialog) {
          this.oHolidayDialog = await sap.ui.core.Fragment.load({
            name: "leavemanagement.fragments.HolidayList",
            controller: this,
          });
          this.getView().addDependent(this.oHolidayDialog);
        }
        // this.oHolidayDialog.setModel(oHolidayModel, "holiday");
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
      handleChange: function () {
        var oDP1 = this.byId("DP1");
        var oDP2 = this.byId("DP2");
        var oNoOfDays = this.byId("noOfDays");
        var dFrom = oDP1.getDateValue();
        var dTo = oDP2.getDateValue();
        if (dFrom && dTo && dTo >= dFrom) {
          var iDays = 0;
          var dCur = new Date(dFrom);
          while (dCur <= dTo) {
            var iDay = dCur.getDay();
            if (iDay !== 0 && iDay !== 6) {
              // skip Saturday & Sunday
              iDays++;
            }
            dCur.setDate(dCur.getDate() + 1);
          }
          oNoOfDays.setValue(iDays);
          oDP2.setValueState("None");
        } else if (dFrom && dTo && dTo < dFrom) {
          oNoOfDays.setValue("");
          oDP2.setValueState("Error");
          oDP2.setValueStateText("End date must be after start date");
          return;
        }
        // Clear error state if valid
        oDP2.setValueState("None");
        oDP2.setValueStateText("");
        // Count working days (Mon–Fri only, skip weekends)
        var iDays = 0;
        var dCur = new Date(dFrom.getTime()); // clone to avoid mutation
        while (dCur <= dTo) {
          var iDay = dCur.getDay();
          if (iDay !== 0 && iDay !== 6) {
            iDays++;
          }
          dCur.setDate(dCur.getDate() + 1);
        }
        // Set value directly on the Input control
        oNoOfDays.setValue(String(iDays));
      },
      onCancelLeave: function () {
        this.byId("DP1").setValue("");
        this.byId("DP1").setValueState("None");
        this.byId("DP2").setValue("");
        this.byId("DP2").setValueState("None");
        this.byId("noOfDays").setValue("");
        this.byId("Leave").setValue("");
        this.byId("reason").setValue("");
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
        this.getView().byId("DP1").setDateValue(null);
        this.getView().byId("DP2").setDateValue(null);
        this.getView().byId("Leave").setSelectedKey("");
        this.getView().byId("reason").setValue("");
        this.getView().byId("noOfDays").setValue("");
        this._getLeaveBalance();
      },
    });
  }
);
