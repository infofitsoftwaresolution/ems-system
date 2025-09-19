# Employee Management System

A modern React application for managing employee information with role-based access control.

## Features

- 🔐 **Authentication System** - Login with role-based access
- 📊 **Dashboard** - Overview with statistics and quick actions
- 👥 **Employee Management** - View and manage employee data
- 🎨 **Modern UI** - Clean, responsive design
- 🔒 **Role-Based Access** - Different features for admin, manager, and employee roles
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Demo Credentials

Use these credentials to test different user roles:

- **Admin User**: `admin@company.com` / `admin123`
- **Manager User**: `manager@company.com` / `manager123`
- **Employee User**: `employee@company.com` / `employee123`

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd employee-management
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.js       # Navigation header
│   └── Header.css
├── pages/              # Page-level components
│   ├── Login.js        # Authentication page
│   ├── Login.css
│   ├── Dashboard.js    # Main dashboard
│   ├── Dashboard.css
│   ├── Employees.js    # Employee list
│   └── Employees.css
├── services/           # API and business logic
│   └── api.js         # Mock API functions
├── App.js             # Main app component with routing
├── App.css            # Global styles
└── index.js           # App entry point
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Backend Integration

The application is prepared for backend integration with the following setup:

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### API Structure

The mock API functions in `src/services/api.js` can be replaced with real API calls:

- `authService.login()` - User authentication
- `employeeService.getEmployees()` - Fetch employee list
- `employeeService.getEmployee(id)` - Get single employee
- `employeeService.createEmployee(data)` - Create new employee
- `employeeService.updateEmployee(id, data)` - Update employee
- `employeeService.deleteEmployee(id)` - Delete employee

### Authentication

The app uses JWT tokens stored in localStorage for authentication. Include the token in API requests:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Role-Based Features

### Admin Role
- View all employees
- Add new employees (coming soon)
- Edit employee information (coming soon)
- Delete employees (coming soon)
- Access to all dashboard features

### Manager Role
- View all employees
- Limited editing capabilities (coming soon)
- Access to dashboard statistics

### Employee Role
- View employee list
- Access to basic dashboard information

## Technologies Used

- **React** - Frontend framework
- **React Router** - Client-side routing
- **CSS3** - Styling with modern features
- **Local Storage** - Client-side data persistence
- **Mock API** - Simulated backend for development

## Future Enhancements

- [ ] Real backend API integration
- [ ] Employee detail pages
- [ ] Add/Edit/Delete employee functionality
- [ ] Search and filtering
- [ ] Pagination for large datasets
- [ ] Export functionality
- [ ] Advanced reporting
- [ ] User profile management
- [ ] Password reset functionality
- [ ] Email notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
