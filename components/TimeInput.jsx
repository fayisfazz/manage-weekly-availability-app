export const TimeInput = ({ value, onChange, error, placeholder, name }) => (
  <input
    type="text"
    name={name}
    className={`w-24 px-3 py-2 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
      ${error ? 'border-red-500' : 'border-gray-300'}`}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
  />
);