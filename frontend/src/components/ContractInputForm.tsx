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
    supplier_address: '',
    buyer_name: '',
    buyer_address: '',
    product: '',
    annual_volume: '',
    delivery: '',
    pricing: '',
    pricing_currency: '',
    payment_terms: '',
    contract_duration: '',
    quality_standards: '',
    warranty: '',
    compliance: '',
    risk_requirements: '',
    additional_clauses: '',
    governing_law_state_country: '',
    arbitration_association: '',
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

  const fillDummyData = (step: number) => {
    const dummyData: Partial<ContractInputs> = {};
    
    switch (step) {
      case 1:
        Object.assign(dummyData, {
          supplier_name: 'PrimeTech Components Inc.',
          supplier_address: '123 Industrial Blvd, San Jose, CA 95110, United States',
          buyer_name: 'Apex Robotics Corporation',
          buyer_address: '456 Tech Park Drive, Austin, TX 78701, United States',
          product: 'Lidar Sensor Module, Model LX-420',
        });
        break;
      case 2:
        Object.assign(dummyData, {
          annual_volume: '18,000 units',
          delivery: 'Bi-weekly delivery to Apex Robotics Assembly Plant in San Jose, CA. Delivery must be completed within 2 business days of scheduled date.',
        });
        break;
      case 3:
        Object.assign(dummyData, {
          pricing: 'Fixed price of $450 per unit for the first 6 months, then up to 3 percent adjustment every 6 months based on market conditions and material costs.',
          pricing_currency: 'USD',
          payment_terms: 'Net 45 days from invoice date',
        });
        break;
      case 4:
        Object.assign(dummyData, {
          contract_duration: '2 years with optional 1-year renewal upon mutual agreement',
          governing_law_state_country: 'California, USA',
          arbitration_association: 'American Arbitration Association (AAA)',
        });
        break;
      case 5:
        Object.assign(dummyData, {
          quality_standards: 'ISO 9001 certified manufacturing required. Failure rate must be below 0.5 percent per quarter. Two quality audits per year by independent third party.',
          warranty: '12-month replacement warranty for defective units. Warranty covers manufacturing defects and material failures.',
        });
        break;
      case 6:
        Object.assign(dummyData, {
          compliance: 'FCC Part 15 compliance required. Data-security compliance for firmware updates. Quarterly compliance reports must be submitted to buyer.',
          risk_requirements: 'Late delivery penalties of 2% per day after 3 days delay. Supplier must hold minimum $2 million USD product liability insurance. Force majeure provisions apply.',
        });
        break;
      case 7:
        Object.assign(dummyData, {
          additional_clauses: 'Confidentiality agreement for all technical specifications. IP protection for buyer\'s proprietary designs. Cybersecurity requirements for firmware updates. Termination with 60-day written notice by either party.',
        });
        break;
    }
    
    setInputs(prev => ({ ...prev, ...dummyData }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-section">
            <div className="form-section-header">
              <h3>Supplier & Product Information</h3>
              <button type="button" onClick={() => fillDummyData(1)} className="fill-dummy-button">
                Fill Dummy Data
              </button>
            </div>
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
              <label htmlFor="supplier_address">Supplier Address *</label>
              <textarea
                id="supplier_address"
                name="supplier_address"
                value={inputs.supplier_address}
                onChange={handleChange}
                rows={2}
                required
                placeholder="e.g., 123 Industrial Blvd, San Jose, CA 95110"
              />
            </div>
            <div className="form-group">
              <label htmlFor="buyer_name">Buyer Name *</label>
              <input
                type="text"
                id="buyer_name"
                name="buyer_name"
                value={inputs.buyer_name}
                onChange={handleChange}
                required
                placeholder="e.g., Apex Robotics"
              />
            </div>
            <div className="form-group">
              <label htmlFor="buyer_address">Buyer Address *</label>
              <textarea
                id="buyer_address"
                name="buyer_address"
                value={inputs.buyer_address}
                onChange={handleChange}
                rows={2}
                required
                placeholder="e.g., 456 Tech Park Drive, Austin, TX 78701"
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
            <div className="form-section-header">
              <h3>Volume & Delivery</h3>
              <button type="button" onClick={() => fillDummyData(2)} className="fill-dummy-button">
                Fill Dummy Data
              </button>
            </div>
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
            <div className="form-section-header">
              <h3>Pricing & Payment</h3>
              <button type="button" onClick={() => fillDummyData(3)} className="fill-dummy-button">
                Fill Dummy Data
              </button>
            </div>
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
              <label htmlFor="pricing_currency">Pricing Currency *</label>
              <input
                type="text"
                id="pricing_currency"
                name="pricing_currency"
                value={inputs.pricing_currency}
                onChange={handleChange}
                required
                placeholder="e.g., USD, EUR, GBP"
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
            <div className="form-section-header">
              <h3>Contract Terms</h3>
              <button type="button" onClick={() => fillDummyData(4)} className="fill-dummy-button">
                Fill Dummy Data
              </button>
            </div>
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
            <div className="form-group">
              <label htmlFor="governing_law_state_country">Governing Law State/Country *</label>
              <input
                type="text"
                id="governing_law_state_country"
                name="governing_law_state_country"
                value={inputs.governing_law_state_country}
                onChange={handleChange}
                required
                placeholder="e.g., California, USA or England and Wales"
              />
            </div>
            <div className="form-group">
              <label htmlFor="arbitration_association">Arbitration Association *</label>
              <input
                type="text"
                id="arbitration_association"
                name="arbitration_association"
                value={inputs.arbitration_association}
                onChange={handleChange}
                required
                placeholder="e.g., American Arbitration Association (AAA), International Chamber of Commerce (ICC)"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="form-section">
            <div className="form-section-header">
              <h3>Quality & Standards</h3>
              <button type="button" onClick={() => fillDummyData(5)} className="fill-dummy-button">
                Fill Dummy Data
              </button>
            </div>
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
            <div className="form-section-header">
              <h3>Compliance & Risk</h3>
              <button type="button" onClick={() => fillDummyData(6)} className="fill-dummy-button">
                Fill Dummy Data
              </button>
            </div>
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
            <div className="form-section-header">
              <h3>Additional Clauses</h3>
              <button type="button" onClick={() => fillDummyData(7)} className="fill-dummy-button">
                Fill Dummy Data
              </button>
            </div>
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

