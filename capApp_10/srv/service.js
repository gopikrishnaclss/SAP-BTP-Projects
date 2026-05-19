import bcrypt from 'bcrypt';
import cds from '@sap/cds';
export default class leaveManagementService extends cds.ApplicationService {
    async init() {
        this.on('login', async (req) => {
           
            const { email, password } = req.data;
            const user = await SELECT.one
                .from('leaveApp.Employees')
                .where({ email });
            if (!user) {
                return {
                    success: false,
                    message: 'Email not found',
                    employeeId: null,
                    firstName: null
                };
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return {
                    success: false,
                    message: 'Invalid password',
                    employeeId: null,
                    firstName: null
                };
            }
            return {
                employeeId: user.employeeId,
                firstName: user.firstName,
                lastName:  user.lastName,
                email: user.email,
                password: user.password,
                Team : user.Team,
                joiningDate: user.joiningDate,
                isActive:user.isActive,
                role:user.role,
                success: true,
                message: 'Login successful',
            };
        });
    
        this.before('CREATE', 'LeaveRequests', async (req) => {
            const { fromDate, toDate, employee_employeeId, leaveType_leaveTypeId } = req.data;

            // Calculate total days
            const start = new Date(fromDate);
            const end = new Date(toDate);
            const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            if (totalDays <= 0) {
                req.error(400, 'End date must be after start date');
                return;
            }

            req.data.totalDays = totalDays;
            req.data.appliedOn = new Date().toISOString();
            req.data.status = 'PENDING';

            // Check leave balance
            const balance = await SELECT.one
                .from('leaveApp.LeaveBalance')
                .where({
                    employee_employeeId: employee_employeeId,
                    leaveType_leaveTypeId: leaveType_leaveTypeId
                });

            if (!balance) {
                req.error(400, 'ss No leave balance found for this leave type');
                return;
            }

            if (balance.remaningLeaves < totalDays) {
                req.error(400, `Insufficient leave balance. Available: ${balance.remaningLeaves} days, Requested: ${totalDays} days`);
                return;
            }

            // Deduct from leave balance
            await UPDATE('leaveApp.LeaveBalance')
                .set({
                    usedLeave: balance.usedLeave + totalDays,
                    remaningLeaves: balance.remaningLeaves - totalDays
                })
                .where({
                    employee_employeeId: employee_employeeId,
                    leaveType_leaveTypeId: leaveType_leaveTypeId
                });
        });
        return super.init();
    }
}