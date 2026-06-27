import { useState } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  tooltip?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export function FormField({ label, tooltip, error, prefix, suffix, className = '', ...props }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const isNumeric = props.type === 'number';

  // Geformatteerde weergave buiten focus (350000 → 350.000)
  const rawNum = isNumeric ? Number(String(props.value ?? '').replace(/[^\d]/g, '')) : 0;
  const displayValue = isNumeric && !focused
    ? (rawNum > 0 ? rawNum.toLocaleString('nl-NL') : '')
    : props.value;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-[#0D1F3C]">{label}</label>
      {tooltip && <p className="text-xs text-gray-400">{tooltip}</p>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-gray-400 text-sm pointer-events-none">{prefix}</span>}
        <input
          className={`w-full py-2.5 px-3 rounded-lg border border-gray-200 text-[#0D1F3C] bg-white
            focus:outline-none focus:ring-2 focus:ring-[#8B35C0] focus:border-transparent transition
            placeholder:text-gray-300 ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-14' : ''} ${error ? 'border-red-400' : ''} ${className}`}
          {...props}
          type={isNumeric ? 'text' : props.type}
          inputMode={isNumeric ? 'numeric' : undefined}
          pattern={isNumeric ? '[0-9]*' : undefined}
          value={displayValue}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e => { setFocused(false); props.onBlur?.(e); }}
          onChange={e => {
            if (isNumeric) {
              e.target.value = e.target.value.replace(/^0+(\d)/, '$1').replace(/[^\d]/g, '');
            }
            props.onChange?.(e);
          }}
        />
        {suffix && <span className="absolute right-3 text-gray-400 text-sm pointer-events-none">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  tooltip?: string;
  options: { value: string | number; label: string }[];
}

export function SelectField({ label, tooltip, options, className = '', ...props }: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-[#0D1F3C]">{label}</label>
      {tooltip && <p className="text-xs text-gray-400">{tooltip}</p>}
      <select
        className={`w-full py-2.5 px-3 rounded-lg border border-gray-200 text-[#0D1F3C] bg-white
          focus:outline-none focus:ring-2 focus:ring-[#8B35C0] focus:border-transparent transition ${className}`}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

interface ToggleProps {
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, tooltip, checked, onChange }: ToggleProps) {
  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition cursor-pointer
        ${checked ? 'border-[#8B35C0] bg-[#8B35C0]/5' : 'border-gray-200 hover:border-gray-300'}`}
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="text-sm font-medium text-[#0D1F3C]">{label}</p>
        {tooltip && <p className="text-xs text-gray-400 mt-0.5">{tooltip}</p>}
      </div>
      <div className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ml-3 ${checked ? 'bg-[#8B35C0]' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </div>
  );
}

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function OptionCard({ selected, onClick, children, className = '' }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 text-left transition cursor-pointer
        ${selected ? 'border-[#8B35C0] bg-[#8B35C0]/5' : 'border-gray-200 hover:border-gray-300'} ${className}`}
    >
      {children}
    </button>
  );
}
