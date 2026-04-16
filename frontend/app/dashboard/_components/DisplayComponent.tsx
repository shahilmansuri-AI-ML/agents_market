interface Props {
  selectedRole: string;
}

const DisplayComponent = ({ selectedRole }: Props) => {
  return (
    <div className="p-6 bg-gray-100 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold">Dashboard Section</h2>
      <p className="mt-2">
        Currently viewing as: <span className="font-bold text-blue-600">{selectedRole}</span>
      </p>

      {/* Conditional Rendering ka chota sa example */}
      <div className="mt-4">
        {selectedRole === "Owner" && (
          <p className="text-sm text-green-600">✅ You have full admin access.</p>
        )}
        {selectedRole === "Tenant" && (
          <p className="text-sm text-orange-600">ℹ️ You can view your rental agreement.</p>
        )}
      </div>
    </div>
  );
};

export default DisplayComponent;