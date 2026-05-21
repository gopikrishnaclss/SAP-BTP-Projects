import bcrypt from "bcrypt";
import cds from "@sap/cds";

export default class leaveManagementService extends cds.ApplicationService {
  async init() {
    this.on("login", async (req) => {
      const { email, password } = req.data;

      const user = await SELECT.one.from("leaveApp.Employees").where({ email });

      if (!user) {
        return {
          success: false,
          message: "Email not found",
          employeeId: null,
          firstName: null,
        };
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return {
          success: false,
          message: "Invalid password",
          employeeId: null,
          firstName: null,
        };
      }

      return {
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        Team: user.Team,
        joiningDate: user.joiningDate,
        isActive: user.isActive,
        role: user.role,
        success: true,
        message: "Login successful",
        location:user.location,
        phNo:user.phNumber
      };
    });
    this.before("CREATE", "LeaveRequests", async (req) => {
      const { fromDate, toDate, employee_employeeId, leaveType_leaveTypeId } =
        req.data;

      const start = new Date(fromDate);
      const end = new Date(toDate);

      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (totalDays <= 0) {
        req.reject(400, "End date must be after start date");
        return;
      }

      req.data.totalDays = totalDays;
      req.data.appliedOn = new Date().toISOString();
      req.data.status = "PENDING";
      // Check duplicate leave request — same employee, overlapping dates
      const existing = await SELECT.one
        .from("leaveApp.LeaveRequest")
        .where({
          employee_employeeId: employee_employeeId,
          status: { "!=": "REJECTED" },
        })
        .and(`fromDate <= '${toDate}' AND toDate >= '${fromDate}'`);

      if (existing) {
        req.reject(
          400,
          `You already have a leave request from ${existing.fromDate} to ${existing.toDate} with status ${existing.status}`,
        );
        return;
      }
      const balance = await SELECT.one.from("leaveApp.LeaveBalance").where({
        employee_employeeId,
        leaveType_leaveTypeId,
      });

      if (!balance) {
        req.reject(400, "No leave balance found for this leave type");
        return;
      }

      if (balance.remaningLeaves < totalDays) {
        req.reject(
          400,
          `Insufficient leave balance. Available: ${balance.remaningLeaves} days, Requested: ${totalDays} days`,
        );

        return;
      }

      await UPDATE("leaveApp.LeaveBalance")
        .set({
          usedLeave: balance.usedLeave + totalDays,
          remaningLeaves: balance.remaningLeaves - totalDays,
        })
        .where({
          employee_employeeId,
          leaveType_leaveTypeId,
        });
    });

    return super.init();
  }
}
