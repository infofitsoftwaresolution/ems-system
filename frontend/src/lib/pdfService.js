import jsPDF from 'jspdf';

export class PayslipPDFService {
  static generatePayslipPDF(payslip) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors - Indian standard (Saffron, White, Green inspired)
    const primaryColor = [255, 102, 0]; // Saffron/Orange
    const secondaryColor = [0, 102, 51]; // Green
    const darkGray = [51, 51, 51];
    const lightGray = [240, 240, 240];
    
    let yPosition = 10;
    
    // Header with company info
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SALARY STATEMENT', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Employee Management System', pageWidth / 2, 28, { align: 'center' });
    
    yPosition = 45;
    
    // Payslip Period Box
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, yPosition, pageWidth - 30, 12, 2, 2, 'F');
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const periodText = `Salary for the month of ${this.getMonthName(payslip.month)} ${payslip.year}`;
    doc.text(periodText, pageWidth / 2, yPosition + 8, { align: 'center' });
    
    yPosition += 20;
    
    // Employee Information Section
    doc.setFillColor(...secondaryColor);
    doc.roundedRect(15, yPosition, pageWidth - 30, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE INFORMATION', 20, yPosition + 6);
    
    yPosition += 12;
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const empInfo = [
      { label: 'Employee Name', value: payslip.employeeName },
      { label: 'Employee ID', value: payslip.employeeId || 'N/A' },
      { label: 'Email', value: payslip.employeeEmail },
    ];
    
    empInfo.forEach((info, index) => {
      const xPos = index % 2 === 0 ? 20 : 110;
      const yPos = yPosition + (Math.floor(index / 2) * 7);
      doc.setFont('helvetica', 'bold');
      doc.text(`${info.label}:`, xPos, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(info.value, xPos + 35, yPos);
    });
    
    yPosition += 20;
    
    // Earnings Section
    doc.setFillColor(...secondaryColor);
    doc.roundedRect(15, yPosition, (pageWidth - 35) / 2, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('EARNINGS', 20, yPosition + 6);
    
    yPosition += 12;
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    
    // Earnings table
    const earnings = [
      { label: 'Basic Salary', amount: payslip.basicSalary || 0 },
      { label: 'House Rent Allowance (HRA)', amount: payslip.hra || 0 },
      { label: 'Dearness Allowance (DA)', amount: payslip.da || 0 },
      { label: 'Transport Allowance', amount: payslip.transportAllowance || 0 },
      { label: 'Medical Allowance', amount: payslip.medicalAllowance || 0 },
      { label: 'Special Allowance', amount: payslip.specialAllowance || 0 },
    ];
    
    let totalEarnings = 0;
    earnings.forEach((earning) => {
      if (earning.amount > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text(earning.label, 20, yPosition);
        doc.setFont('helvetica', 'bold');
        const amount = this.formatCurrency(earning.amount);
        doc.text(`₹ ${amount}`, (pageWidth - 35) / 2 + 10, yPosition, { align: 'right' });
        totalEarnings += earning.amount;
        yPosition += 7;
      }
    });
    
    // Gross Salary
    yPosition += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, (pageWidth - 35) / 2 + 10, yPosition);
    yPosition += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Gross Salary', 20, yPosition);
    const grossAmount = this.formatCurrency(payslip.grossSalary || payslip.earnedSalary || totalEarnings);
    doc.text(`₹ ${grossAmount}`, (pageWidth - 35) / 2 + 10, yPosition, { align: 'right' });
    
    yPosition = 97; // Reset for deductions column
    
    // Deductions Section
    doc.setFillColor(200, 50, 50);
    doc.roundedRect((pageWidth - 35) / 2 + 20, yPosition, (pageWidth - 35) / 2, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DEDUCTIONS', (pageWidth - 35) / 2 + 25, yPosition + 6);
    
    yPosition += 12;
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    
    // Deductions table
    const deductions = [
      { label: 'Provident Fund (PF)', amount: payslip.pf || 0 },
      { label: 'Employee State Insurance (ESI)', amount: payslip.esi || 0 },
      { label: 'Tax Deducted at Source (TDS)', amount: payslip.tds || 0 },
      { label: 'Professional Tax', amount: payslip.professionalTax || 0 },
      { label: 'Leave Deduction', amount: payslip.leaveDeduction || 0 },
      { label: 'Other Deductions', amount: payslip.otherDeductions || 0 },
    ];
    
    let totalDeductions = 0;
    deductions.forEach((deduction) => {
      if (deduction.amount > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text(deduction.label, (pageWidth - 35) / 2 + 25, yPosition);
        doc.setFont('helvetica', 'bold');
        const amount = this.formatCurrency(deduction.amount);
        doc.text(`₹ ${amount}`, pageWidth - 20, yPosition, { align: 'right' });
        totalDeductions += deduction.amount;
        yPosition += 7;
      }
    });
    
    // Total Deductions
    yPosition += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line((pageWidth - 35) / 2 + 25, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Total Deductions', (pageWidth - 35) / 2 + 25, yPosition);
    const totalDeductionsAmount = this.formatCurrency(payslip.totalDeductions || totalDeductions);
    doc.text(`₹ ${totalDeductionsAmount}`, pageWidth - 20, yPosition, { align: 'right' });
    
    // Net Salary Box
    yPosition = 150;
    doc.setFillColor(...primaryColor);
    doc.roundedRect(15, yPosition, pageWidth - 30, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NET SALARY', 20, yPosition + 8);
    const netAmount = this.formatCurrency(payslip.netSalary || 0);
    doc.text(`₹ ${netAmount}`, pageWidth - 20, yPosition + 8, { align: 'right' });
    
    yPosition += 20;
    
    // Attendance Summary
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, yPosition, pageWidth - 30, 8, 2, 2, 'F');
    doc.setTextColor(...darkGray);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENDANCE SUMMARY', 20, yPosition + 6);
    
    yPosition += 12;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const attendanceInfo = [
      { label: 'Total Days in Month', value: payslip.totalDays || 0 },
      { label: 'Working Days', value: payslip.workingDays || 0 },
      { label: 'Leave Days', value: payslip.leaveDays || 0 },
    ];
    
    attendanceInfo.forEach((info, index) => {
      const xPos = index % 2 === 0 ? 20 : 110;
      const yPos = yPosition + (Math.floor(index / 2) * 7);
      doc.setFont('helvetica', 'bold');
      doc.text(`${info.label}:`, xPos, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(info.value.toString(), xPos + 50, yPos);
    });
    
    // Footer
    yPosition = pageHeight - 25;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    
    yPosition += 8;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer-generated payslip and does not require a signature.', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 5;
    const generatedDate = this.formatIndianDate(new Date(payslip.generatedAt || new Date()));
    doc.text(`Generated on: ${generatedDate}`, pageWidth / 2, yPosition, { align: 'center' });
    
    return doc;
  }
  
  static downloadPayslipPDF(payslip) {
    const doc = this.generatePayslipPDF(payslip);
    const monthName = this.getMonthName(payslip.month);
    const fileName = `Payslip_${payslip.employeeName.replace(/\s+/g, '_')}_${monthName}_${payslip.year}.pdf`;
    doc.save(fileName);
  }
  
  static getMonthName(month) {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1] || month;
  }
  
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }
  
  static formatIndianDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
