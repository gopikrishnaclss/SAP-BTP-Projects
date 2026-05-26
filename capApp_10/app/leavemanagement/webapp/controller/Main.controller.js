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
      onInit: function () {
        this.empId = null;
        // Restore session
        const oStoredUser = sessionStorage.getItem("currentUser");
        if (!oStoredUser) {
          this.getOwnerComponent().getRouter().navTo("RouteView1");
          return;
        }
        const oUserData = JSON.parse(oStoredUser);
        const oUserModel = new JSONModel(oUserData);
        this.getOwnerComponent().setModel(oUserModel, "currentUser");
        // Prevent back-button to login
        history.pushState(null, null, location.href);
        window.onpopstate = function () {
          history.go(1);
        };
        // Role Check
        const isAdmin = oUserData.role === "Admin";
        // App State Model
        const oAppStateModel = new JSONModel({
          role: oUserData.role,
          headerTitle: isAdmin
            ? "Leave Management – Admin"
            : "Leave Management",
        });
        this.getOwnerComponent().setModel(oAppStateModel, "appState");
        // Load Side Navigation from data.json
        const oNavModel = new JSONModel();
        oNavModel.loadData("model/data.json");
        oNavModel.attachRequestCompleted(
          function () {
            const oData = oNavModel.getData();
            const oFinalNav = isAdmin ? oData.admin : oData.employee;
            this.getOwnerComponent().setModel(
              new JSONModel(oFinalNav),
              "sideNav",
            );
          }.bind(this),
        );
        // ADMIN
        if (isAdmin) {
          this._loadAdminData();
          this.byId("pageContainer").to(this.byId("adminHome"));
        }
        // EMPLOYEE
        else {
          this.empId =
            oUserData.employeeId || sessionStorage.getItem("employeeId");
          if (!this.empId) {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
            return;
          }
          sessionStorage.setItem("employeeId", this.empId);
          this._getLeaveBalance();
          this._getLeaveRequests();
          this.byId("pageContainer").to(this.byId("Home"));
        }
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
        const oNavContainer = this.byId("pageContainer");
        const isAdmin = this._isAdmin();
        const sTargetId = isAdmin ? "adminHome" : "Home";
        oNavContainer.to(this.byId(sTargetId));
      },
      _isAdmin: function () {
        const oAppState = this.getOwnerComponent().getModel("appState");
        return oAppState && oAppState.getProperty("/role") === "Admin";
      },
      onnavigation: function (oEvent) {
        const sKey = oEvent.getParameter("item").getKey();
        const oNavContainer = this.byId("pageContainer");
        const oTargetPage = this.byId(sKey);
        if (oTargetPage) {
          if (sKey === "adminCreateUser") {
            
          }
          oNavContainer.to(oTargetPage);
        }
      },
      onCollapseExpandPress: function () {
        const oSideNavigation = this.byId("sideNavigation");
        oSideNavigation.setExpanded(!oSideNavigation.getExpanded());
      },
      _loadAdminData: function () {
        this._loadAllLeaveRequests();
        this._loadAllEmployees();
      },
      _loadAllLeaveRequests: function () {
        const oModel = this.getOwnerComponent().getModel();
        const oBinding = oModel.bindList(
          "/LeaveRequests",
          undefined,
          undefined,
          undefined,
          {
            $expand: "leaveType,employee",
          },
        );
        oBinding
          .requestContexts()
          .then(
            function (aContexts) {
              const aRequests = aContexts.map(function (oCtx) {
                return oCtx.getObject();
              });
              // Enrich with employee full name if expand returns the employee object
              aRequests.forEach(function (oReq) {
                if (oReq.employee) {
                  oReq.employeeName =
                    (oReq.employee.firstName || "") +
                    " " +
                    (oReq.employee.lastName || "");
                } else {
                  oReq.employeeName = oReq.employee_employeeId || "";
                }
              });
              this.getOwnerComponent().setModel(
                new JSONModel(aRequests),
                "adminLeaveRequests",
              );
              // Compute dashboard counters
              const iPending = aRequests.filter(function (r) {
                return r.status === "PENDING";
              }).length;
              const iApproved = aRequests.filter(function (r) {
                return r.status === "APPROVED";
              }).length;
              this.getOwnerComponent().setModel(
                new JSONModel({
                  pendingApprovals: iPending,
                  approvedToday: iApproved,
                  totalRequests: aRequests.length,
                  totalEmployees: 0, // filled after employee load
                }),
                "adminDashboard",
              );
            }.bind(this),
          )
          .catch(function (oErr) {
            console.error("Failed to load all leave requests", oErr);
          });
      },
      _loadAllEmployees: function () {
        const oModel = this.getOwnerComponent().getModel();
        const oBinding = oModel.bindList("/Employees");
        oBinding
          .requestContexts()
          .then(
            function (aContexts) {
              const aEmps = aContexts.map(function (oCtx) {
                return oCtx.getObject();
              });
              this.getOwnerComponent().setModel(
                new JSONModel(aEmps),
                "allEmployees",
              );
              // Patch total employee count into dashboard model
              const oDashboard =
                this.getOwnerComponent().getModel("adminDashboard");
              if (oDashboard) {
                oDashboard.setProperty("/totalEmployees", aEmps.length);
              }
            }.bind(this),
          )
          .catch(function (oErr) {
            console.error("Failed to load employees", oErr);
          });
      },
      onAdminRefreshLeaveRequests: function () {
        this._loadAllLeaveRequests();
        MessageToast.show("Leave requests refreshed");
      },
      onRefreshEmployees: function () {
        this._loadAllEmployees();
        MessageToast.show("Employee list refreshed");
      },
      onApproveLeave: function (oEvent) {
        const oCtx = oEvent.getSource().getBindingContext("adminLeaveRequests");
        const oRequest = oCtx.getObject();
        this._updateLeaveStatus(oRequest, "APPROVED");
      },
      onRejectLeave: function (oEvent) {
        const oCtx = oEvent.getSource().getBindingContext("adminLeaveRequests");
        const oRequest = oCtx.getObject();
        MessageBox.confirm(
          "Reject leave request for " +
            (oRequest.employeeName || oRequest.employee_employeeId) +
            "?",
          {
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                this._updateLeaveStatus(oRequest, "REJECTED");
              }
            }.bind(this),
          },
        );
      },
      _updateLeaveStatus: function (oRequest, sNewStatus) {
        const oModel = this.getOwnerComponent().getModel();
        // Build the PATCH path using the request's key
        const sPath = "/LeaveRequests(" + oRequest.leaveRequestId + ")";
        const oContextBinding = oModel.bindContext(sPath);
        oContextBinding
          .requestObject()
          .then(function () {
            const oBoundContext = oContextBinding.getBoundContext();
            oBoundContext.setProperty("status", sNewStatus);
            return oModel.submitBatch("$auto");
          })
          .then(
            function () {
              MessageToast.show("Status updated to " + sNewStatus);
              this._loadAllLeaveRequests(); // refresh the table
            }.bind(this),
          )
          .catch(function (oErr) {
            console.error("Status update failed", oErr);
            MessageBox.error("Failed to update status. Please try again.");
          });
      },
      onAdminSearchLeave: function (oEvent) {
        const sQuery = oEvent.getParameter("query").toLowerCase();
        const oModel = this.getOwnerComponent().getModel("adminLeaveRequests");
        if (!oModel) return;
        const aAll = oModel.getData();
        if (!sQuery) {
          this.getOwnerComponent().setModel(
            new JSONModel(aAll),
            "adminLeaveRequests",
          );
          return;
        }
        // We keep original data in _aAllLeaveRequests for filtering
        if (!this._aAllLeaveRequests) {
          this._aAllLeaveRequests = aAll.slice();
        }
        const aFiltered = this._aAllLeaveRequests.filter(function (r) {
          return (
            (r.employee_employeeId || "").toLowerCase().includes(sQuery) ||
            (r.employeeName || "").toLowerCase().includes(sQuery)
          );
        });
        this.getOwnerComponent().setModel(
          new JSONModel(aFiltered),
          "adminLeaveRequests",
        );
      },
      _cacheAllLeaveRequests: function (aRequests) {
        this._aAllLeaveRequests = aRequests.slice();
      },
      onCreateUser: function () {
        const oModel = this.getOwnerComponent().getModel();
        const sFirstName = this.byId("newFirstName").getValue().trim();
        const sLastName = this.byId("newLastName").getValue().trim();
        const sEmployeeId = this.byId("newEmployeeId").getValue().trim();
        const sEmail = this.byId("newEmail").getValue().trim();
        const sPhone = this.byId("newPhone").getValue().trim();
        const sLocation = this.byId("newLocation").getValue().trim();
        const sTeam = this.byId("newTeam").getValue().trim();
        const sRole = this.byId("newRole").getSelectedKey();
        const sPassword = this.byId("newPassword").getValue();
        // Required field validation
        if (
          !sFirstName ||
          !sLastName ||
          !sEmployeeId ||
          !sEmail ||
          !sRole ||
          !sPassword
        ) {
          MessageToast.show("Please fill all required fields");
          return;
        }
        if (sPassword.length < 8) {
          MessageBox.information("Password must be at least 8 characters");
          return;
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail)) {
          MessageBox.information("Please enter a valid email address");
          return;
        }
        sap.ui.getCore().getMessageManager().removeAllMessages();
        const oListBinding = oModel.bindList("/Employees");
        oListBinding.create({
          employeeId: sEmployeeId,
          firstName: sFirstName,
          lastName: sLastName,
          email: sEmail,
          phNo: sPhone,
          location: sLocation,
          Team: sTeam,
          role: sRole,
          password: sPassword,
          isActive: true,
        });
        oModel
          .submitBatch("$auto")
          .then(
            function () {
              const aMessages = sap.ui
                .getCore()
                .getMessageManager()
                .getMessageModel()
                .getData();
              if (aMessages.length > 0) {
                MessageBox.error(aMessages[0].message);
                return;
              }
              MessageBox.success(
                "Employee '" +
                  sFirstName +
                  " " +
                  sLastName +
                  "' created successfully.",
                {
                  onClose: function () {
                    this.onClearCreateUser();
                    this._loadAllEmployees();
                  }.bind(this),
                },
              );
            }.bind(this),
          )
          .catch(function (oErr) {
            console.error("Create user failed", oErr);
            MessageBox.error("Failed to create employee. Please try again.");
          });
      },
      onClearCreateUser: function () {
        [
          "newFirstName",
          "newLastName",
          "newEmployeeId",
          "newEmail",
          "newPhone",
          "newLocation",
          "newTeam",
          "newPassword",
        ].forEach(
          function (sId) {
            const oCtrl = this.byId(sId);
            if (oCtrl) {
              oCtrl.setValue("");
              oCtrl.setValueState("None");
            }
          }.bind(this),
        );
        const oRole = this.byId("newRole");
        if (oRole) {
          oRole.setSelectedKey("Employee");
        }
      },
      onAdminTilePress: function () {
        // Tiles are informational; can be extended to drill-down later
      },
      _getLeaveBalance: function () {
        const oModel = this.getOwnerComponent().getModel();
        const oBinding = oModel.bindList(
          "/LeaveBalances",
          undefined,
          undefined,
          undefined,
          {
            $filter: "employee_employeeId eq '" + this.empId + "'",
            $expand: "leaveType",
          },
        );
        oBinding.requestContexts().then(
          function (aContexts) {
            const aLeaveBalances = aContexts.map(function (oCtx) {
              return oCtx.getObject();
            });
            const oFormatted = {};
            aLeaveBalances.forEach(function (item) {
              oFormatted[item.leaveType.leaveType] = item;
            });
            this.getOwnerComponent().setModel(
              new JSONModel(oFormatted),
              "leavebalance",
            );
          }.bind(this),
        );
      },
      _getLeaveRequests: function () {
        const oModel = this.getOwnerComponent().getModel();
        const oBinding = oModel.bindList(
          "/LeaveRequests",
          undefined,
          undefined,
          undefined,
          {
            $filter: "employee_employeeId eq '" + this.empId + "'",
            $expand: "leaveType",
          },
        );
        oBinding.requestContexts().then(
          function (aContexts) {
            const aRequests = aContexts.map(function (oCtx) {
              return oCtx.getObject();
            });
            this.getOwnerComponent().setModel(
              new JSONModel(aRequests),
              "leaveRequest",
            );
            const iPending = aRequests.filter(function (r) {
              return r.status === "PENDING";
            }).length;
            this.getOwnerComponent().setModel(
              new JSONModel({ pendingCount: iPending }),
              "dashboard",
            );
          }.bind(this),
        );
      },
      onRefreshLeaveRequests: function () {
        this._getLeaveRequests();
        MessageToast.show("Leave requests refreshed");
      },
      onApplyLeave: function () {
        const oModel = this.getOwnerComponent().getModel();
        const fromDateObj = this.byId("DP1").getDateValue();
        const toDateObj = this.byId("DP2").getDateValue();
        const leaveTypeId = this.byId("Leave").getSelectedKey();
        const reason = this.byId("reason").getValue();
        if (!fromDateObj || !toDateObj || !leaveTypeId || !reason) {
          MessageToast.show("Please fill all fields");
          return;
        }
        if (toDateObj < fromDateObj) {
          MessageBox.error("End date must be after start date");
          return;
        }
        sap.ui.getCore().getMessageManager().removeAllMessages();
        const formatDate = function (oDate) {
          const y = oDate.getFullYear();
          const m = String(oDate.getMonth() + 1).padStart(2, "0");
          const d = String(oDate.getDate()).padStart(2, "0");
          return y + "-" + m + "-" + d;
        };
        const oListBinding = oModel.bindList("/LeaveRequests");
        oListBinding.create({
          employee_employeeId: this.empId,
          leaveType_leaveTypeId: parseInt(leaveTypeId),
          fromDate: formatDate(fromDateObj),
          toDate: formatDate(toDateObj),
          reason: reason,
        });
        oModel
          .submitBatch("$auto")
          .then(
            function () {
              const aMessages = sap.ui
                .getCore()
                .getMessageManager()
                .getMessageModel()
                .getData();
              if (aMessages.length > 0) {
                MessageBox.error(aMessages[0].message);
                return;
              }
              MessageBox.success("Leave applied successfully");
              this._resetApplyLeaveForm();
              oModel.refresh();
            }.bind(this),
          )
          .catch(function (oErr) {
            console.error(oErr);
            MessageBox.error("Failed to apply leave");
          });
      },
      handleChange: function () {
        const oDP1 = this.byId("DP1");
        const oDP2 = this.byId("DP2");
        const oNoOfDays = this.byId("noOfDays");
        const dFrom = oDP1.getDateValue();
        const dTo = oDP2.getDateValue();
        if (!dFrom || !dTo) {
          oNoOfDays.setValue("");
          return;
        }
        if (dTo.getDay() === 0 || dTo.getDay() === 6) {
          oDP2.setValue("");
          oDP2.setValueState("Error");
          oDP2.setValueStateText("Weekend selection not allowed");
          return;
        }
        if (dTo < dFrom) {
          oNoOfDays.setValue("");
          oDP2.setValueState("Error");
          oDP2.setValueStateText("End date must be after start date");
          return;
        }
        oDP2.setValueState("None");
        let iDays = 0;
        const dCur = new Date(dFrom);
        while (dCur <= dTo) {
          const iDay = dCur.getDay();
          if (iDay !== 0 && iDay !== 6) {
            iDays++;
          }
          dCur.setDate(dCur.getDate() + 1);
        }
        oNoOfDays.setValue(iDays.toString());
      },
      onFromDateChange: function () {
        const oDP1 = this.byId("DP1");
        const oDP2 = this.byId("DP2");
        const dFrom = oDP1.getDateValue();
        if (!dFrom) {
          return;
        }
        if (dFrom.getDay() === 0 || dFrom.getDay() === 6) {
          oDP1.setValue("");
          oDP1.setDateValue(null);
          oDP1.setValueState("Error");
          oDP1.setValueStateText("Weekend selection not allowed");
          return;
        }
        oDP1.setValueState("None");
        oDP2.setMinDate(dFrom);
        if (oDP2.getDateValue() && oDP2.getDateValue() < dFrom) {
          oDP2.setDateValue(null);
        }
        this.handleChange();
      },
      onCancelLeave: function () {
        ["DP1", "DP2"].forEach(
          function (sId) {
            this.byId(sId).setValue("");
            this.byId(sId).setValueState("None");
          }.bind(this),
        );
        this.byId("noOfDays").setValue("");
        this.byId("Leave").setValue("");
        this.byId("reason").setValue("");
      },
      _resetApplyLeaveForm: function () {
        this.byId("DP1").setDateValue(null);
        this.byId("DP2").setDateValue(null);
        this.byId("Leave").setSelectedKey("");
        this.byId("reason").setValue("");
        this.byId("noOfDays").setValue("");
        this._getLeaveBalance();
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
            // Clear models
            this.getOwnerComponent().setModel(null, "currentUser");
            this.getOwnerComponent().setModel(null, "appState");
            this.getOwnerComponent().setModel(null, "sideNav");
            // Reset NavContainer
            const oNav = this.byId("pageContainer");
            if (oNav) {
              oNav.backToTop();
            }
            MessageToast.show("Logged out successfully");
            this.getOwnerComponent().getRouter().navTo("RouteView1", {}, true);
            window.location.reload();
            break;
          case "ChangePassword":
            this.onChangePasswordFragmentOpen();
            break;
          default:
            MessageToast.show(sId + " clicked");
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
        if (!this.oHolidayDialog) {
          this.oHolidayDialog = await sap.ui.core.Fragment.load({
            name: "leavemanagement.fragments.HolidayList",
            controller: this,
          });
          this.getView().addDependent(this.oHolidayDialog);
        }
        this.oHolidayDialog.open();
      },
      onCloseHolidayDialog: function () {
        this.oHolidayDialog.close();
      },
    });
  },
);
