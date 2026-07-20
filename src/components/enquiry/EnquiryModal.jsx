import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHome,
  FiMessageSquare,
  FiCalendar,
  FiCheckCircle,
} from 'react-icons/fi';
import EnquiryField from './EnquiryField.jsx';
import ToggleSwitch from './ToggleSwitch.jsx';
import { normalizeProperty } from './normalizeProperty.js';
import {
  buildEnquiryDefaults,
  ENQUIRY_PURPOSE_OPTIONS,
  mapEnquiryPayload,
  validateEnquiryValues,
} from './enquiryValidation.js';
import './EnquiryModal.css';

export default function EnquiryModal({
  property,
  customer = null,
  source = 'WEBSITE',
  onSubmit,
  onClose,
  onSuccess,
  resolveMediaUrl = (url) => url,
  successLinks = {
    enquiriesPath: '/customer/enquiries',
    browsePath: '/properties',
  },
  submitErrorMessage = 'Failed to submit enquiry. Please try again.',
}) {
  const normalizedProperty = useMemo(() => normalizeProperty(property), [property]);
  const [stage, setStage] = useState('form');
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: buildEnquiryDefaults(customer, property),
    mode: 'onBlur',
  });

  const needSiteVisit = watch('needSiteVisit');

  useEffect(() => {
    reset(buildEnquiryDefaults(customer, property));
    setStage('form');
    setSubmitError('');
  }, [customer, property, reset]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (!normalizedProperty) return null;

  const imageSrc = normalizedProperty.image ? resolveMediaUrl(normalizedProperty.image) : null;

  const submitForm = async (values) => {
    setSubmitError('');
    const validationErrors = validateEnquiryValues(values);
    Object.entries(validationErrors).forEach(([field, message]) => {
      setError(field, { type: 'manual', message });
    });
    if (Object.keys(validationErrors).length) return;

    try {
      const payload = mapEnquiryPayload(values, source);
      await onSubmit(payload);
      onSuccess?.(payload);
      setStage('success');
    } catch (error) {
      setSubmitError(error.message || submitErrorMessage);
    }
  };

  return (
    <div className="enquiry-modal" role="presentation" onClick={onClose}>
      <div
        className="enquiry-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="enquiry-modal__close" onClick={onClose} aria-label="Close">
          <FiX />
        </button>

        {stage === 'success' ? (
          <div className="enquiry-modal__success">
            <div className="enquiry-modal__success-icon" aria-hidden="true">
              <FiCheckCircle />
            </div>
            <h3>Enquiry Submitted Successfully</h3>
            <p>Your enquiry has been received.</p>
            <p className="enquiry-modal__success-subtext">
              Our sales representative will contact you shortly.
            </p>
            <div className="enquiry-modal__success-actions">
              <Link to={successLinks.enquiriesPath} className="enquiry-modal__btn enquiry-modal__btn--primary" onClick={onClose}>
                View My Enquiries
              </Link>
              <Link to={successLinks.browsePath} className="enquiry-modal__btn enquiry-modal__btn--ghost" onClick={onClose}>
                Continue Browsing
              </Link>
            </div>
          </div>
        ) : (
          <>
            <header className="enquiry-modal__header">
              {imageSrc ? (
                <img src={imageSrc} alt="" className="enquiry-modal__header-image" />
              ) : (
                <div className="enquiry-modal__header-image enquiry-modal__header-image--placeholder">
                  <FiHome />
                </div>
              )}
              <div className="enquiry-modal__header-copy">
                <span className="enquiry-modal__eyebrow">Enquire About Property</span>
                <h2 id="enquiry-modal-title">{normalizedProperty.title}</h2>
                <div className="enquiry-modal__header-meta">
                  <span>{normalizedProperty.propertyType}</span>
                  <span>{normalizedProperty.location}</span>
                  <span>{normalizedProperty.price}</span>
                  <span className="enquiry-modal__status">{normalizedProperty.status}</span>
                </div>
              </div>
            </header>

            <form className="enquiry-modal__form" onSubmit={handleSubmit(submitForm)} noValidate>
              <div className="enquiry-modal__grid">
                <section className="enquiry-modal__section">
                  <div className="enquiry-modal__section-head">
                    <FiUser />
                    <h3>Customer Information</h3>
                  </div>

                  <EnquiryField label="Full Name" htmlFor="enquiry-name" required error={errors.name?.message}>
                    <input id="enquiry-name" className="enquiry-modal__input" {...register('name')} />
                  </EnquiryField>

                  <EnquiryField label="Mobile Number" htmlFor="enquiry-mobile" required error={errors.mobile?.message}>
                    <div className="enquiry-modal__input-wrap">
                      <FiPhone aria-hidden="true" />
                      <input id="enquiry-mobile" className="enquiry-modal__input" inputMode="numeric" {...register('mobile')} />
                    </div>
                  </EnquiryField>

                  <EnquiryField label="Alternate Mobile (Optional)" htmlFor="enquiry-alt-mobile" error={errors.alternateMobile?.message}>
                    <div className="enquiry-modal__input-wrap">
                      <FiPhone aria-hidden="true" />
                      <input id="enquiry-alt-mobile" className="enquiry-modal__input" inputMode="numeric" {...register('alternateMobile')} />
                    </div>
                  </EnquiryField>

                  <EnquiryField label="Email Address" htmlFor="enquiry-email" error={errors.email?.message}>
                    <div className="enquiry-modal__input-wrap">
                      <FiMail aria-hidden="true" />
                      <input id="enquiry-email" type="email" className="enquiry-modal__input" {...register('email')} />
                    </div>
                  </EnquiryField>

                  <div className="enquiry-modal__field-row">
                    <EnquiryField label="City" htmlFor="enquiry-city">
                      <input id="enquiry-city" className="enquiry-modal__input" {...register('city')} />
                    </EnquiryField>
                    <EnquiryField label="State" htmlFor="enquiry-state">
                      <input id="enquiry-state" className="enquiry-modal__input" {...register('state')} />
                    </EnquiryField>
                  </div>
                </section>

                <section className="enquiry-modal__section">
                  <div className="enquiry-modal__section-head">
                    <FiMessageSquare />
                    <h3>Enquiry Information</h3>
                  </div>

                  <article className="enquiry-modal__summary">
                    {imageSrc ? (
                      <img src={imageSrc} alt="" className="enquiry-modal__summary-image" />
                    ) : (
                      <div className="enquiry-modal__summary-image enquiry-modal__summary-image--placeholder">
                        <FiHome />
                      </div>
                    )}
                    <div className="enquiry-modal__summary-copy">
                      <strong>{normalizedProperty.title}</strong>
                      <span>{normalizedProperty.propertyType}</span>
                      <span>{normalizedProperty.price}</span>
                      <span><FiMapPin aria-hidden="true" /> {normalizedProperty.location}</span>
                      {normalizedProperty.area ? <span>{normalizedProperty.area}</span> : null}
                    </div>
                  </article>

                  <EnquiryField label="Interested Property" htmlFor="enquiry-property">
                    <input id="enquiry-property" className="enquiry-modal__input enquiry-modal__input--readonly" readOnly {...register('interestedProperty')} />
                  </EnquiryField>

                  <EnquiryField label="Purpose" htmlFor="enquiry-purpose">
                    <select id="enquiry-purpose" className="enquiry-modal__input enquiry-modal__select" {...register('purpose')}>
                      {ENQUIRY_PURPOSE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </EnquiryField>

                  <EnquiryField label="Message" htmlFor="enquiry-message" error={errors.message?.message}>
                    <textarea id="enquiry-message" className="enquiry-modal__textarea" rows={3} {...register('message')} />
                  </EnquiryField>

                  <EnquiryField label="Additional Notes" htmlFor="enquiry-notes">
                    <textarea id="enquiry-notes" className="enquiry-modal__textarea" rows={2} {...register('additionalNotes')} />
                  </EnquiryField>

                  <Controller
                    name="needSiteVisit"
                    control={control}
                    render={({ field }) => (
                      <ToggleSwitch
                        id="enquiry-site-visit"
                        label="Need Site Visit"
                        checked={Boolean(field.value)}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />

                  {needSiteVisit ? (
                    <div className="enquiry-modal__site-visit-fields">
                      <EnquiryField label="Preferred Date" htmlFor="enquiry-date" required error={errors.preferredSiteVisitDate?.message}>
                        <div className="enquiry-modal__input-wrap">
                          <FiCalendar aria-hidden="true" />
                          <input id="enquiry-date" type="date" className="enquiry-modal__input" {...register('preferredSiteVisitDate')} />
                        </div>
                      </EnquiryField>
                      <EnquiryField label="Preferred Time" htmlFor="enquiry-time" required error={errors.preferredTime?.message}>
                        <div className="enquiry-modal__input-wrap">
                          <FiCalendar aria-hidden="true" />
                          <input id="enquiry-time" type="time" className="enquiry-modal__input" {...register('preferredTime')} />
                        </div>
                      </EnquiryField>
                    </div>
                  ) : null}
                </section>
              </div>

              {submitError ? <p className="enquiry-modal__submit-error">{submitError}</p> : null}

              <div className="enquiry-modal__footer">
                <button type="button" className="enquiry-modal__btn enquiry-modal__btn--ghost" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="enquiry-modal__btn enquiry-modal__btn--primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Submit Enquiry'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
