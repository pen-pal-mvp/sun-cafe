import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom/vitest';
import Page from '@/app/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

beforeAll(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'dummy-anon-key-for-testing');
});

describe('Main Page Component', () => {
  it('should render the component successfully', () => {
    const { container } = render(<Page />);
    expect(container).not.toBeEmptyDOMElement();
  });
});