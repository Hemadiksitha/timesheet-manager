import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NewTimesheetEntry.css";

const NewTimesheetEntry = () => {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [firstNames, setFirstNames] = useState([]);
  const [lastNames, setLastNames] = useState([]);
  const [workItems, setWorkItems] = useState([]);

  const [formData, setFormData] = useState({
    date: "",
    clientName: "",
    projectName: "",
    jobName: "",
    employeeId: "",
    emailId: "",
    firstName: "",
    lastName: "",
    workItem: "",
    fromTime: "",
    toTime: "",
    timerIntervals: "",
    hours: "",
    hoursHHMM: "",
    approvalStatus: "",
    description: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsRes = await axios.get(
          "http://localhost:5000/api/timesheets/clients"
        );
        setClients(clientsRes.data);

        const projectsRes = await axios.get(
          "http://localhost:5000/api/timesheets/projects"
        );
        setProjects(projectsRes.data);

        const jobsRes = await axios.get(
          "http://localhost:5000/api/timesheets/jobs"
        );
        setJobs(jobsRes.data);

        const firstNamesRes = await axios.get(
          "http://localhost:5000/api/timesheets/first-names"
        );
        setFirstNames(firstNamesRes.data);

        const lastNamesRes = await axios.get(
          "http://localhost:5000/api/timesheets/last-names"
        );
        setLastNames(lastNamesRes.data);

        const workItemsRes = await axios.get(
          "http://localhost:5000/api/timesheets/work-items"
        );
        setWorkItems(workItemsRes.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure the date field is in ISO format
    if (!formData.date) {
      console.error("Date field is required");
      alert("Date field is required");
      return;
    }

    // Convert date to ISO format
    const timesheetData = {
      Date: new Date(formData.date).toISOString(), // Ensure date is in ISO format
      ClientName: formData.clientName,
      ProjectName: formData.projectName,
      JobName: formData.jobName,
      EmployeeID: parseInt(formData.employeeId),
      EmailID: formData.emailId,
      FirstName: formData.firstName,
      LastName: formData.lastName,
      WorkItem: formData.workItem,
      FromTime: formData.fromTime,
      ToTime: formData.toTime,
      TimerIntervals: formData.timerIntervals,
      Hours: formData.hours,
      HoursHHMM: formData.hoursHHMM,
      ApprovalStatus: formData.approvalStatus,
      Description: formData.description,
    };

    try {
      // Update the URL to the new API endpoint
      await axios.post(
        "http://localhost:5000/api/timesheets/add-single",
        timesheetData
      );
      alert("Timesheet entry added successfully!");
    } catch (error) {
      console.error("Error adding timesheet entry:", error);
      alert("Error adding timesheet entry. Please try again.");
    }
  };

  return (
    <div className="new-timesheet-entry">
      <h2>New Timesheet Entry</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Date:</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Client Name:</label>
          <select
            name="clientName"
            value={formData.clientName}
            onChange={handleInputChange}
          >
            <option value="">Select Client</option>
            {clients.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Project Name:</label>
          <select
            name="projectName"
            value={formData.projectName}
            onChange={handleInputChange}
          >
            <option value="">Select Project</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Job Name:</label>
          <select
            name="jobName"
            value={formData.jobName}
            onChange={handleInputChange}
          >
            <option value="">Select Job</option>
            {jobs.map((job) => (
              <option key={job} value={job}>
                {job}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Employee ID:</label>
          <input
            type="number"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Email ID:</label>
          <input
            type="email"
            name="emailId"
            value={formData.emailId}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>First Name:</label>
          <select
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
          >
            <option value="">Select First Name</option>
            {firstNames.map((firstName) => (
              <option key={firstName} value={firstName}>
                {firstName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Last Name:</label>
          <select
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
          >
            <option value="">Select Last Name</option>
            {lastNames.map((lastName) => (
              <option key={lastName} value={lastName}>
                {lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Work Item:</label>
          <select
            name="workItem"
            value={formData.workItem}
            onChange={handleInputChange}
          >
            <option value="">Select Work Item</option>
            {workItems.map((workItem) => (
              <option key={workItem} value={workItem}>
                {workItem}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>From Time:</label>
          <input
            type="time"
            name="fromTime"
            value={formData.fromTime}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>To Time:</label>
          <input
            type="time"
            name="toTime"
            value={formData.toTime}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Timer Intervals:</label>
          <input
            type="text"
            name="timerIntervals"
            value={formData.timerIntervals}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Hours:</label>
          <input
            type="text"
            name="hours"
            value={formData.hours}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Hours (HH:MM):</label>
          <input
            type="text"
            name="hoursHHMM"
            value={formData.hoursHHMM}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Approval Status:</label>
          <input
            type="text"
            name="approvalStatus"
            value={formData.approvalStatus}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
          ></textarea>
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default NewTimesheetEntry;
