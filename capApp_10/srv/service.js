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
      const numberRange = await SELECT.one
        .from("leaveApp.NumberRange")
        .where({ objectName: "EMPLOYEE" });

      if (!numberRange) {
        req.reject(400, "Employee number range not maintained");
      }

      // increment current number
      const nextNo = numberRange.currentNo + 1;

      // generate EMP100001 format
      const empId =
        numberRange.prefix + String(nextNo).padStart(numberRange.length, "0");

      

      // update number range
      await UPDATE("leaveApp.NumberRange")
        .set({ currentNo: nextNo })
        .where({ objectName: "EMPLOYEE" });
    });

    // CREATE LEAVE BALANCE
    this.after("CREATE", "Employees", async (data, req) => {
      const tx = cds.transaction(req);

      // Get all leave types
      const leaveTypes = await tx.run(SELECT.from("leaveApp.LeaveType"));

      // Prepare leave balance entries
      const leaveBalances = leaveTypes.map((leave) => ({
        employee_employeeId: data.employeeId,
        leaveType_leaveTypeId: leave.leaveTypeId,
        totalLeave: leave.totalLeaves,
        usedLeave: 0,
        remaningLeaves: leave.totalLeaves,
      }));

      // Insert leave balances
      await tx.run(INSERT.into("leaveApp.LeaveBalance").entries(leaveBalances));
    });

    // APPLY LEAVE
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
      const balance = await SELECT.one.from("leaveApp.LeaveBalance").where({
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

    //  TOTAL EMPLOYEE COUNT
    this.on("LastEmp", async () => {
      const numberRange = await SELECT.one
        .from("leaveApp.NumberRange")
        .columns("prefix", "currentNo", "length")
        .where({
          objectName: "EMPLOYEE",
        });

      if (!numberRange) {
        return null;
      }

      const nextNumber = numberRange.currentNo + 1;

      const employeeId =
        numberRange.prefix +
        String(nextNumber).padStart(numberRange.length, "0");

      return employeeId;
    });

    // GET EMPLOYEES WITH ROLES
    this.on("getEmployees", async (req) => {
      const employees = await SELECT.from("leaveApp.Employees").columns(
        "*",
        "role.ID",
        "role.roleName",
      );

      return employees.map((emp) => ({
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        Team: emp.Team,
        location: emp.location,
        phNumber: emp.phNumber,
        joiningDate: emp.joiningDate,
        isActive: emp.isActive,
        roleId: emp.role_ID,
        roleName: emp.role_roleName,
      }));
    });

    // DELETE EMPLOYEES
    this.on("deleteEmployees", async (req) => {
      const { employeeIds } = req.data;

      if (!employeeIds || employeeIds.length === 0) {
        req.reject(400, "No employees selected");
      }

      // Delete leave balances first
      await DELETE.from("leaveApp.LeaveBalance").where({
        employee_employeeId: {
          in: employeeIds,
        },
      });

      // Delete employees
      await DELETE.from("leaveApp.Employees").where({
        employeeId: {
          in: employeeIds,
        },
      });

      return "Employees deleted successfully";
    });

    //Graph
    this.on("getAttendance", async (req) => {
      const { type } = req.data;

      const totalEmployees = await SELECT.one
        .from("leaveApp.Employees")
        .columns("count(*) as total");

      const empCount = totalEmployees.total || 1;

      let result = [];

      if (type === "today") {
        const today = new Date().toISOString().split("T")[0];

        const approvedLeaves = await SELECT.one
          .from("leaveApp.LeaveRequest")
          .columns("count(*) as total")
          .where({
            status: "APPROVED",
            fromDate: { "<=": today },
            toDate: { ">=": today },
          });

        const present = empCount - approvedLeaves.total;

        result.push({
          label: "Today",
          percentage: ((present / empCount) * 100).toFixed(2),
        });
      } else if (type === "week") {
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);

          const date = d.toISOString().split("T")[0];

          const approvedLeaves = await SELECT.one
            .from("leaveApp.LeaveRequest")
            .columns("count(*) as total")
            .where({
              status: "APPROVED",
              fromDate: { "<=": date },
              toDate: { ">=": date },
            });

          const present = empCount - approvedLeaves.total;

          result.push({
            label: date,
            percentage: ((present / empCount) * 100).toFixed(2),
          });
        }
      } else if (type === "month") {
        for (let i = 1; i <= 30; i++) {
          const d = new Date();
          d.setDate(i);

          const date = d.toISOString().split("T")[0];

          const approvedLeaves = await SELECT.one
            .from("leaveApp.LeaveRequest")
            .columns("count(*) as total")
            .where({
              status: "APPROVED",
              fromDate: { "<=": date },
              toDate: { ">=": date },
            });

          const present = empCount - approvedLeaves.total;

          result.push({
            label: i.toString(),
            percentage: ((present / empCount) * 100).toFixed(2),
          });
        }
      }

      return result;
    });
    return super.init();
  }
}
