import { formatDate } from "../utils/formatDate";

export function getExpandedFields(race, cardType) {
  const fieldLabels = {
    fundraiser: "Fundraiser",
    location: "Location",
    startLineLocation: "Start Line Location",
    organization: "Organization",
    nLAACertified: "N.L.A.A Certified",
    website: "Website",
  };

  const registrationFieldLabels = {
    fundraiser: "Fundraiser",
    location: "Location",
    startLineLocation: "Start Line Location",
    organization: "Organization",
    nLAACertified: "N.L.A.A Certified",
    website: "Website",
  };

  const formatFieldView = (field, value) => {
    if (field === "website" && value) {
      const href = String(value).trim();
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {href}
        </a>
      );
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return formatDate(value, "registration");
    }

    return value;
  };

  const labels =
    cardType === "registration" ? registrationFieldLabels : fieldLabels;

  return Object.entries(labels)
    .filter(([field]) => {
      const value = race?.[field];
      return value !== null && value !== undefined && value !== "";
    })
    .map(([field, label]) => ({
      label,
      value: formatFieldView(field, race[field]),
    }));
}  
