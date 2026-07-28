import React from "react";

interface TenantSelectorProps {
  selectedTenant: string;
  onTenantChange: (tenant: string) => void;
  availableTenants: string[];
}

/**
 * TenantSelector Component - Multi-tenant dropdown
 * Allows users to switch between different tenants
 */
export const TenantSelector: React.FC<TenantSelectorProps> = ({
  selectedTenant,
  onTenantChange,
  availableTenants,
}) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label>
        <strong>Tenant:</strong>
        <select
          value={selectedTenant}
          onChange={(e) => onTenantChange(e.target.value)}
          style={{ marginLeft: "10px", padding: "8px" }}
        >
          {availableTenants.map((tenant) => (
            <option key={tenant} value={tenant}>
              {tenant}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
