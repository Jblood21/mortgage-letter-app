import { LetterTemplate } from '@/types';

export const DEFAULT_TEMPLATES: LetterTemplate[] = [
  {
    id: 'template-conventional',
    name: 'Conventional Loan Pre-Approval',
    description: 'Standard pre-approval letter for conventional loans',
    loanType: 'conventional',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variables: [],
    content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a365d; margin: 0;">{{company.name}}</h1>
    <p style="color: #4a5568; margin: 5px 0;">NMLS# {{company.nmls}}</p>
    <p style="color: #4a5568; margin: 5px 0;">{{company.address}}</p>
    <p style="color: #4a5568; margin: 5px 0;">{{company.phone}}</p>
  </div>

  <div style="border-top: 3px solid #1a365d; margin-bottom: 30px;"></div>

  <p style="text-align: right; color: #4a5568;">{{date.today}}</p>

  <h2 style="color: #1a365d; text-align: center; margin: 30px 0;">MORTGAGE PRE-APPROVAL LETTER</h2>

  <p>To Whom It May Concern:</p>

  <p>This letter confirms that <strong>{{borrowersNames}}</strong> has been pre-approved for a <strong>{{loan.type}}</strong> mortgage loan in the amount of up to:</p>

  <p style="text-align: center; font-size: 28px; font-weight: bold; color: #1a365d; margin: 30px 0;">{{loan.preApprovalAmount}}</p>

  <p>This pre-approval is based on the following loan parameters:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; width: 50%;"><strong>Loan Type:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{{loan.type}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Loan Term:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{{loan.term}} Years Fixed</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Down Payment:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{{loan.downPayment}} ({{loan.downPaymentPercent}})</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Property Type:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{{property.type}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Occupancy:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{{property.occupancy}}</td>
    </tr>
  </table>

  <p>This pre-approval is subject to the following conditions:</p>
  <ul style="color: #4a5568;">
    <li>Verification of employment and income</li>
    <li>Satisfactory property appraisal</li>
    <li>Clear title and title insurance</li>
    <li>Verification of assets and funds to close</li>
    <li>No material changes to financial condition</li>
    <li>Review and approval of purchase contract</li>
    <li>Subject to underwriting approval</li>
  </ul>

  <p style="color: #e53e3e; font-weight: bold;">This pre-approval expires on {{date.expiration}}.</p>

  <p>Please note that this pre-approval is not a commitment to lend. Final loan approval is subject to satisfactory completion of all underwriting requirements and conditions.</p>

  <p>If you have any questions, please contact me directly.</p>

  <div style="margin-top: 50px;">
    <p style="margin: 5px 0;"><strong>{{loanOfficer.name}}</strong></p>
    <p style="margin: 5px 0; color: #4a5568;">{{loanOfficer.title}}</p>
    <p style="margin: 5px 0; color: #4a5568;">NMLS# {{loanOfficer.nmls}}</p>
    <p style="margin: 5px 0; color: #4a5568;">{{loanOfficer.phone}}</p>
    <p style="margin: 5px 0; color: #4a5568;">{{loanOfficer.email}}</p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #718096;">
    <p>This is a pre-approval only and does not constitute a commitment to lend. All loans are subject to credit approval, property approval, and other standard underwriting conditions. Interest rates and programs are subject to change without notice. Equal Housing Lender.</p>
  </div>
</div>`,
  },
  {
    id: 'template-fha',
    name: 'FHA Loan Pre-Approval',
    description: 'Pre-approval letter for FHA loans with government backing disclosure',
    loanType: 'fha',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variables: [],
    content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2c5282; margin: 0;">{{company.name}}</h1>
    <p style="color: #4a5568; margin: 5px 0;">NMLS# {{company.nmls}}</p>
    <p style="color: #4a5568; margin: 5px 0;">{{company.address}}</p>
    <p style="color: #4a5568; margin: 5px 0;">{{company.phone}}</p>
  </div>

  <div style="border-top: 3px solid #2c5282; margin-bottom: 30px;"></div>

  <p style="text-align: right; color: #4a5568;">{{date.today}}</p>

  <h2 style="color: #2c5282; text-align: center; margin: 30px 0;">FHA MORTGAGE PRE-APPROVAL LETTER</h2>

  <p>To Whom It May Concern:</p>

  <p>This letter serves to confirm that <strong>{{borrowersNames}}</strong> has been pre-approved for an <strong>FHA-insured</strong> mortgage loan in the amount of up to:</p>

  <p style="text-align: center; font-size: 28px; font-weight: bold; color: #2c5282; margin: 30px 0;">{{loan.preApprovalAmount}}</p>

  <p>This FHA loan pre-approval is based on the following parameters:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; width: 50%; background-color: #f7fafc;"><strong>Loan Program:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; background-color: #f7fafc;">FHA {{loan.term}}-Year Fixed</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Maximum Loan Amount:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{{loan.loanAmount}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; background-color: #f7fafc;"><strong>Minimum Down Payment:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; background-color: #f7fafc;">{{loan.downPayment}} ({{loan.downPaymentPercent}})</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Property Type:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{{property.type}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; background-color: #f7fafc;"><strong>Occupancy:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; background-color: #f7fafc;">{{property.occupancy}}</td>
    </tr>
  </table>

  <div style="background-color: #ebf8ff; border-left: 4px solid #3182ce; padding: 15px; margin: 20px 0;">
    <p style="margin: 0; color: #2c5282;"><strong>FHA Program Benefits:</strong></p>
    <ul style="margin: 10px 0; color: #4a5568;">
      <li>Lower down payment requirements (as low as 3.5%)</li>
      <li>More flexible credit requirements</li>
      <li>Gift funds allowed for down payment</li>
      <li>Seller can contribute up to 6% of purchase price toward closing costs</li>
    </ul>
  </div>

  <p><strong>This pre-approval is subject to:</strong></p>
  <ul style="color: #4a5568;">
    <li>FHA property eligibility and appraisal</li>
    <li>Verification of employment, income, and assets</li>
    <li>Property meeting FHA minimum property standards</li>
    <li>Clear title and title insurance</li>
    <li>FHA case number assignment</li>
    <li>No material changes to financial condition</li>
    <li>Final underwriting approval</li>
  </ul>

  <p style="color: #c53030; font-weight: bold;">This pre-approval expires on {{date.expiration}}.</p>

  <p>Should you have any questions regarding this pre-approval or the FHA loan program, please do not hesitate to contact me.</p>

  <div style="margin-top: 50px;">
    <p style="margin: 5px 0;"><strong>{{loanOfficer.name}}</strong></p>
    <p style="margin: 5px 0; color: #4a5568;">{{loanOfficer.title}}</p>
    <p style="margin: 5px 0; color: #4a5568;">NMLS# {{loanOfficer.nmls}}</p>
    <p style="margin: 5px 0; color: #4a5568;">{{loanOfficer.phone}} | {{loanOfficer.email}}</p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #718096;">
    <p>This is a pre-approval only and does not constitute a commitment to lend. FHA loans are subject to FHA requirements, credit approval, property approval, and other standard underwriting conditions. FHA Mortgage Insurance Premium (MIP) is required. Interest rates and programs are subject to change without notice. Equal Housing Lender.</p>
  </div>
</div>`,
  },
  {
    id: 'template-va',
    name: 'VA Loan Pre-Approval',
    description: 'Pre-approval letter for VA loans with veteran benefits information',
    loanType: 'va',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variables: [],
    content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a365d; margin: 0;">{{company.name}}</h1>
    <p style="color: #4a5568; margin: 5px 0;">NMLS# {{company.nmls}}</p>
    <p style="color: #4a5568; margin: 5px 0;">{{company.address}}</p>
    <p style="color: #4a5568; margin: 5px 0;">{{company.phone}}</p>
  </div>

  <div style="border-top: 3px solid #1a365d; border-bottom: 3px solid #c53030; height: 4px; margin-bottom: 30px;"></div>

  <p style="text-align: right; color: #4a5568;">{{date.today}}</p>

  <h2 style="color: #1a365d; text-align: center; margin: 30px 0;">VA HOME LOAN PRE-APPROVAL LETTER</h2>

  <p>To Whom It May Concern:</p>

  <p>We are pleased to confirm that <strong>{{borrowersNames}}</strong>, a qualified veteran, has been pre-approved for a <strong>VA-guaranteed</strong> home loan in the amount of up to:</p>

  <p style="text-align: center; font-size: 28px; font-weight: bold; color: #1a365d; margin: 30px 0;">{{loan.preApprovalAmount}}</p>

  <div style="background-color: #f0fff4; border: 1px solid #48bb78; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="color: #276749; margin-top: 0;">VA Loan Benefits</h3>
    <ul style="color: #2f855a; margin: 0;">
      <li><strong>No Down Payment Required</strong> (100% Financing)</li>
      <li><strong>No Private Mortgage Insurance (PMI)</strong></li>
      <li><strong>Competitive Interest Rates</strong></li>
      <li><strong>Limited Closing Costs</strong></li>
      <li><strong>No Prepayment Penalty</strong></li>
    </ul>
  </div>

  <p>This VA loan pre-approval is based on:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; width: 50%;"><strong>Loan Program:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">VA {{loan.term}}-Year Fixed</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Maximum Loan Amount:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{{loan.loanAmount}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Property Type:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{{property.type}}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Occupancy:</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{{property.occupancy}}</td>
    </tr>
  </table>

  <p><strong>This pre-approval is subject to:</strong></p>
  <ul style="color: #4a5568;">
    <li>Valid Certificate of Eligibility (COE)</li>
    <li>VA property appraisal meeting Minimum Property Requirements (MPRs)</li>
    <li>Verification of employment, income, and assets</li>
    <li>Clear title and title insurance</li>
    <li>No material changes to financial condition</li>
    <li>Final VA and lender underwriting approval</li>
  </ul>

  <p style="color: #c53030; font-weight: bold;">This pre-approval expires on {{date.expiration}}.</p>

  <p>Thank you for your service to our country. Please contact me if you have any questions about this pre-approval or the VA loan process.</p>

  <div style="margin-top: 50px;">
    <p style="margin: 5px 0;"><strong>{{loanOfficer.name}}</strong></p>
    <p style="margin: 5px 0; color: #4a5568;">{{loanOfficer.title}}</p>
    <p style="margin: 5px 0; color: #4a5568;">NMLS# {{loanOfficer.nmls}}</p>
    <p style="margin: 5px 0; color: #4a5568;">{{loanOfficer.phone}} | {{loanOfficer.email}}</p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #718096;">
    <p>This is a pre-approval only and does not constitute a commitment to lend. VA loans are subject to VA requirements, credit approval, property approval, and other standard underwriting conditions. VA Funding Fee may apply (exempt for some veterans). Interest rates and programs are subject to change without notice. Equal Housing Lender.</p>
  </div>
</div>`,
  },
  {
    id: 'template-simple',
    name: 'Simple Pre-Approval Letter',
    description: 'A clean, simple pre-approval letter for any loan type',
    loanType: 'all',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variables: [],
    content: `<div style="font-family: Georgia, serif; max-width: 750px; margin: 0 auto; padding: 50px; line-height: 1.6;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #2d3748; margin: 0; font-size: 24px;">{{company.name}}</h1>
    <p style="color: #718096; margin: 8px 0; font-size: 14px;">{{company.address}}</p>
    <p style="color: #718096; margin: 8px 0; font-size: 14px;">NMLS# {{company.nmls}} | {{company.phone}}</p>
  </div>

  <p style="text-align: right; margin-bottom: 40px;">{{date.today}}</p>

  <p>To Whom It May Concern,</p>

  <p style="text-indent: 30px;">This letter confirms that <strong>{{borrowersNames}}</strong> has been pre-approved for mortgage financing of up to <strong style="color: #2c5282;">{{loan.preApprovalAmount}}</strong> for the purchase of a {{property.type}} to be used as a {{property.occupancy}}.</p>

  <p style="text-indent: 30px;">The pre-approval is based on a {{loan.type}} {{loan.term}}-year fixed-rate loan with a minimum down payment of {{loan.downPaymentPercent}}. This pre-approval is valid through <strong>{{date.expiration}}</strong>.</p>

  <p style="text-indent: 30px;">Please note that final loan approval is contingent upon satisfactory completion of all underwriting requirements, including but not limited to: verification of employment and income, satisfactory property appraisal, clear title, and no material changes to the borrower's financial situation.</p>

  <p style="text-indent: 30px;">Should you require any additional information, please do not hesitate to contact me directly.</p>

  <p style="margin-top: 40px;">Sincerely,</p>

  <div style="margin-top: 30px;">
    <p style="margin: 3px 0;"><strong>{{loanOfficer.name}}</strong></p>
    <p style="margin: 3px 0; color: #4a5568;">{{loanOfficer.title}}</p>
    <p style="margin: 3px 0; color: #4a5568;">NMLS# {{loanOfficer.nmls}}</p>
    <p style="margin: 3px 0; color: #4a5568;">{{loanOfficer.phone}}</p>
    <p style="margin: 3px 0; color: #4a5568;">{{loanOfficer.email}}</p>
  </div>

  <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #a0aec0; text-align: center;">
    <p>This pre-approval is not a commitment to lend. All loans subject to credit and property approval. Equal Housing Lender.</p>
  </div>
</div>`,
  },
  {
    id: 'template-jumbo',
    name: 'Jumbo Loan Pre-Approval',
    description: 'Pre-approval letter for jumbo/high-balance loans',
    loanType: 'jumbo',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    variables: [],
    content: `<div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 50px; background: linear-gradient(to bottom, #ffffff, #f8fafc);">
  <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #c9a227;">
    <h1 style="color: #1a202c; margin: 0; font-size: 28px; letter-spacing: 2px;">{{company.name}}</h1>
    <p style="color: #718096; margin: 10px 0 0; font-size: 13px; letter-spacing: 1px;">PRIVATE CLIENT SERVICES</p>
    <p style="color: #718096; margin: 5px 0; font-size: 12px;">NMLS# {{company.nmls}}</p>
  </div>

  <p style="text-align: right; color: #4a5568; font-size: 14px;">{{date.today}}</p>

  <h2 style="color: #1a202c; text-align: center; margin: 40px 0; font-size: 20px; letter-spacing: 3px; text-transform: uppercase;">Jumbo Loan Pre-Approval</h2>

  <p style="font-size: 15px;">Dear Seller/Listing Agent:</p>

  <p style="font-size: 15px; text-indent: 30px;">We are pleased to confirm that <strong>{{borrowersNames}}</strong> has been thoroughly reviewed and pre-approved for jumbo mortgage financing in the amount of:</p>

  <p style="text-align: center; font-size: 36px; font-weight: bold; color: #c9a227; margin: 40px 0; font-family: Georgia, serif;">{{loan.preApprovalAmount}}</p>

  <div style="background-color: #fafafa; border: 1px solid #e2e8f0; padding: 25px; margin: 30px 0;">
    <h3 style="color: #1a202c; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Loan Parameters</h3>
    <table style="width: 100%; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Loan Type:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">Jumbo {{loan.term}}-Year Fixed</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Maximum Financing:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">{{loan.loanAmount}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Down Payment:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">{{loan.downPayment}} ({{loan.downPaymentPercent}})</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Property Type:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">{{property.type}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Occupancy:</strong></td>
        <td style="padding: 8px 0; text-align: right;">{{property.occupancy}}</td>
      </tr>
    </table>
  </div>

  <p style="font-size: 15px;">This pre-approval reflects a comprehensive review of the borrower's financial profile, including income verification, asset documentation, and credit history. The buyer demonstrates strong qualifications for high-balance financing.</p>

  <p style="font-size: 15px;"><strong>Conditions for Final Approval:</strong></p>
  <ul style="font-size: 14px; color: #4a5568;">
    <li>Satisfactory property appraisal</li>
    <li>Clear title and title insurance</li>
    <li>Reserve verification (12 months PITI)</li>
    <li>Final income and employment confirmation</li>
    <li>Review of executed purchase contract</li>
  </ul>

  <p style="font-size: 15px; color: #c53030;"><strong>Pre-Approval Valid Through: {{date.expiration}}</strong></p>

  <p style="font-size: 15px;">Please feel free to contact me directly with any questions regarding this buyer's qualifications or to expedite the loan process.</p>

  <div style="margin-top: 50px;">
    <p style="margin: 5px 0; font-size: 15px;"><strong>{{loanOfficer.name}}</strong></p>
    <p style="margin: 5px 0; color: #4a5568; font-size: 14px;">{{loanOfficer.title}} | Private Client Services</p>
    <p style="margin: 5px 0; color: #4a5568; font-size: 14px;">NMLS# {{loanOfficer.nmls}}</p>
    <p style="margin: 5px 0; color: #4a5568; font-size: 14px;">{{loanOfficer.phone}} | {{loanOfficer.email}}</p>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #c9a227; font-size: 10px; color: #a0aec0; text-align: center;">
    <p>This pre-approval is not a commitment to lend. Final approval subject to full underwriting review, property appraisal, and satisfaction of all conditions. Interest rates and programs are subject to change. Equal Housing Lender.</p>
  </div>
</div>`,
  },
];

export function getTemplateByLoanType(loanType: string): LetterTemplate {
  const template = DEFAULT_TEMPLATES.find(t => t.loanType === loanType);
  return template || DEFAULT_TEMPLATES.find(t => t.loanType === 'all') || DEFAULT_TEMPLATES[0];
}
