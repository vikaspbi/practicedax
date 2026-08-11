import type { Domain } from "@/lib/types";

export const hrDomain: Domain = {
  id: "hr",
  name: "HR",
  tagline: "People, departments, and time",
  description:
    "Workforce analytics — salaries, headcount, overtime, and department rollups.",
  accent: "#1B4F72",
  tables: [
    {
      name: "Employees",
      description: "Employee master / fact-ish dimension",
      isFact: true,
      columns: [
        { name: "EmployeeID", type: "string" },
        { name: "FullName", type: "string" },
        { name: "DepartmentID", type: "string" },
        { name: "HireDate", type: "date" },
        { name: "Salary", type: "number" },
        { name: "Status", type: "string" },
        { name: "JobLevel", type: "number" },
      ],
      rows: [
        { EmployeeID: "E01", FullName: "Maya Patel", DepartmentID: "D1", HireDate: "2019-03-12", Salary: 92000, Status: "Active", JobLevel: 3 },
        { EmployeeID: "E02", FullName: "Noah Kim", DepartmentID: "D2", HireDate: "2021-07-01", Salary: 78000, Status: "Active", JobLevel: 2 },
        { EmployeeID: "E03", FullName: "Olivia Grant", DepartmentID: "D1", HireDate: "2018-11-20", Salary: 110000, Status: "Active", JobLevel: 4 },
        { EmployeeID: "E04", FullName: "Priya Shah", DepartmentID: "D3", HireDate: "2022-01-15", Salary: 65000, Status: "Active", JobLevel: 1 },
        { EmployeeID: "E05", FullName: "Quinn Brooks", DepartmentID: "D2", HireDate: "2020-05-04", Salary: 88000, Status: "Active", JobLevel: 3 },
        { EmployeeID: "E06", FullName: "Rita Alvarez", DepartmentID: "D4", HireDate: "2017-09-08", Salary: 125000, Status: "Active", JobLevel: 5 },
        { EmployeeID: "E07", FullName: "Sam Okonkwo", DepartmentID: "D3", HireDate: "2023-02-27", Salary: 58000, Status: "Active", JobLevel: 1 },
        { EmployeeID: "E08", FullName: "Tina Zhou", DepartmentID: "D1", HireDate: "2020-10-12", Salary: 97000, Status: "Leave", JobLevel: 3 },
        { EmployeeID: "E09", FullName: "Uma Singh", DepartmentID: "D4", HireDate: "2016-04-18", Salary: 132000, Status: "Active", JobLevel: 5 },
        { EmployeeID: "E10", FullName: "Victor Lane", DepartmentID: "D2", HireDate: "2024-01-08", Salary: 72000, Status: "Active", JobLevel: 2 },
        { EmployeeID: "E11", FullName: "Wendy Cole", DepartmentID: "D3", HireDate: "2019-08-30", Salary: 71000, Status: "Active", JobLevel: 2 },
        { EmployeeID: "E12", FullName: "Xavier Nunez", DepartmentID: "D4", HireDate: "2021-12-01", Salary: 99000, Status: "Active", JobLevel: 4 },
      ],
    },
    {
      name: "Departments",
      description: "Department dimension",
      columns: [
        { name: "DepartmentID", type: "string" },
        { name: "DepartmentName", type: "string" },
        { name: "Location", type: "string" },
        { name: "Budget", type: "number" },
      ],
      rows: [
        { DepartmentID: "D1", DepartmentName: "Engineering", Location: "Austin", Budget: 1200000 },
        { DepartmentID: "D2", DepartmentName: "Sales", Location: "Chicago", Budget: 900000 },
        { DepartmentID: "D3", DepartmentName: "Support", Location: "Remote", Budget: 450000 },
        { DepartmentID: "D4", DepartmentName: "Leadership", Location: "Austin", Budget: 800000 },
      ],
    },
    {
      name: "Timesheets",
      description: "Weekly hours fact",
      isFact: true,
      columns: [
        { name: "TimesheetID", type: "string" },
        { name: "EmployeeID", type: "string" },
        { name: "WeekEnding", type: "date" },
        { name: "HoursWorked", type: "number" },
        { name: "OvertimeHours", type: "number" },
      ],
      rows: [
        { TimesheetID: "T01", EmployeeID: "E01", WeekEnding: "2024-06-07", HoursWorked: 40, OvertimeHours: 4 },
        { TimesheetID: "T02", EmployeeID: "E02", WeekEnding: "2024-06-07", HoursWorked: 40, OvertimeHours: 0 },
        { TimesheetID: "T03", EmployeeID: "E03", WeekEnding: "2024-06-07", HoursWorked: 38, OvertimeHours: 2 },
        { TimesheetID: "T04", EmployeeID: "E04", WeekEnding: "2024-06-07", HoursWorked: 42, OvertimeHours: 6 },
        { TimesheetID: "T05", EmployeeID: "E05", WeekEnding: "2024-06-07", HoursWorked: 40, OvertimeHours: 1 },
        { TimesheetID: "T06", EmployeeID: "E01", WeekEnding: "2024-06-14", HoursWorked: 40, OvertimeHours: 2 },
        { TimesheetID: "T07", EmployeeID: "E07", WeekEnding: "2024-06-14", HoursWorked: 40, OvertimeHours: 8 },
        { TimesheetID: "T08", EmployeeID: "E10", WeekEnding: "2024-06-14", HoursWorked: 40, OvertimeHours: 0 },
        { TimesheetID: "T09", EmployeeID: "E11", WeekEnding: "2024-06-14", HoursWorked: 36, OvertimeHours: 0 },
        { TimesheetID: "T10", EmployeeID: "E12", WeekEnding: "2024-06-14", HoursWorked: 40, OvertimeHours: 3 },
      ],
    },
  ],
  relationships: [
    {
      fromTable: "Employees",
      fromColumn: "DepartmentID",
      toTable: "Departments",
      toColumn: "DepartmentID",
    },
    {
      fromTable: "Timesheets",
      fromColumn: "EmployeeID",
      toTable: "Employees",
      toColumn: "EmployeeID",
    },
  ],
};
