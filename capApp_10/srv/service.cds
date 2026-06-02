using {leaveApp} from '../db/schema';

service leaveManagementService @(path: '/leavemanage') {
    // @requires: 'manager'
    entity Employees     as projection on leaveApp.Employees;

    action login(email: String,
                 password: String)                       returns LoginResponse;

    type LoginResponse {
        employeeId : String;
        firstName  : String;
        lastName   : String;
        email      : String;
        Team       : String;
        success    : Boolean;
        message    : String;
    }


    action getEmployees()                                returns array of {
        employeeId  : String;
        firstName   : String;
        lastName    : String;
        email       : String;
        Team        : String;
        location    : String;
        phNumber    : String;
        joiningDate : Date;
        isActive    : Boolean;
        roleId      : UUID;
        roleName    : String;
    };

    action deleteEmployees(employeeIds: array of String) returns String;

    action getAttendance(type: String)                   returns array of {
        label      : String;
        percentage : Decimal(5, 2);
    };

    action changePassword(employeeId: String,
                          oldPassword: String,
                          newPassword: String)           returns {
        success : Boolean;
        message : String;
    };

    entity LeaveTypes    as projection on leaveApp.LeaveType;
    entity LeaveBalances as projection on leaveApp.LeaveBalance;
    entity LeaveRequests as projection on leaveApp.LeaveRequest;
    entity Holidays      as projection on leaveApp.Holiday;
    entity NumberRange   as projection on leaveApp.NumberRange;

    action LastEmp()                                     returns String;
}
