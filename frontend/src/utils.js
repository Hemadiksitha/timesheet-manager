import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { PDFDocument } from "pdf-lib";
import { isWeekend, isSunday } from "date-fns";

let timesheetData = [];

export const parseCSV = (contents) => {
  const rows = contents.split("\n").map((row) => {
    const cells = [];
    let insideQuotes = false;
    let cell = "";

    for (let char of row) {
      if (char === '"' && !insideQuotes) {
        insideQuotes = true;
      } else if (char === '"' && insideQuotes) {
        insideQuotes = false;
      } else if (char === "," && !insideQuotes) {
        cells.push(cell);
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell);
    return cells;
  });

  // Assuming first row is the header
  const headers = rows[0];
  timesheetData = rows.slice(1).map((row) => {
    const record = {};
    row.forEach((cell, index) => {
      record[headers[index]] = cell;
    });
    return record;
  });

  return timesheetData;
};

export const parseXLS = (contents) => {
  try {
    const workbook = XLSX.read(contents, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Assuming first row is the header
    const headers = json[0];
    timesheetData = json.slice(1).map((row) => {
      const record = {};
      row.forEach((cell, index) => {
        record[headers[index]] = cell;
      });
      return record;
    });

    return timesheetData;
  } catch (error) {
    console.error("Error parsing XLS file:", error);
    return null;
  }
};

export const parsePDF = async (contents) => {
  try {
    const pdfDoc = await PDFDocument.load(contents);
    const pages = pdfDoc.getPages();
    const rows = [];

    for (const page of pages) {
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      rows.push(pageText);
    }

    // Process the extracted text into a structured format if needed
    // For simplicity, assuming the text content can be split by new lines
    const structuredRows = rows
      .join("\n")
      .split("\n")
      .map((row) => row.split(" "));
    const headers = structuredRows[0];
    timesheetData = structuredRows.slice(1).map((row) => {
      const record = {};
      row.forEach((cell, index) => {
        record[headers[index]] = cell;
      });
      return record;
    });

    return timesheetData;
  } catch (error) {
    console.error("Error parsing PDF file:", error);
    return null;
  }
};

export const filterTimesheet = (employeeId, fromDate, toDate) => {
  return timesheetData.filter((row) => {
    const date = new Date(row["Date"]);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const isInRange =
      (!fromDate || date >= new Date(from.setHours(0, 0, 0, 0))) &&
      (!toDate || date <= new Date(to.setHours(23, 59, 59, 999)));

    const matchesEmployeeId = !employeeId || row["Employee id"] === employeeId;

    return isInRange && matchesEmployeeId;
  });
};

const calculateDaysWorked = (filteredData) => {
  return filteredData.length;
};

const calculateHolidays = (fromDate, toDate) => {
  let holidaysCount = 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);

  while (from <= to) {
    if (isWeekend(from) || isSunday(from)) {
      holidaysCount++;
    }
    from.setDate(from.getDate() + 1);
  }

  return holidaysCount;
};

const calculateWeekends = (fromDate, toDate) => {
  let weekendsCount = 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  while (from <= to) {
    if (isWeekend(from) || isSunday(from)) {
      weekendsCount++;
    }
    from.setDate(from.getDate() + 1);
  }
  return weekendsCount;
};

const calculateLeaves = (filteredData, fromDate, toDate) => {
  const totalDays =
    Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) +
    1;
  const workedDays = calculateDaysWorked(filteredData);
  const holidaysCount = calculateHolidays(fromDate, toDate);
  const weekendsCount = calculateWeekends(fromDate, toDate);

  return totalDays - workedDays - holidaysCount - weekendsCount;
};

export const exportToCSV = (data, fromDate, toDate) => {
  const daysWorked = calculateDaysWorked(data);
  const holidaysCount = calculateHolidays(fromDate, toDate);
  const leavesCount = calculateLeaves(data, fromDate, toDate);

  const header = [
    "Period",
    "Consultant Name",
    "Number of Days Worked",
    "Number of Leaves Taken",
    "Number of Holidays",
    "Total",
    "Date",
    "Job Name",
    "Project Phase",
    "Hour(s)",
    "Description",
  ];

  const csvData = [
    [
      `${new Date(fromDate).toLocaleDateString("en-GB")} - ${new Date(
        toDate
      ).toLocaleDateString("en-GB")}`,
      data[0]?.["First Name"] + " " + data[0]?.["Last Name"] || "Unknown",
      daysWorked,
      leavesCount,
      holidaysCount,
      data.reduce((total, item) => total + Number(item["Duration(HRs)"]), 0),
      ...Array(5).fill(""),
    ],
    ...data.map((item) => [
      ...Array(6).fill(""),
      item.Date,
      item["Job Name"],
      item["Project Phase"],
      item["Hour(s)"],
      item["Work Item"],
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(csvData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, "timesheet_report.csv");
};

export const exportToExcel = (data, fromDate, toDate) => {
  const daysWorked = calculateDaysWorked(data);
  const holidaysCount = calculateHolidays(fromDate, toDate);
  const leavesCount = calculateLeaves(data, fromDate, toDate);

  const header = [
    "Period",
    "Consultant Name",
    "Number of Days Worked",
    "Number of Leaves Taken",
    "Number of Holidays",
    "Total",
    "Date",
    "Activity",
    "Project Phase",
    "Hour(s)",
    "Description",
  ];

  const excelData = [
    [
      `${new Date(fromDate).toLocaleDateString("en-GB")} - ${new Date(
        toDate
      ).toLocaleDateString("en-GB")}`,
      data[0]?.["First Name"] + " " + data[0]?.["Last Name"] || "Unknown",
      daysWorked,
      leavesCount,
      holidaysCount,
      data.reduce((total, item) => total + Number(item["Hour(s)"]), 0),
      ...Array(5).fill(""),
    ],
    ...data.map((item) => [
      ...Array(6).fill(""),
      item.Date,
      item["Job Name"],
      item["Project Phase"],
      item["Hour(s)"],
      item["Work Item"],
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, "timesheet_report.xlsx");
};

export const exportToPDF = (data, fromDate, toDate) => {
  const daysWorked = calculateDaysWorked(data);
  const holidaysCount = calculateHolidays(fromDate, toDate);
  const leavesCount = calculateLeaves(data, fromDate, toDate);

  const doc = new jsPDF();

  doc.text("Timesheet Report", 14, 10);
  doc.text(
    `Period: ${new Date(fromDate).toLocaleDateString("en-GB")} - ${new Date(
      toDate
    ).toLocaleDateString("en-GB")}`,
    14,
    20
  );
  doc.text(
    `Consultant Name: ${data[0]?.["First Name"] || "Unknown"} ${
      data[0]?.["Last Name"] || ""
    }`,
    14,
    30
  );
  doc.text(`Number of Days Worked: ${daysWorked}`, 14, 40);
  doc.text(`Number of Leaves Taken: ${leavesCount}`, 14, 50);
  doc.text(`Number of Holidays: ${holidaysCount}`, 14, 60);

  const tableData = data.map((item) => [
    item.Date,
    item["Job Name"],
    item["Project Phase"],
    item["Hour(s)"],
    item["Work Item"],
  ]);

  doc.autoTable({
    head: [["Date", "Activity", "Project Phase", "Duration(HRs)", "Remarks"]],
    body: tableData,
    startY: 70,
  });

  doc.save("timesheet_report.pdf");
};
