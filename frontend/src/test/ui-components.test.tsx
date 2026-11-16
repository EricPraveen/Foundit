import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Alert,
  EmptyState,
  LoadingIndicator,
  Skeleton,
  PageContainer,
} from '@/components/ui';

describe('UI Design System Primitives', () => {
  describe('Button', () => {
    it('renders text and responds to click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeInTheDocument();

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders loading spinner and disables button when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies variant classes correctly', () => {
      const { rerender } = render(<Button variant="danger">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-rose-600');

      rerender(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('border-slate-300');
    });
  });

  describe('Input', () => {
    it('renders with label and helper text', () => {
      render(
        <Input label="University Email" helperText="Must be your official @uom.lk address" />
      );
      expect(screen.getByLabelText('University Email')).toBeInTheDocument();
      expect(screen.getByText('Must be your official @uom.lk address')).toBeInTheDocument();
    });

    it('displays error message and sets aria-invalid when error is passed', () => {
      render(<Input label="Password" error="Password must be at least 8 characters" />);
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('renders complete card compound components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>Content Area</CardContent>
          <CardFooter>Footer Area</CardFooter>
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description text')).toBeInTheDocument();
      expect(screen.getByText('Content Area')).toBeInTheDocument();
      expect(screen.getByText('Footer Area')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders status badges with appropriate classes', () => {
      render(<Badge variant="success">AVAILABLE</Badge>);
      const badge = screen.getByText('AVAILABLE');
      expect(badge).toHaveClass('text-emerald-800');
    });
  });

  describe('Alert', () => {
    it('renders message, title, and handles dismiss action', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      render(
        <Alert variant="warning" title="Handover Notice" onClose={handleClose}>
          Please hand in item within 24 hours.
        </Alert>
      );

      expect(screen.getByText('Handover Notice')).toBeInTheDocument();
      expect(screen.getByText('Please hand in item within 24 hours.')).toBeInTheDocument();

      const closeBtn = screen.getByLabelText('Dismiss alert');
      await user.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyState', () => {
    it('renders title, description and optional action', () => {
      render(
        <EmptyState
          title="No Items Found"
          description="There are currently no items matching your criteria."
          action={<Button size="sm">Reset Filter</Button>}
        />
      );

      expect(screen.getByText('No Items Found')).toBeInTheDocument();
      expect(screen.getByText('There are currently no items matching your criteria.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset Filter' })).toBeInTheDocument();
    });
  });

  describe('LoadingIndicator & Skeleton', () => {
    it('renders accessible loading indicator', () => {
      render(<LoadingIndicator message="Fetching data..." />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Fetching data...')).toBeInTheDocument();
    });

    it('renders skeleton pulse placeholder', () => {
      const { container } = render(<Skeleton className="h-6 w-24" />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });
  });

  describe('PageContainer', () => {
    it('renders responsive wrapper', () => {
      render(<PageContainer>Page Content</PageContainer>);
      expect(screen.getByText('Page Content')).toHaveClass('mx-auto');
    });
  });
});
