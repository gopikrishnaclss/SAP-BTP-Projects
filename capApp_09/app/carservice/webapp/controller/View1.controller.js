sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";
    var _generatedOtp = "";
    var _otpVerified = false;
    return Controller.extend("carservice.controller.View1", {
        onInit() {
        },
        onCollapseExpandPress() {
            const oSideNavigation = this.byId("sideNavigation"),
                bExpanded = oSideNavigation.getExpanded();

            oSideNavigation.setExpanded(!bExpanded);
        },
        onShowRegister: function () {
            this.byId("loginCard").setVisible(false);
            this.byId("registerCard").setVisible(true);
            this._resetRegisterForm();
        },

        onShowLogin: function () {
            this.byId("registerCard").setVisible(false);
            this.byId("loginCard").setVisible(true);
        },

        // ── Login ────────────────────────────────────────────
        onLogin: function () {
            var sUser = this.byId("userId").getValue().trim();
            var sPass = this.byId("password").getValue().trim();

            if (!sUser || !sPass) {
                this.byId("loginError").setText("Please enter both User ID and Password.");
                this.byId("loginError").setVisible(true);
                return;
            }

            // Replace with real auth / OData call
            if (sUser === "admin" && sPass === "admin123") {
                this.byId("loginError").setVisible(false);
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("main");
            } else {
                this.byId("loginError").setText("Invalid credentials. Please try again.");
                this.byId("loginError").setVisible(true);
            }
        },

        // ── Send OTP ─────────────────────────────────────────
        onSendOtp: function () {
            var sEmail = this.byId("regEmail").getValue().trim();

            if (!sEmail || !this._isValidEmail(sEmail)) {
                MessageToast.show("Please enter a valid email address.");
                return;
            }

            // Generate 6-digit OTP
            _generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            _otpVerified = false;

            // ── Replace this block with real email API call ──
            // e.g. fetch("/api/send-otp", { method:"POST", body: JSON.stringify({ email: sEmail, otp: _generatedOtp }) })
            // For demo: show OTP in toast
            MessageToast.show("OTP sent! (Demo OTP: " + _generatedOtp + ")");

            this.byId("otpSection").setVisible(true);
            this.byId("otpSentMsg").setVisible(true);
            this.byId("otpVerifiedMsg").setVisible(false);
            this.byId("otpErrorMsg").setVisible(false);
            this.byId("regOtp").setValue("");
            this.byId("passwordSection").setVisible(false);
            this.byId("registerSubmitBtn").setEnabled(false);
        },

        // ── Verify OTP ───────────────────────────────────────
        onVerifyOtp: function () {
            var sEnteredOtp = this.byId("regOtp").getValue().trim();

            if (sEnteredOtp === _generatedOtp) {
                _otpVerified = true;
                this.byId("otpVerifiedMsg").setVisible(true);
                this.byId("otpErrorMsg").setVisible(false);
                this.byId("passwordSection").setVisible(true);
                this.byId("registerSubmitBtn").setEnabled(true);
                MessageToast.show("Email verified successfully!");
            } else {
                _otpVerified = false;
                this.byId("otpErrorMsg").setVisible(true);
                this.byId("otpVerifiedMsg").setVisible(false);
                this.byId("passwordSection").setVisible(false);
                this.byId("registerSubmitBtn").setEnabled(false);
            }
        },

        // ── Register ─────────────────────────────────────────
        onRegister: function () {
            var sName = this.byId("regName").getValue().trim();
            var sEmail = this.byId("regEmail").getValue().trim();
            var sPass = this.byId("regPassword").getValue().trim();
            var sConfirm = this.byId("regConfirmPassword").getValue().trim();

            if (!sName || !sEmail || !sPass || !sConfirm) {
                this.byId("registerError").setText("Please fill in all fields.");
                this.byId("registerError").setVisible(true);
                return;
            }

            if (!_otpVerified) {
                this.byId("registerError").setText("Please verify your email first.");
                this.byId("registerError").setVisible(true);
                return;
            }

            if (sPass !== sConfirm) {
                this.byId("registerError").setText("Passwords do not match.");
                this.byId("registerError").setVisible(true);
                return;
            }

            if (sPass.length < 6) {
                this.byId("registerError").setText("Password must be at least 6 characters.");
                this.byId("registerError").setVisible(true);
                return;
            }

            // ── Replace with real OData / API registration call ──
            // e.g. this.getOwnerComponent().getModel().create("/Users", { Name: sName, Email: sEmail, Password: sPass })

            this.byId("registerError").setVisible(false);
            this.byId("registerSuccess").setVisible(true);
            this.byId("registerSubmitBtn").setEnabled(false);

            setTimeout(function () {
                this.onShowLogin();
            }.bind(this), 2000);
        },

        // ── Helpers ──────────────────────────────────────────
        _isValidEmail: function (sEmail) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail);
        },

        _resetRegisterForm: function () {
            ["regName", "regEmail", "regOtp", "regPassword", "regConfirmPassword"]
                .forEach(function (sId) { this.byId(sId).setValue(""); }.bind(this));
            ["otpSection", "otpSentMsg", "otpVerifiedMsg", "otpErrorMsg",
                "passwordSection", "registerError", "registerSuccess"]
                .forEach(function (sId) { this.byId(sId).setVisible(false); }.bind(this));
            this.byId("registerSubmitBtn").setEnabled(false);
            _generatedOtp = "";
            _otpVerified = false;
        }

    });
});