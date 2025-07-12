import { render, screen } from '@testing-library/react';
import App from './App';

// Mock axios to avoid parsing ESM in tests
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));

test('renders login form by default', () => {
  render(<App />);
  const loginElements = screen.getAllByText(/login/i);
  expect(loginElements.length).toBeGreaterThan(0);
});
