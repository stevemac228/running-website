import { formatDate } from "../utils/formatDate";

export function getExpandedFields(race, cardType) {
  //Set labels for the fields in the expanded section
  const fieldLabels = {
    earlyBirdDeadline: "Early Bird Deadline",
    earlyBirdCost: "Early Bird Cost",
    registrationCost: "Registration Cost",
    fundraiser: "Fundraiser",
    location: "Location",
    startLinelocation: "Start Line Location",
    organization: "Organization",
    nLAACertified: "N.L.A.A Certified",
    website: "Website"
  };

  const registrationFieldLabels = {
    fundraiser: "Fundraiser",
    location: "Location",
    startLinelocation: "Start Line Location",
    organization: "Organization",
    nLAACertified: "N.L.A.A Certified",
    website: "Website"
  };

  const formatFieldView = (field, value) => {
    if (field === "website") { //if its a website, open in new tab
      return (
        <a href={value} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      );
    }
    if (typeof value === "boolean") { // if its a boolean format from true/false to Yes/No
      return value ? "Yes" : "No";
    }
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return formatDate(value, "registration");
    }
    return value;
  };

  //If the field matches any of the expanded fields set above and is not blank return the data and the formatted label
  if(cardType == "registration"){
    return Object.entries(registrationFieldLabels)
      .filter(([field]) => {
        const value = race[field];
        return value !== null && value !== undefined && value !== "";
      })
      .map(([field, label]) => ({
        label,
        value: formatFieldView(field, race[field]),
      }));
  }else {
    return Object.entries(fieldLabels)
      .filter(([field]) => {
        const value = race[field];
        return value !== null && value !== undefined && value !== "";
      })
      .map(([field, label]) => ({
        label,
        value: formatFieldView(field, race[field]),
      }));
  }



}
