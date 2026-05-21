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
  location:String(100);
  phNumber:Integer
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
entity LeaveRequest {
  key leaveRequestId : UUID;
  employee           : Association to Employees;
  leaveType          : Association to LeaveType;
  fromDate           : Date;
  toDate             : Date;
  totalDays          : Integer;
  reason             : String(500);
  status             : String(20) default 'PENDING';
  appliedOn          : DateTime;
  approvedBy         : Association to Employees;
  comments           : String(500);
}

entity Holiday {
  key holidayId : String(10);
  date:Date;
  day:String;
  holiday:String
}











