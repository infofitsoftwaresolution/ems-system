import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom to avoid routing issues in tests
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Navigate: () => <div>Redirecting...</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

test('renders app without crashing', () => {
  render(<App />);
  // Test that something renders without errors
  expect(screen.getByText(/Demand more from your employee management system/i)).toBeInTheDocument();
});
