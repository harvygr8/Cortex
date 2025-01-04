'use client';

export default function SearchBar({ onSearch }) {
  return (
    <div className="">
      <input
        type="text"
        placeholder="Search notes..."
        onChange={(e) => onSearch(e.target.value)}
        className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
} 