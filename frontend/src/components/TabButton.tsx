interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

export default function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md ${
        active
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-105 shadow-lg'
          : 'bg-white text-gray-700 hover:bg-gray-50 hover:scale-102'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}