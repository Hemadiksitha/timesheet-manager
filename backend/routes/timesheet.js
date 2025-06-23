const express = require("express");
const router = express.Router();
const Timesheet = require("../models/Timesheet");

// Helper function to convert date string to Date object if provided
const convertToDate = (dateStr) => {
  if (dateStr) {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
};

// Helper function to normalize keys of an object to lowercase
const normalizeKeys = (data) => {
  const normalizedData = {};
  Object.keys(data).forEach((key) => {
    normalizedData[key.toLowerCase()] = data[key];
  });
  return normalizedData;
};

// Add multiple timesheets
router.post("/add", async (req, res) => {
  const timesheetDataList = req.body;

  try {
    const createdTimesheets = [];
    const existingRecords = [];

    for (const timesheetData of timesheetDataList) {
      console.log(
        "Processing individual timesheet data:",
        JSON.stringify(timesheetData, null, 2)
      );

      // Normalize keys to lowercase for case-insensitive mapping
      const normalizedData = normalizeKeys(timesheetData);

      // Map incoming data to match schema
      const mappedData = {
        Date: convertToDate(normalizedData["date"]),
        ClientName: normalizedData["client name"] || undefined,
        ProjectName: normalizedData["project name"] || undefined,
        JobName: normalizedData["job name"] || undefined,
        EmployeeId: normalizedData["employee id"] || undefined,
        EmailId: normalizedData["email id"] || undefined,
        FirstName: normalizedData["first name"] || undefined,
        LastName: normalizedData["last name"] || undefined,
        WorkItem: normalizedData["work item"] || undefined,
        FromTime: normalizedData["from time"] || undefined,
        ToTime: normalizedData["to time"] || undefined,
        TimerIntervals: normalizedData["timer intervals"] || undefined,
        Hours: normalizedData["hour(s)"] || undefined,
        HoursHHMM: normalizedData["hours(hh:mm)"] || undefined,
        ApprovalStatus: normalizedData["approval status"] || undefined,
        Description: normalizedData["description"] || undefined,
      };

      console.log("Mapped Data:", JSON.stringify(mappedData, null, 2));

      if (isNaN(parseInt(mappedData.EmployeeId, 10))) {
        console.error("Invalid EmployeeId:", mappedData.EmployeeId);
        continue; // Skip invalid records
      }

      // Check if the record already exists
      const existingRecord = await Timesheet.findOne({
        Date: mappedData.Date,
        ClientName: mappedData.ClientName,
        ProjectName: mappedData.ProjectName,
        JobName: mappedData.JobName,
        EmployeeId: mappedData.EmployeeId,
        EmailId: mappedData.EmailId,
        FromTime: mappedData.FromTime,
        ToTime: mappedData.ToTime,
      });

      if (!existingRecord) {
        const newTimesheet = await Timesheet.create(mappedData);
        console.log("Created Timesheet:", newTimesheet);
        createdTimesheets.push(newTimesheet);
      } else {
        console.log("Existing Record:", existingRecord);
        existingRecords.push(existingRecord);
      }
    }

    res.status(200).json({
      created: createdTimesheets,
      existing: existingRecords,
    });
  } catch (error) {
    console.error("Error adding timesheets:", error);
    res.status(500).json({
      message: "Error adding timesheets.",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Get all timesheets
router.get("/", async (req, res) => {
  try {
    const timesheets = await Timesheet.find();
    res.status(200).json(timesheets);
  } catch (error) {
    console.error("Error fetching timesheet data:", error);
    res.status(500).json({ error: "Error fetching timesheet data" });
  }
});

// Add a single timesheet
router.post("/add-single", async (req, res) => {
  const timesheetData = req.body;

  try {
    const normalizedData = normalizeKeys(timesheetData);

    const mappedData = {
      Date: convertToDate(normalizedData["date"]),
      ClientName: normalizedData["client name"] || undefined,
      ProjectName: normalizedData["project name"] || undefined,
      JobName: normalizedData["job name"] || undefined,
      EmployeeId: normalizedData["employee id"] || undefined,
      EmailId: normalizedData["email id"] || undefined,
      FirstName: normalizedData["first name"] || undefined,
      LastName: normalizedData["last name"] || undefined,
      WorkItem: normalizedData["work item"] || undefined,
      FromTime: normalizedData["from time"] || undefined,
      ToTime: normalizedData["to time"] || undefined,
      TimerIntervals: normalizedData["timer intervals"] || undefined,
      Hours: normalizedData["hour(s)"] || undefined,
      HoursHHMM: normalizedData["hours(hh:mm)"] || undefined,
      ApprovalStatus: normalizedData["approval status"] || undefined,
      Description: normalizedData["description"] || undefined,
    };

    console.log("Mapped Data:", JSON.stringify(mappedData, null, 2));

    if (isNaN(parseInt(mappedData.EmployeeId, 10))) {
      console.error("Invalid EmployeeId:", mappedData.EmployeeId);
      return res.status(400).json({ message: "Invalid EmployeeId" });
    }

    const existingRecord = await Timesheet.findOne({
      Date: mappedData.Date,
      ClientName: mappedData.ClientName,
      ProjectName: mappedData.ProjectName,
      JobName: mappedData.JobName,
      EmployeeId: mappedData.EmployeeId,
      EmailId: mappedData.EmailId,
      FromTime: mappedData.FromTime,
      ToTime: mappedData.ToTime,
    });

    if (!existingRecord) {
      const newTimesheet = await Timesheet.create(mappedData);
      return res.status(201).json({
        message: "Timesheet entry added successfully",
        timesheet: newTimesheet,
      });
    } else {
      return res.status(409).json({
        message: "Timesheet entry already exists",
        timesheet: existingRecord,
      });
    }
  } catch (error) {
    console.error("Error adding timesheet entry:", error);
    res.status(500).json({
      message: "Error adding timesheet entry",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Other routes (filter, update, delete, etc.) remain unchanged
// Update existing timesheet data
router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const updatedTimesheet = await Timesheet.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );
    if (!updatedTimesheet) {
      return res.status(404).send("Timesheet not found.");
    }
    res.status(200).json(updatedTimesheet);
  } catch (error) {
    console.error("Error updating timesheet:", error);
    res.status(500).send("Error updating timesheet.");
  }
});

// Filter timesheets by employee name, date range, client name, and project name
router.get("/filter", async (req, res) => {
  const { employeeName, fromDate, toDate, clientName, projectName } = req.query;

  try {
    const query = {};

    if (employeeName) {
      query.FirstName = employeeName;
    }
    if (clientName) {
      query.ClientName = clientName;
    }
    if (projectName) {
      query.ProjectName = projectName;
    }
    if (fromDate && toDate) {
      query.Date = {
        $gte: new Date(fromDate),
        $lt: new Date(new Date(toDate).setDate(new Date(toDate).getDate() + 1)),
      };
    }

    const filteredTimesheets = await Timesheet.find(query);

    const formattedTimesheets = filteredTimesheets.map((timesheet) => ({
      ...timesheet._doc,
      Date: timesheet.Date ? timesheet.Date.toISOString().split("T")[0] : null,
    }));
    res.status(200).json(formattedTimesheets);
  } catch (error) {
    console.error("Error filtering timesheets:", error);
    res.status(500).json({ error: "Error filtering timesheets" });
  }
});

// Get unique client names
router.get("/clients", async (req, res) => {
  try {
    const clients = await Timesheet.distinct("ClientName");
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching client names:", error);
    res.status(500).json({ error: "Error fetching client names" });
  }
});

// Get unique project names
router.get("/projects", async (req, res) => {
  try {
    const projects = await Timesheet.distinct("ProjectName");
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching project names:", error);
    res.status(500).json({ error: "Error fetching project names" });
  }
});

// Get unique job names
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Timesheet.distinct("JobName");
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching job names:", error);
    res.status(500).json({ error: "Error fetching job names" });
  }
});

// Get unique first names
router.get("/first-names", async (req, res) => {
  try {
    const firstNames = await Timesheet.distinct("FirstName");
    res.status(200).json(firstNames);
  } catch (error) {
    console.error("Error fetching first names:", error);
    res.status(500).json({ error: "Error fetching first names" });
  }
});

// Get unique last names
router.get("/last-names", async (req, res) => {
  try {
    const lastNames = await Timesheet.distinct("LastName");
    res.status(200).json(lastNames);
  } catch (error) {
    console.error("Error fetching last names:", error);
    res.status(500).json({ error: "Error fetching last names" });
  }
});

// Get unique work items
router.get("/work-items", async (req, res) => {
  try {
    const workItems = await Timesheet.distinct("WorkItem");
    res.status(200).json(workItems);
  } catch (error) {
    console.error("Error fetching work items:", error);
    res.status(500).json({ error: "Error fetching work items" });
  }
});

// Delete timesheet entry by ID
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTimesheet = await Timesheet.findByIdAndDelete(id);
    if (!deletedTimesheet) {
      return res.status(404).send("Timesheet not found.");
    }
    res.status(200).json({ message: "Timesheet entry deleted successfully." });
  } catch (error) {
    console.error("Error deleting timesheet:", error);
    res.status(500).send("Error deleting timesheet.");
  }
});




module.exports = router;
