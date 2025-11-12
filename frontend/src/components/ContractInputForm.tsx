import { useState } from 'react';
import './ContractInputForm.css';
import type { ContractInputs } from '../types/contract';

interface ContractInputFormProps {
  onSubmit: (inputs: ContractInputs) => void;
  isLoading?: boolean;
}

const TOTAL_STEPS = 7;

export default function ContractInputForm({ onSubmit, isLoading = false }: ContractInputFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [inputs, setInputs] = useState<ContractInputs>({
    supplier_name: '',
    product: '',
    annual_volume: '',
    delivery: '',
    pricing: '',
    payment_terms: '',
    contract_duration: '',
    quality_standards: '',
    warranty: '',
    compliance: '',
    risk_requirements: '',
    additional_clauses: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputs);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (form && form.checkValidity()) {
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    } else {
      form?.reportValidity();
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-section">
            <h3>Supplier & Product Information</h3>
            <div className="form-group">
              <label htmlFor="supplier_name">Supplier Name *</label>
              <input
                type="text"
                id="supplier_name"
                name="supplier_name"
                value={inputs.supplier_name}
                onChange={handleChange}
                required
                placeholder="e.g., PrimeTech Components"
              />
            </div>
            <div className="form-group">
              <label htmlFor="product">Product *</label>
              <input
                type="text"
                id="product"
                name="product"
                value={inputs.product}
                onChange={handleChange}
                required
                placeholder="e.g., Lidar Sensor Module, Model LX-420"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="form-section">
            <h3>Volume & Delivery</h3>
            <div className="form-group">
              <label htmlFor="annual_volume">Annual Volume *</label>
              <input
                type="text"
                id="annual_volume"
                name="annual_volume"
                value={inputs.annual_volume}
                onChange={handleChange}
                required
                placeholder="e.g., 18,000 units"
              />
            </div>
            <div className="form-group">
              <label htmlFor="delivery">Delivery *</label>
              <textarea
                id="delivery"
                name="delivery"
                value={inputs.delivery}
                onChange={handleChange}
                rows={3}
                required
                placeholder="e.g., Bi-weekly to Apex Robotics Assembly Plant in San Jose, CA"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="form-section">
            <h3>Pricing & Payment</h3>
            <div className="form-group">
              <label htmlFor="pricing">Pricing *</label>
              <textarea
                id="pricing"
                name="pricing"
                value={inputs.pricing}
                onChange={handleChange}
                rows={3}
                required
                placeholder="e.g., Fixed price for first 6 months, then up to 3 percent adjustment every 6 months"
              />
            </div>
            <div className="form-group">
              <label htmlFor="payment_terms">Payment Terms *</label>
              <input
                type="text"
                id="payment_terms"
                name="payment_terms"
                value={inputs.payment_terms}
                onChange={handleChange}
                required
                placeholder="e.g., Net 45 days"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-section">
            <h3>Contract Terms</h3>
            <div className="form-group">
              <label htmlFor="contract_duration">Contract Duration *</label>
              <input
                type="text"
                id="contract_duration"
                name="contract_duration"
                value={inputs.contract_duration}
                onChange={handleChange}
                required
                placeholder="e.g., 2 years with optional 1-year renewal"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="form-section">
            <h3>Quality & Standards</h3>
            <div className="form-group">
              <label htmlFor="quality_standards">Quality Standards *</label>
              <textarea
                id="quality_standards"
                name="quality_standards"
                value={inputs.quality_standards}
                onChange={handleChange}
                rows={4}
                required
                placeholder="e.g., ISO 9001 certified manufacturing, failure rate below 0.5 percent per quarter, two quality audits per year"
              />
            </div>
            <div className="form-group">
              <label htmlFor="warranty">Warranty *</label>
              <input
                type="text"
                id="warranty"
                name="warranty"
                value={inputs.warranty}
                onChange={handleChange}
                required
                placeholder="e.g., 12-month replacement for defective units"
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="form-section">
            <h3>Compliance & Risk</h3>
            <div className="form-group">
              <label htmlFor="compliance">Compliance *</label>
              <textarea
                id="compliance"
                name="compliance"
                value={inputs.compliance}
                onChange={handleChange}
                rows={4}
                required
                placeholder="e.g., FCC Part 15, data-security compliance for firmware, quarterly compliance reports"
              />
            </div>
            <div className="form-group">
              <label htmlFor="risk_requirements">Risk Requirements *</label>
              <textarea
                id="risk_requirements"
                name="risk_requirements"
                value={inputs.risk_requirements}
                onChange={handleChange}
                rows={4}
                required
                placeholder="e.g., Late delivery penalties after 3 days, supplier must hold 2 million USD product liability insurance"
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="form-section">
            <h3>Additional Clauses</h3>
            <div className="form-group">
              <label htmlFor="additional_clauses">Additional Clauses *</label>
              <textarea
                id="additional_clauses"
                name="additional_clauses"
                value={inputs.additional_clauses}
                onChange={handleChange}
                rows={4}
                required
                placeholder="e.g., Confidentiality, IP protection, cybersecurity for firmware, termination with 60-day notice"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="contract-input-form">
      <h2>Contract Details</h2>
      
      {/* Step Indicator */}
      <div className="step-indicator">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
          <div key={step} className={`step-item ${step === currentStep ? 'active' : step < currentStep ? 'completed' : ''}`}>
            <div className="step-number">{step < currentStep ? '✓' : step}</div>
            <div className="step-label">
              {step === 1 && 'Supplier'}
              {step === 2 && 'Volume'}
              {step === 3 && 'Pricing'}
              {step === 4 && 'Terms'}
              {step === 5 && 'Quality'}
              {step === 6 && 'Compliance'}
              {step === 7 && 'Additional'}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={currentStep === TOTAL_STEPS ? handleSubmit : handleNext}>
        {renderStep()}
        
        <div className="form-navigation">
          {currentStep > 1 && (
            <button type="button" onClick={handleBack} className="back-button-form">
              ← Back
            </button>
          )}
          {currentStep < TOTAL_STEPS ? (
            <button type="submit" className="continue-button">
              Continue →
            </button>
          ) : (
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Generating Contract...' : 'Generate Contract'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

