import bcrypt from 'bcrypt';
import cds from '@sap/cds';
export default class leaveManagementService extends cds.ApplicationService {
    async init() {
        this.on('login', async (req) => {
            const hash = await bcrypt.hash("12345", 10);
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
        return super.init();
    }
}