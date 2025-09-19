import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom to avoid routing issues in tests
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Navigate: () => <div>Redirecting...</div>
}));

test('renders app without crashing', () => {
  render(<App />);
  // Test that something renders without errors
  expect(screen.getByText(/employee/i)).toBeInTheDocument();
});
