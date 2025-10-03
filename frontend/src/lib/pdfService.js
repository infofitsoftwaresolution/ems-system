import jsPDF from 'jspdf';

export class PayslipPDFService {
  static generatePayslipPDF(payslip) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = [59, 130, 246]; // Blue
    const secondaryColor = [107, 114, 128]; // Gray
    const successColor = [34, 197, 94]; // Green
    
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYSLIP', pageWidth / 2, 20, { align: 'center' });
    
    // Company Info
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('MGX Employee Management System', pageWidth / 2, 35, { align: 'center' });
    doc.text('Monthly Salary Statement', pageWidth / 2, 40, { align: 'center' });
    
    // Payslip Period
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Period: ${this.getMonthName(payslip.month)} ${payslip.year}`, 20, 55);
    
    // Employee Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Information', 20, 70);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${payslip.employeeName}`, 20, 80);
    doc.text(`Email: ${payslip.employeeEmail}`, 20, 85);
    doc.text(`Employee ID: ${payslip.employeeId}`, 20, 90);
    
    // Salary Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Salary Details', 20, 105);
    
    // Create table for salary breakdown
    const tableData = [
      ['Description', 'Amount (₹)'],
      ['Basic Salary', this.formatCurrency(payslip.basicSalary)],
      ['Earned Salary', this.formatCurrency(payslip.earnedSalary)],
      ['Leave Deduction', `-${this.formatCurrency(payslip.leaveDeduction)}`],
      ['Net Salary', this.formatCurrency(payslip.netSalary)]
    ];
    
    let yPosition = 115;
    tableData.forEach((row, index) => {
      if (index === 0) {
        // Header row
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }
      
      doc.text(row[0], 25, yPosition);
      doc.text(row[1], pageWidth - 25, yPosition, { align: 'right' });
      yPosition += 8;
    });
    
    // Attendance Summary
    yPosition += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendance Summary', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Days in Month: ${payslip.totalDays}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Working Days: ${payslip.workingDays}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Leave Days: ${payslip.leaveDays || 0}`, 20, yPosition);
    
    // Footer
    yPosition = pageHeight - 30;
    doc.setDrawColor(...secondaryColor);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text('This is a computer-generated payslip and does not require a signature.', pageWidth / 2, yPosition, { align: 'center' });
    doc.text(`Generated on: ${new Date(payslip.generatedAt).toLocaleDateString()}`, pageWidth / 2, yPosition + 5, { align: 'center' });
    
    return doc;
  }
  
  static downloadPayslipPDF(payslip) {
    const doc = this.generatePayslipPDF(payslip);
    const fileName = `payslip_${payslip.employeeName.replace(/\s+/g, '_')}_${payslip.month}_${payslip.year}.pdf`;
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }
}
