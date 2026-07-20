import { useState } from "react";
import { FiUser, FiPhone, FiMapPin, FiBriefcase, FiImage } from "react-icons/fi";
import Upload from "../../components/ui/upload/Upload";
import { COMPANY_TYPES, STATES, STATUS_OPTIONS, EMPTY_COMPANY } from "./constants";

const FORM_ID = "company-form";

export default function CompanyForm({ initialValues, onSubmit }) {
  const [form, setForm] = useState({ ...EMPTY_COMPANY, ...initialValues });
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleChange = (e) => setField(e.target.name, e.target.value);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Company name is required";
    if (!form.type) next.type = "Select a company type";
    if (!form.contactPerson.trim()) next.contactPerson = "Contact person is required";
    if (!form.mobile.trim()) next.mobile = "Mobile number is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email";
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    onSubmit(form);
  };

  return (
    <form id={FORM_ID} className="company-form" onSubmit={handleSubmit} noValidate>
      {/* Basic Information */}
      <section className="company-form__section">
        <div className="company-form__section-head">
          <span className="company-form__section-icon">
            <FiBriefcase />
          </span>
          <h3 className="company-form__section-title">Basic Information</h3>
        </div>
        <div className="company-form__grid">
          <div className="form-group form-group--light company-form__full">
            <label htmlFor="name">Company Name *</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Skyline Infra Developers"
              className={errors.name ? "form-input--error" : ""}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group form-group--light">
            <label htmlFor="type">Company Type *</label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              className={errors.type ? "form-input--error" : ""}
            >
              <option value="">Select type</option>
              {COMPANY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type && <span className="form-error">{errors.type}</span>}
          </div>

          <div className="form-group form-group--light company-form__full">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={form.description}
              onChange={handleChange}
              placeholder="Short overview of the company"
            />
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section className="company-form__section">
        <div className="company-form__section-head">
          <span className="company-form__section-icon">
            <FiPhone />
          </span>
          <h3 className="company-form__section-title">Contact Details</h3>
        </div>
        <div className="company-form__grid">
          <div className="form-group form-group--light">
            <label htmlFor="contactPerson">Contact Person *</label>
            <input
              id="contactPerson"
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
              placeholder="Full name"
              className={errors.contactPerson ? "form-input--error" : ""}
            />
            {errors.contactPerson && (
              <span className="form-error">{errors.contactPerson}</span>
            )}
          </div>

          <div className="form-group form-group--light">
            <label htmlFor="designation">Designation</label>
            <input
              id="designation"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              placeholder="e.g. Managing Director"
            />
          </div>

          <div className="form-group form-group--light">
            <label htmlFor="mobile">Mobile *</label>
            <input
              id="mobile"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="+91 ..."
              className={errors.mobile ? "form-input--error" : ""}
            />
            {errors.mobile && <span className="form-error">{errors.mobile}</span>}
          </div>

          <div className="form-group form-group--light">
            <label htmlFor="altMobile">Alternate Mobile</label>
            <input
              id="altMobile"
              name="altMobile"
              value={form.altMobile}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          <div className="form-group form-group--light">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className={errors.email ? "form-input--error" : ""}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group form-group--light">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="www.company.com"
            />
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="company-form__section">
        <div className="company-form__section-head">
          <span className="company-form__section-icon">
            <FiMapPin />
          </span>
          <h3 className="company-form__section-title">Address</h3>
        </div>
        <div className="company-form__grid">
          <div className="form-group form-group--light">
            <label htmlFor="state">State</label>
            <select id="state" name="state" value={form.state} onChange={handleChange}>
              <option value="">Select state</option>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group form-group--light">
            <label htmlFor="district">District</label>
            <input
              id="district"
              name="district"
              value={form.district}
              onChange={handleChange}
              placeholder="District"
            />
          </div>

          <div className="form-group form-group--light">
            <label htmlFor="city">City</label>
            <input
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
            />
          </div>

          <div className="form-group form-group--light">
            <label htmlFor="pincode">Pincode</label>
            <input
              id="pincode"
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              placeholder="500001"
            />
          </div>

          <div className="form-group form-group--light company-form__full">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              rows="2"
              value={form.address}
              onChange={handleChange}
              placeholder="Street address"
            />
          </div>
        </div>
      </section>

      {/* Business Information */}
      <section className="company-form__section">
        <div className="company-form__section-head">
          <span className="company-form__section-icon">
            <FiUser />
          </span>
          <h3 className="company-form__section-title">Business Information</h3>
        </div>
        <div className="company-form__grid">
          <div className="form-group form-group--light">
            <label htmlFor="gst">GST Number</label>
            <input
              id="gst"
              name="gst"
              value={form.gst}
              onChange={handleChange}
              placeholder="36ABCDE1234F1Z5"
            />
          </div>

          <div className="form-group form-group--light">
            <label htmlFor="pan">PAN Number</label>
            <input
              id="pan"
              name="pan"
              value={form.pan}
              onChange={handleChange}
              placeholder="ABCDE1234F"
            />
          </div>

          <div className="form-group form-group--light company-form__full">
            <label htmlFor="registrationNumber">Registration Number</label>
            <input
              id="registrationNumber"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={handleChange}
              placeholder="RERA / Company registration no."
            />
          </div>
        </div>
      </section>

      {/* Media */}
      <section className="company-form__section">
        <div className="company-form__section-head">
          <span className="company-form__section-icon">
            <FiImage />
          </span>
          <h3 className="company-form__section-title">Media</h3>
        </div>
        <div className="company-form__media">
          <Upload
            label="Company Logo"
            hint="Square PNG or JPG, up to 2MB"
            accept="image/*"
            value={form.logo}
            onChange={(value) => setField("logo", value)}
          />
          <Upload
            label="Gallery Images"
            hint="Upload multiple project images"
            accept="image/*"
            multiple
            value={form.gallery}
            onChange={(value) => setField("gallery", value)}
          />
          <Upload
            label="Brochure"
            hint="PDF up to 10MB"
            accept=".pdf"
            variant="file"
            value={form.brochure}
            onChange={(value) => setField("brochure", value)}
          />
        </div>
      </section>

      {/* Status */}
      <section className="company-form__section">
        <div className="company-form__section-head">
          <span className="company-form__section-icon">
            <FiBriefcase />
          </span>
          <h3 className="company-form__section-title">Status</h3>
        </div>
        <div className="company-form__status">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`company-form__status-btn ${
                form.status === option ? "is-active" : ""
              } company-form__status-btn--${option.toLowerCase()}`}
              onClick={() => setField("status", option)}
            >
              <span className="company-form__status-dot" />
              {option}
            </button>
          ))}
        </div>
      </section>
    </form>
  );
}
