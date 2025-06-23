import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./TimesheetPage.css";

// Function to calculate summary data
const calculateSummary = (timesheets) => {
  let numDaysWorked = 0;
  let numHolidays = 0;
  let numLeaves = 0;

  timesheets.forEach((sheet) => {
    const jobName = sheet.JobName.toLowerCase();
    const workItem = sheet.WorkItem.toLowerCase();

    if (jobName.includes("leave") || workItem.includes("leave")) {
      numLeaves++;
    } else if (jobName.includes("holiday") || workItem.includes("holiday")) {
      numHolidays++;
    } else {
      numDaysWorked++;
    }
  });

  return {
    numDaysWorked,
    numHolidays,
    numLeaves,
    total: numDaysWorked + numHolidays + numLeaves,
  };
};

const Timesheet = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [existingData, setExistingData] = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [clientNames, setClientNames] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [projectNames, setProjectNames] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/timesheets"
        );
        setExistingData(response.data);

        const names = Array.from(
          new Set(response.data.map((item) => item.FirstName))
        );
        setEmployeeNames(names);

        const clientsResponse = await axios.get(
          "http://localhost:5000/api/timesheets/clients"
        );
        setClientNames(clientsResponse.data);

        const projectsResponse = await axios.get(
          "http://localhost:5000/api/timesheets/projects"
        );
        setProjectNames(projectsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchExistingData();
  }, []);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);

    const allData = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        allData.push(...worksheet);

        filesProcessed += 1;
        if (filesProcessed === files.length) {
          setParsedData(allData);
          setIsEditing(true);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleEditChange = (index, field, value) => {
    const updatedData = [...parsedData];
    updatedData[index][field] = value;
    setParsedData(updatedData);
  };

  const handleUpload = async () => {
    try {
      await axios.post("http://localhost:5000/api/timesheets/add", parsedData);
      alert("Data uploaded successfully");
      setIsEditing(false);
      setSelectedFiles([]);
      setParsedData([]);
    } catch (error) {
      console.error("Error uploading data:", error);
      alert("Error uploading data");
    }
  };

  const handleView = () => {
    setIsViewing(true);
  };

  const handleFilter = async () => {
    console.log("Filtering with:", {
      employeeName: selectedEmployee,
      fromDate,
      toDate,
      clientName: selectedClient,
      projectName: selectedProject,
    });
    try {
      const response = await axios.get(
        "http://localhost:5000/api/timesheets/filter",
        {
          params: {
            employeeName: selectedEmployee,
            fromDate,
            toDate,
            clientName: selectedClient,
            projectName: selectedProject,
          },
        }
      );

      if (response.data.length === 0) {
        alert("No data found.");
      }

      console.log("Filter response:", response.data);
      setFilteredData(response.data);
    } catch (error) {
      console.error("Error filtering data:", error);
      alert("Error filtering data.");
    }
  };

  const handleSaveChanges = async (id) => {
    const updatedRow = filteredData.find((row) => row._id === id);
    try {
      await axios.put(
        `http://localhost:5000/api/timesheets/update/${id}`,
        updatedRow
      );
      alert("Data updated successfully");
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Error updating data");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/timesheets/delete/${id}`);
      alert("Timesheet deleted successfully");
      setFilteredData(filteredData.filter((row) => row._id !== id));
    } catch (error) {
      console.error("Error deleting timesheet:", error);
      alert("Error deleting timesheet");
    }
  };

  const handleExport = (format) => {
    const summary = calculateSummary(filteredData);

    const exportData = filteredData.map(
      ({ Date, JobName, ProjectName, Hours, WorkItem }) => ({
        Date,
        Activity: JobName,
        ProjectPhase: "",
        Duration: Hours,
        Remarks: WorkItem,
      })
    );

    const header = [
      [
        "Project Name",
        "Period",
        "Consultant Name",
        "No. of Days Worked",
        "No. of Holidays",
        "Leave",
        "Total",
      ],
      [
        selectedProject,
        `${fromDate} - ${toDate}`,
        `${selectedEmployee}`,
        summary.numDaysWorked,
        summary.numHolidays,
        summary.numLeaves,
        summary.total,
      ],
    ];

    const margin = 10; // Define the margin for the PDF export

    if (format === "csv") {
      const csvHeader = [
        ...header,
        [""], // Add an empty row between the header and the data
      ];

      const csvData = [
        ...csvHeader,
        ...exportData.map((row) => Object.values(row)),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(csvData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Data");
      XLSX.writeFile(workbook, "FilteredData.csv");
    } else if (format === "pdf") {
      const doc = new jsPDF();

      doc.text("Timesheet Report", margin, margin + 10);
      doc.text(`Project Name: ${selectedProject}`, margin, margin + 20);
      doc.text(`Period: ${fromDate} - ${toDate}`, margin, margin + 30);
      doc.text(`Consultant Name: ${selectedEmployee}`, margin, margin + 40);
      doc.text(
        `No. of Days Worked: ${summary.numDaysWorked}`,
        margin,
        margin + 50
      );
      doc.text(`No. of Holidays: ${summary.numHolidays}`, margin, margin + 60);
      doc.text(`Leave: ${summary.numLeaves}`, margin, margin + 70);
      doc.text(`Total: ${summary.total}`, margin, margin + 80);

      doc.autoTable({
        startY: margin + 90, // Adjust startY to position the table below the header
        head: [["Date", "Activity", "Project Phase", "Duration", "Remarks"]],
        body: exportData.map((row) => [
          row.Date,
          row.Activity,
          row.ProjectPhase,
          row.Duration,
          row.Remarks,
        ]),
      });

      doc.save("FilteredData.pdf");
    } else if (format === "xls") {
      const wsData = [
        ...header,
        [""], // Add an empty row between the header and the data
        ...exportData.map((row) => Object.values(row)),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(wsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Data");

      XLSX.writeFile(workbook, "FilteredData.xlsx");
    }
  };

  const handleEditExistingData = (index, key, value) => {
    const updatedData = [...filteredData];
    updatedData[index][key] = value;
    setFilteredData(updatedData);
  };

  return (
    <div className="timesheet-container">
      <h1>Timesheet Management</h1>

      <div>
        <label>Select files to upload:</label>
        <input type="file" multiple onChange={handleFileChange} />
      </div>

      {isEditing && (
        <div>
          <h3>Review and Edit Data</h3>
          <table>
            <thead>
              <tr>
                {Object.keys(parsedData[0] || {}).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.keys(row).map((key) => (
                    <td key={key}>
                      <input
                        type="text"
                        value={row[key]}
                        onChange={(e) =>
                          handleEditChange(rowIndex, key, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleUpload}>Upload Data</button>
        </div>
      )}

      <div>
        <button onClick={handleView}>View Existing Timesheets</button>
      </div>

      {isViewing && (
        <div>
          <h3>Existing Timesheets</h3>
          <div>
            <label>Employee Name:</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Select Employee</option>
              {employeeNames.map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Client Name:</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">Select Client</option>
              {clientNames.map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Project Name:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">Select Project</option>
              {projectNames.map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>From Date:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label>To Date:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button onClick={handleFilter}>Filter</button>
        </div>
      )}

      {filteredData.length > 0 && (
        <div>
          <h3>Filtered Timesheets</h3>
          <div>
            <strong>Summary:</strong>
            <div>Project Name: {selectedProject}</div>
            <div>
              Period: {fromDate} - {toDate}
            </div>
            <div>Consultant Name: {selectedEmployee}</div>
            <div>
              No. of Days Worked: {calculateSummary(filteredData).numDaysWorked}
            </div>
            <div>
              No. of Holidays: {calculateSummary(filteredData).numHolidays}
            </div>
            <div>Leave: {calculateSummary(filteredData).numLeaves}</div>
            <div>Total: {calculateSummary(filteredData).total}</div>
          </div>
          <table>
            <thead>
              <tr>
                {Object.keys(filteredData[0] || {}).map((key) => (
                  <th key={key}>{key}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr key={row._id}>
                  {Object.keys(row).map((key) => (
                    <td key={key}>
                      <input
                        type="text"
                        value={row[key]}
                        onChange={(e) =>
                          handleEditExistingData(rowIndex, key, e.target.value)
                        }
                      />
                    </td>
                  ))}
                  <td>
                    <button onClick={() => handleSaveChanges(row._id)}>
                      Save Changes
                    </button>
                    <button onClick={() => handleDelete(row._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="export-buttons">
            <button onClick={() => handleExport("csv")}>Export as CSV</button>
            <button onClick={() => handleExport("pdf")}>Export as PDF</button>
            <button onClick={() => handleExport("xls")}>Export as XLS</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheet;
