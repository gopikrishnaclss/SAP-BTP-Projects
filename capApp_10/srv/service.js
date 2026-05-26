import bcrypt from "bcrypt";
import cds from "@sap/cds";

const { SELECT, INSERT, UPDATE } = cds.ql;

export default class leaveManagementService extends cds.ApplicationService {
  async init() {

    // LOGIN  
    this.on("login", async (req) => {
      const { email, password } = req.data;

      const user = await SELECT.one
        .from("leaveApp.Employees")
        .columns("*", "role.ID", "role.roleName")
        .where({ email });

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
        role: user.role_roleName,
        success: true,
        message: "Login successful",
        location: user.location,
        phNo: user.phNumber,
      };
    });

    //  CREATE EMPLOYEE
    this.before("CREATE", "Employees", async (req) => {
      const data = req.data;

      // Check duplicate email
      const existingUser = await SELECT.one
        .from("leaveApp.Employees")
        .where({ email: data.email });

      if (existingUser) {
        req.reject(400, "Employee with this email already exists");
        return;
      }

      // Encrypt password
      data.password = await bcrypt.hash(data.password, 10);

      // Default joining date
      if (!data.joiningDate) {
        data.joiningDate = new Date().toISOString().split("T")[0];
      }

      // Default active status
      data.isActive = true;
    });

    // CREATE LEAVE BALANCE
    this.after("CREATE", "Employees", async (data, req) => {

      const tx = cds.transaction(req);

      // Get all leave types
      const leaveTypes = await tx.run(
        SELECT.from("leaveApp.LeaveType")
      );

      // Prepare leave balance entries
      const leaveBalances = leaveTypes.map((leave) => ({
        employee_employeeId: data.employeeId,
        leaveType_leaveTypeId: leave.leaveTypeId,
        totalLeave: leave.totalLeaves,
        usedLeave: 0,
        remaningLeaves: leave.totalLeaves,
      }));

      // Insert leave balances
      await tx.run(
        INSERT.into("leaveApp.LeaveBalance").entries(leaveBalances)
      );
    });

    // ================= APPLY LEAVE =================
    this.before("CREATE", "LeaveRequests", async (req) => {

      const {
        fromDate,
        toDate,
        employee_employeeId,
        leaveType_leaveTypeId,
      } = req.data;

      const start = new Date(fromDate);
      const end = new Date(toDate);

      const totalDays =
        Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (totalDays <= 0) {
        req.reject(400, "End date must be after start date");
        return;
      }

      req.data.totalDays = totalDays;
      req.data.appliedOn = new Date().toISOString();
      req.data.status = "PENDING";

      // Duplicate leave validation
      const existing = await SELECT.one
        .from("leaveApp.LeaveRequest")
        .where({
          employee_employeeId,
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

      // Get leave balance
      const balance = await SELECT.one
        .from("leaveApp.LeaveBalance")
        .where({
          employee_employeeId,
          leaveType_leaveTypeId,
        });

      if (!balance) {
        req.reject(400, "No leave balance found for this leave type");
        return;
      }

      // Insufficient balance
      if (balance.remaningLeaves < totalDays) {
        req.reject(
          400,
          `Insufficient leave balance. Available: ${balance.remaningLeaves} days, Requested: ${totalDays} days`,
        );
        return;
      }

      // Update leave balance
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

    // ================= TOTAL EMPLOYEE COUNT =================
    this.on("totalEmp", async () => {

      const result = await SELECT.one
        .from("leaveApp.Employees")
        .columns("count(*) as total");

      return result.total;
    });

    return super.init();
  }
}