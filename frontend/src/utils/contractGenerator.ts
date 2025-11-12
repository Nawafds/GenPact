import type { ContractInputs } from '../types/contract';

export function generateContract(inputs: ContractInputs): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const contractTemplate = `
SUPPLY AGREEMENT

This Supply Agreement ("Agreement") is entered into on ${currentDate} ("Effective Date") by and between:

SUPPLIER:
${inputs.supplier_name}
(hereinafter referred to as "Supplier")

BUYER:
${inputs.buyer_name}
(hereinafter referred to as "Buyer")

Supplier and Buyer may be referred to individually as a "Party" or collectively as the "Parties."

1. PRODUCT AND SUPPLY

1.1 Product
The Supplier agrees to supply the following product: ${inputs.product}

1.2 Annual Volume
The annual volume commitment is: ${inputs.annual_volume}

2. DELIVERY TERMS

${inputs.delivery}

3. PRICING

${inputs.pricing}

4. PAYMENT TERMS

${inputs.payment_terms}

5. CONTRACT DURATION

${inputs.contract_duration}

6. QUALITY STANDARDS

${inputs.quality_standards}

7. WARRANTY

${inputs.warranty}

8. COMPLIANCE

${inputs.compliance}

9. RISK REQUIREMENTS

${inputs.risk_requirements}

10. ADDITIONAL CLAUSES

${inputs.additional_clauses}

11. TERMINATION

Either Party may terminate this Agreement in accordance with the terms specified in Section 10 (Additional Clauses). Upon termination, all obligations accrued prior to the termination date shall remain in effect.

12. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Buyer is located, without regard to its conflict of law principles.

13. DISPUTE RESOLUTION

Any disputes arising out of or relating to this Agreement shall be resolved through good faith negotiations between the Parties. If the Parties cannot resolve the dispute through negotiations, they agree to submit to binding arbitration.

14. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the Parties and supersedes all prior negotiations, representations, or agreements, whether oral or written, relating to the subject matter hereof.

15. AMENDMENTS

This Agreement may only be amended by a written instrument signed by both Parties.

16. SIGNATURES

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.

_______________________          _______________________
Supplier Signature                 Buyer Signature

${inputs.supplier_name}              ${inputs.buyer_name}

Date: _______________             Date: _______________
`;

  return contractTemplate.trim();
}

