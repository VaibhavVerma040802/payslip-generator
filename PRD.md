# Product Requirements Document (PRD): PaySlip Pro

## 1. Product Overview
**PaySlip Pro** is a full-stack web application designed to simplify the generation, management, and distribution of professional salary slips. The application caters to HR professionals, small business owners, and administrators who need a quick and straightforward way to generate A4-branded PDF payslips, maintain a historical record of all issued payslips, and automatically email them to employees.

## 2. Target Audience
*   **Small to Medium Businesses (SMBs):** Without a dedicated massive enterprise HR software budget.
*   **HR Managers & Administrators:** Who process monthly payrolls and need custom PDF downloads.
*   **Freelancers & Contractors:** Who want to generate professional payment stubs for their own records or clients.

## 3. Core Features & Capabilities

### 3.1 Dashboard & Analytics
*   A statistical overview showing Total Payslips Generated, Current Month's Count, Total Emails Sent, and Average Salary.
*   Quick navigation to recent payslips.

### 3.2 Payslip Generation (5-Step Form)
*   **Step 1: Company Details** - Company name, address, and logo branding.
*   **Step 2: Employee Details** - Name, ID, designation, and contact info.
*   **Step 3: Pay Period** - Start date, end date, and payment month/year.
*   **Step 4: Earnings** - Dynamic addition of basic salary, allowances, bonuses, etc.
*   **Step 5: Deductions** - Dynamic tracking of taxes, provident fund, insurance, etc.
*   **Real-time Calculation:** The app calculates gross earnings, total deductions, and net payable salary dynamically as users type.

### 3.3 Export & Distribution
*   **PDF Generation:** Server-side generation of beautiful, structured A4 PDF payslips using PDFKit. 
*   **Direct Email Delivery:** Integration with Gmail SMTP via Nodemailer to directly email the generated PDF payslip to the employee with one click.

### 3.4 Payslip Management
*   **Database Persistence:** All generated payslips are stored in MongoDB.
*   **Data Table:** View, search, and paginate through historical payslips.
*   **Record Details:** Access any individual past payslip to re-download the PDF or re-send the email.
*   **Deletion:** Ability to securely delete erroneous records.

## 4. Technical Architecture

### 4.1 Frontend
*   **Framework:** React 18 powered by Vite.
*   **Routing:** React Router v6 for Single Page Application (SPA) navigation.
*   **API Communication:** Axios interceptors for HTTP requests.
*   **UI/UX:** Styled comprehensively (CSS) with Lucide React icons and React-Hot-Toast for notifications.

### 4.2 Backend & APIs
*   **Server Framework:** Node.js with Express.
*   **Database:** MongoDB via Mongoose ORM.
*   **Static Serving:** Configured to serve the bundled production React application from the same Express instance.
*   **Libraries:** `pdfkit` for programmatic PDF rendering, `nodemailer` for handling email transport over SMTP.

## 5. Security & Constraints
*   MongoDB data should be properly protected using connection string secrets (`.env`).
*   SMTP credentials require Gmail App Passwords (to prevent full Google Account compromises).
*   Payload size limits are increased (`10mb`) to support larger company logos if provided in Base64 formats.

## 6. Future Roadmap (Potential V2 Features)
*   **Authentication:** Add custom JWT Email/Password login for HR Admins to restrict unauthorized access.
*   **Bulk Generation:** Allow CSV uploads to generate hundreds of payslips simultaneously.
*   **Company Profiles:** Save company details in a database so they don't have to be typed every time.
*   **Employee Portal:** Give employees a separate login so they can view and download their own historical payslips independently.
