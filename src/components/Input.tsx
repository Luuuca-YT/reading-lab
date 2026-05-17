import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...rest }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-bluebook-400 uppercase tracking-wide"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-xl border border-bluebook-200 bg-white px-4 py-3 text-body text-bluebook-900 placeholder:text-bluebook-300 focus:border-bluebook-500 focus:outline-none focus:ring-2 focus:ring-bluebook-500/20 transition-colors ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
        } ${className}`}
        {...rest}
      />
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, className = '', ...rest }: TextareaProps) {
  const textareaId = id ?? label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={textareaId}
        className="text-sm font-medium text-bluebook-400 uppercase tracking-wide"
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        className={`w-full rounded-xl border border-bluebook-200 bg-white px-4 py-3 text-body text-bluebook-900 placeholder:text-bluebook-300 focus:border-bluebook-500 focus:outline-none focus:ring-2 focus:ring-bluebook-500/20 transition-colors resize-none ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
        } ${className}`}
        rows={3}
        {...rest}
      />
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}
