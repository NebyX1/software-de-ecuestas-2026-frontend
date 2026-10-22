import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CheckboxQuestion } from './QuestionCheckbox';

function Harness() {
  const [values, setValues] = useState<string[]>([]);
  return <CheckboxQuestion question="Prueba de selección" values={values} onChange={setValues} max={3}
    options={['A', 'B', 'C', 'D', 'Ninguno', 'Ns/Nc'].map(value => ({ value, label: value }))} exclusiveValues={['Ninguno', 'Ns/Nc']} />;
}
describe('bounded selections and exclusive answers', () => {
  it('keeps the three selected answers and disables a fourth without silently discarding one', async () => {
    render(<Harness />);
    for (const name of ['A', 'B', 'C']) await userEvent.click(screen.getByRole('checkbox', { name }));
    expect(screen.getByRole('checkbox', { name: 'D' })).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: 'D' }));
    for (const name of ['A', 'B', 'C']) expect(screen.getByRole('checkbox', { name })).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'B' }));
    expect(screen.getByRole('checkbox', { name: 'D' })).toBeEnabled();
    await userEvent.click(screen.getByRole('checkbox', { name: 'D' }));
    expect(screen.getAllByRole('checkbox').filter(input => (input as HTMLInputElement).checked)).toHaveLength(3);
  });
  it.each(['Ninguno', 'Ns/Nc'])('%s replaces all normal selections and a normal answer removes it', async name => {
    render(<Harness />);
    for (const value of ['A', 'B', 'C']) await userEvent.click(screen.getByRole('checkbox', { name: value }));
    const exclusive = screen.getByRole('checkbox', { name });
    expect(exclusive).toBeEnabled(); await userEvent.click(exclusive);
    expect(exclusive).toBeChecked();
    for (const value of ['A', 'B', 'C']) expect(screen.getByRole('checkbox', { name: value })).not.toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'D' }));
    expect(exclusive).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'D' })).toBeChecked();
  });
  it('switches exclusive answers and can deselect them', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Ninguno' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Ns/Nc' }));
    expect(screen.getByRole('checkbox', { name: 'Ninguno' })).not.toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Ns/Nc' }));
    expect(screen.getAllByRole('checkbox').filter(input => (input as HTMLInputElement).checked)).toHaveLength(0);
  });
});
