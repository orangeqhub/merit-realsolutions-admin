export const COMPANY_TYPES = [
  "Builder",
  "Construction Company",
  "Developer",
  "Farm Land Owner",
  "Villa Developer",
  "Apartment Builder",
];

export const STATES = [
  "Telangana",
  "Andhra Pradesh",
  "Karnataka",
  "Tamil Nadu",
  "Maharashtra",
  "Other",
];

export const STATUS_OPTIONS = ["Active", "Inactive"];

export const SALES_PARTNERSHIP_TYPES = [
  { value: "FULL_TIME", label: "Full Time Sales" },
  { value: "PART_TIME", label: "Part Time Sales" },
];

export const EMPTY_COMPANY = {
  name: "",
  type: "",
  salesPartnershipType: "",
  description: "",
  contactPerson: "",
  designation: "",
  mobile: "",
  altMobile: "",
  email: "",
  website: "",
  state: "",
  district: "",
  city: "",
  address: "",
  pincode: "",
  gst: "",
  pan: "",
  registrationNumber: "",
  logo: null,
  gallery: [],
  brochure: null,
  status: "Active",
};
