namespace leaveApp;
using {
     
  managed
} from '@sap/cds/common';

entity Roles {
    key ID        : Integer;
    roleName      : String(50);
}
entity Employees : managed{
  key employeeId : String(9);
  firstName: String(100);
  lastName : String(100);
  email :String(150);
  password : String(300);
  Team        : String(100);
  joiningDate       : Date;
  isActive          : Boolean default true;
  role              : Association to Roles; 
}
entity LeaveType {

  key  leaveTypeId : Integer;
  leaveType : String(100);
  totalLeaves:Integer
  
}
entity LeaveBalance {

  key leaveBalanceID:UUID;
  employee : Association to Employees;
  leaveType : Association to LeaveType;
  totalLeave  : Integer;
  usedLeave: Integer;
  remaningLeaves:Integer;

}











