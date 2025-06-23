const mongoose = require("mongoose");
const timesheetSchema = new mongoose.Schema({
  Date: { type: Date, required: true },
  ClientName: { type: String },
  ProjectName: { type: String },
  JobName: { type: String },
  EmployeeId: { type: String },
  EmailId: { type: String },
  FirstName: { type: String },
  LastName: { type: String },
  WorkItem: { type: String },
  FromTime: { type: String },
  ToTime: { type: String },
  TimerIntervals: { type: String },
  Hours: { type: Number },
  HoursHHMM: { type: String },
  ApprovalStatus: { type: String },
  Description: { type: String },
});
const Timesheet = mongoose.model("Timesheet", timesheetSchema);
module.exports = Timesheet;
