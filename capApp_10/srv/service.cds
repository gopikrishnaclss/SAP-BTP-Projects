using { leaveApp } from '../db/schema';

service leaveManagementService @(path:'/leavemanage') {

    @requires: 'manager'
    entity Employees as projection on leaveApp.Employees;
    action login(
        email : String,
        password : String
    ) returns LoginResponse;
    type LoginResponse {
        employeeId : String;
        firstName  : String;
        lastName   : String;
        email      : String;
        Team       : String;
        success    : Boolean;
        message    : String;
    }
    entity LeaveTypes as projection on leaveApp.LeaveType;

    entity LeaveBalances as projection on leaveApp.LeaveBalance;

}