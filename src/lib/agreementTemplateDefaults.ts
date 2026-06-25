// Ready-made default content for the built-in agreement templates.
// Stored as Tiptap-compatible HTML. Used as the editor's starting content
// when no row exists in `agreement_templates` for a given type yet.

export const HOURLY_TEMPLATE_HTML = `
<h1>Educational Consulting Services Agreement</h1>

<h2>Welcome</h2>
<p>Thank you for choosing <strong>{{Consultancy_Name}}</strong> to support your educational journey.</p>
<p>Applying to colleges, graduate schools, MBA programs, law schools, medical schools, and other academic institutions is a significant undertaking. This Agreement outlines the terms governing the consulting relationship between the Consultant and Client.</p>

<h2>Parties</h2>
<p>This Agreement is entered into between:</p>
<p><strong>Consultant:</strong> {{Consultant_Name}}</p>
<p>and</p>
<p><strong>Client:</strong> {{Student_Name}}</p>
<p><strong>Parent/Guardian (if applicable):</strong> {{Parent_Name}}</p>
<p><strong>Effective Date:</strong> {{Agreement_Date}}</p>

<h2>Scope of Services</h2>
<p>The Consultant may provide educational consulting services including:</p>
<ul>
  <li>Admissions strategy</li>
  <li>College and university selection</li>
  <li>Graduate school advising</li>
  <li>MBA, Law School, Medical School advising</li>
  <li>Application planning and timeline management</li>
  <li>Resume and CV review</li>
  <li>Essay brainstorming and feedback</li>
  <li>Interview preparation</li>
  <li>Scholarship and financial aid guidance</li>
  <li>Academic and career advising</li>
</ul>
<p>Services are advisory in nature and may be provided through meetings, written feedback, document reviews, email communication, and research.</p>

<h2>Fees and Billing</h2>
<p><strong>Hourly Rate:</strong> \${{Hourly_Rate}} per hour</p>
<p><strong>Billing Increment:</strong> {{Billing_Increment}} minutes</p>
<p>Billable services may include:</p>
<ul>
  <li>Meetings and consultations</li>
  <li>Application review</li>
  <li>Written feedback</li>
  <li>Research and planning</li>
  <li>Email and messaging support beyond routine communications</li>
  <li>Interview preparation</li>
</ul>
<p>Invoices will be issued according to the Consultant's billing schedule.</p>
<p><strong>Payment Terms:</strong> {{Payment_Terms}}</p>
<p>Accepted payment methods may include:</p>
<ul>
  <li>Credit Card</li>
  <li>ACH / Bank Transfer</li>
  <li>Other approved payment methods</li>
</ul>
<p>Failure to make payment may result in suspension of services.</p>

<h2>Scheduling and Cancellation</h2>
<p>Appointments may be rescheduled or canceled with at least <strong>{{Cancellation_Notice}}</strong> hours' notice.</p>
<p>Appointments canceled after this period may be billed in full at the Consultant's discretion.</p>
<p>Either party may terminate this Agreement at any time through written notice.</p>
<p>The Client remains responsible for payment of all services rendered before termination.</p>

<h2>Client Responsibilities</h2>
<p>The Client is responsible for:</p>
<ul>
  <li>Meeting application deadlines</li>
  <li>Providing accurate information</li>
  <li>Reviewing all application materials before submission</li>
  <li>Providing requested materials in a timely manner</li>
  <li>Confirming admissions requirements directly with institutions</li>
</ul>
<p>The Consultant is not responsible for missed deadlines resulting from delayed communication or incomplete materials.</p>

<h2>Academic Integrity</h2>
<p>The Client acknowledges that all application materials submitted to educational institutions must accurately represent the applicant's own work, experiences, achievements, and views.</p>
<p>The Consultant may provide:</p>
<ul>
  <li>Guidance</li>
  <li>Feedback</li>
  <li>Strategic advice</li>
  <li>Editing suggestions</li>
</ul>
<p>The Consultant will not:</p>
<ul>
  <li>Write essays on behalf of the Client</li>
  <li>Complete applications on behalf of the Client</li>
  <li>Misrepresent facts</li>
  <li>Assist in violating institutional policies</li>
</ul>
<p>The Client agrees to comply with all admissions ethics standards and institutional requirements.</p>

<h2>No Guarantee of Results</h2>
<p>The Client understands and agrees that:</p>
<ul>
  <li>Admission decisions are made solely by educational institutions.</li>
  <li>Scholarship and financial aid decisions are made solely by those institutions.</li>
  <li>Visa decisions are made solely by government authorities.</li>
  <li>The Consultant cannot and does not guarantee admission, scholarships, financial aid, internships, employment opportunities, or any other specific outcome.</li>
</ul>

<h2>Confidentiality</h2>
<p>The Consultant agrees to maintain the confidentiality of personal information and application materials provided by the Client.</p>
<p>Information may only be disclosed:</p>
<ul>
  <li>With the Client's consent</li>
  <li>As required by law</li>
  <li>To service providers assisting with delivery of services</li>
</ul>
<p>The Consultant may retain records related to the engagement for business and compliance purposes.</p>

<h2>Success Stories and Testimonials</h2>
<p>The Client grants permission for the Consultant to reference admissions outcomes, scholarships, testimonials, or success stories for marketing and educational purposes, provided that:</p>
<ul>
  <li>Personal identifying information is removed; or</li>
  <li>Separate written consent is obtained for identifiable use.</li>
</ul>
<p>The Client may opt out of this provision at any time in writing.</p>

<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by law, the Consultant's total liability arising from this engagement shall not exceed the total amount paid by the Client under this Agreement.</p>
<p>The Consultant shall not be liable for indirect, incidental, consequential, special, or punitive damages.</p>

<h2>Governing Law</h2>
<p>This Agreement shall be governed by the laws of the State of <strong>{{State}}</strong>.</p>

<h2>Acceptance</h2>
<p>By signing below, the parties acknowledge that they have read, understood, and agree to the terms of this Agreement.</p>
<p>Consultant Signature: _______________________</p>
<p>Date: _______________________</p>
<p>Client Signature: _______________________</p>
<p>Date: _______________________</p>
<p>Parent/Guardian Signature (if applicable): _______________________</p>
<p>Date: _______________________</p>
`.trim();

export const PACKAGE_TEMPLATE_HTML = `
<h1>Educational Consulting Package Agreement</h1>

<h2>Welcome</h2>
<p>Thank you for choosing <strong>{{Consultancy_Name}}</strong> to support your admissions journey.</p>
<p>Applying to universities and graduate programs is a significant investment of time, effort, and planning. This Agreement outlines the services included in your package and the terms governing the relationship between the Consultant and Client.</p>

<h2>Parties</h2>
<p>This Agreement is entered into between:</p>
<p><strong>Consultant:</strong> {{Consultant_Name}}</p>
<p>and</p>
<p><strong>Client:</strong> {{Student_Name}}</p>
<p><strong>Parent/Guardian (if applicable):</strong> {{Parent_Name}}</p>
<p><strong>Effective Date:</strong> {{Agreement_Date}}</p>

<h2>Package Details</h2>
<h3>Package Name</h3>
<p>{{Package_Name}}</p>
<h3>Package Fee</h3>
<p>\${{Package_Fee}}</p>
<h3>Schools Included</h3>
<p>{{Number_of_Schools}} institutions</p>
<h3>Package Description</h3>
<p>The package may include:</p>
<ul>
  <li>Admissions strategy</li>
  <li>School selection guidance</li>
  <li>Application planning</li>
  <li>Timeline management</li>
  <li>Resume/CV review</li>
  <li>Essay brainstorming and feedback</li>
  <li>Supplemental essay review</li>
  <li>Interview preparation</li>
  <li>Scholarship guidance</li>
  <li>Application submission support</li>
</ul>
<p>Additional services outside the scope of this package may be billed separately upon mutual agreement.</p>

<h2>Payment Terms</h2>
<p><strong>Total Package Fee:</strong> \${{Package_Fee}}</p>
<p><strong>Payment Schedule:</strong></p>
<p>{{Payment_Plan}}</p>
<p>Examples:</p>
<ul>
  <li>Full payment upfront</li>
  <li>Two installments</li>
  <li>Monthly installments</li>
  <li>Custom payment schedule</li>
</ul>
<p>Failure to make payments may result in suspension of services until outstanding balances are resolved.</p>

<h2>Package Scope</h2>
<p>This package covers support for up to:</p>
<p><strong>{{Number_of_Schools}}</strong> applications</p>
<p>Additional schools may be added at the Consultant's standard rates.</p>
<p>The Consultant will make reasonable efforts to support the Client throughout the application process but does not guarantee unlimited revisions, meetings, or support unless specifically stated within the package description.</p>

<h2>Client Responsibilities</h2>
<p>The Client is responsible for:</p>
<ul>
  <li>Meeting all application deadlines</li>
  <li>Providing requested materials in a timely manner</li>
  <li>Reviewing all application materials before submission</li>
  <li>Confirming admissions requirements directly with institutions</li>
  <li>Communicating changes that may impact the application process</li>
</ul>
<p>The Consultant is not responsible for delays caused by missing information, late submissions, or failure to respond to requests.</p>

<h2>Academic Integrity</h2>
<p>The Client acknowledges that all application materials submitted to educational institutions must represent the applicant's own work, experiences, and achievements.</p>
<p>The Consultant may provide:</p>
<ul>
  <li>Strategic guidance</li>
  <li>Brainstorming assistance</li>
  <li>Editing feedback</li>
  <li>Application review</li>
</ul>
<p>The Consultant will not:</p>
<ul>
  <li>Write essays on behalf of the Client</li>
  <li>Complete applications on behalf of the Client</li>
  <li>Fabricate experiences or achievements</li>
  <li>Violate institutional admissions policies</li>
</ul>
<p>The Client agrees to comply with all applicable admissions ethics standards.</p>

<h2>No Guarantee of Admission</h2>
<p>The Client understands and agrees that:</p>
<ul>
  <li>Admission decisions are made solely by educational institutions.</li>
  <li>Scholarship decisions are made solely by educational institutions.</li>
  <li>Financial aid awards are determined independently by institutions.</li>
  <li>The Consultant cannot and does not guarantee admission, scholarships, financial aid, employment opportunities, visas, or any specific outcome.</li>
</ul>

<h2>Withdrawal and Termination</h2>
<p>Either party may terminate this Agreement at any time with written notice.</p>
<h3>If the Client Terminates</h3>
<p>The Consultant will calculate fees based on work already completed.</p>
<p>The Consultant may retain payment for:</p>
<ul>
  <li>Completed strategic planning</li>
  <li>Meetings conducted</li>
  <li>Application reviews completed</li>
  <li>Essays reviewed</li>
  <li>Research performed</li>
  <li>Other consulting services already delivered</li>
</ul>
<p>Any refund, if applicable, shall be determined after deducting the value of services rendered.</p>
<h3>If the Consultant Terminates</h3>
<p>The Client will only be responsible for payment related to services already provided.</p>

<h2>Confidentiality</h2>
<p>The Consultant agrees to maintain the confidentiality of personal information and application materials provided by the Client.</p>
<p>Information may only be disclosed:</p>
<ul>
  <li>With the Client's consent</li>
  <li>As required by law</li>
  <li>To service providers assisting with delivery of services</li>
</ul>
<p>The Consultant may retain records related to the engagement for business and compliance purposes.</p>

<h2>Success Stories and Marketing Permission</h2>
<p>The Client grants permission for the Consultant to reference admissions outcomes, scholarships, acceptances, testimonials, or success stories for marketing and educational purposes, provided that:</p>
<ul>
  <li>Personal identifying information is removed; or</li>
  <li>Separate written consent is obtained for identifiable use.</li>
</ul>
<p>The Client may opt out of this provision by notifying the Consultant in writing.</p>

<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by law, the Consultant's total liability arising from this engagement shall not exceed the total fees paid by the Client under this Agreement.</p>
<p>The Consultant shall not be liable for indirect, incidental, consequential, special, or punitive damages.</p>

<h2>Governing Law</h2>
<p>This Agreement shall be governed by the laws of the State of <strong>{{State}}</strong>.</p>

<h2>Acceptance</h2>
<p>By signing below, the parties acknowledge that they have read, understood, and agree to the terms of this Agreement.</p>
<p>Consultant Signature: _______________________</p>
<p>Date: _______________________</p>
<p>Client Signature: _______________________</p>
<p>Date: _______________________</p>
<p>Parent/Guardian Signature (if applicable): _______________________</p>
<p>Date: _______________________</p>
`.trim();

export const OTHER_TEMPLATE_HTML = `
<h1>Educational Services Agreement</h1>

<h2>Welcome</h2>
<p>Thank you for choosing <strong>{{Consultancy_Name}}</strong>. This Agreement outlines the terms governing the working relationship between the Consultant and Client for the services described below.</p>
<p><em>Use this flexible template for services that don't fit a standard hourly or package model — for example test prep, tutoring, coaching, mentorship, scholarship-only support, or a custom scope of work.</em></p>

<h2>Parties</h2>
<p><strong>Consultant:</strong> {{Consultant_Name}}</p>
<p><strong>Client:</strong> {{Student_Name}}</p>
<p><strong>Parent/Guardian (if applicable):</strong> {{Parent_Name}}</p>
<p><strong>Effective Date:</strong> {{Agreement_Date}}</p>

<h2>Scope of Services</h2>
<p>The Consultant will provide the following services:</p>
<p>{{Service_Description}}</p>
<p>Deliverables, meeting cadence, and any specific milestones are outlined below:</p>
<ul>
  <li>Deliverables: {{Deliverables}}</li>
  <li>Meeting cadence: {{Meeting_Cadence}}</li>
  <li>Estimated duration: {{Engagement_Duration}}</li>
</ul>
<p>Any services outside this scope will be agreed in writing before additional work begins.</p>

<h2>Fees and Payment</h2>
<p><strong>Total Fee:</strong> \${{Total_Fee}}</p>
<p><strong>Payment Schedule:</strong> {{Payment_Schedule}}</p>
<p><strong>Payment Terms:</strong> {{Payment_Terms}}</p>
<p>Accepted payment methods may include:</p>
<ul>
  <li>Credit Card</li>
  <li>ACH / Bank Transfer</li>
  <li>Other approved payment methods</li>
</ul>
<p>Failure to make payment may result in suspension of services until outstanding balances are resolved.</p>

<h2>Scheduling and Cancellation</h2>
<p>Sessions or meetings may be rescheduled or canceled with at least <strong>{{Cancellation_Notice}}</strong> hours' notice.</p>
<p>Sessions canceled after this period may be billed in full at the Consultant's discretion.</p>

<h2>Client Responsibilities</h2>
<p>The Client is responsible for:</p>
<ul>
  <li>Attending scheduled sessions on time</li>
  <li>Providing accurate information</li>
  <li>Completing assigned work or preparation between sessions</li>
  <li>Communicating changes that may impact the engagement</li>
</ul>
<p>The Consultant is not responsible for outcomes affected by missed sessions or incomplete preparation.</p>

<h2>No Guarantee of Results</h2>
<p>The Client understands and agrees that:</p>
<ul>
  <li>Test scores, grades, admission decisions, scholarship awards, and other external outcomes are determined independently of the Consultant.</li>
  <li>The Consultant cannot and does not guarantee any specific outcome.</li>
</ul>

<h2>Confidentiality</h2>
<p>The Consultant agrees to maintain the confidentiality of personal information and materials provided by the Client.</p>
<p>Information may only be disclosed:</p>
<ul>
  <li>With the Client's consent</li>
  <li>As required by law</li>
  <li>To service providers assisting with delivery of services</li>
</ul>
<p>The Consultant may retain records related to the engagement for business and compliance purposes.</p>

<h2>Termination</h2>
<p>Either party may terminate this Agreement at any time with written notice.</p>
<p>The Client remains responsible for payment of all services rendered before termination. Any refund of prepaid amounts, if applicable, will be calculated after deducting the value of services already delivered.</p>

<h2>Success Stories and Marketing Permission</h2>
<p>The Client grants permission for the Consultant to reference outcomes, testimonials, or success stories for marketing and educational purposes, provided that:</p>
<ul>
  <li>Personal identifying information is removed; or</li>
  <li>Separate written consent is obtained for identifiable use.</li>
</ul>
<p>The Client may opt out of this provision at any time in writing.</p>

<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by law, the Consultant's total liability arising from this engagement shall not exceed the total amount paid by the Client under this Agreement.</p>
<p>The Consultant shall not be liable for indirect, incidental, consequential, special, or punitive damages.</p>

<h2>Governing Law</h2>
<p>This Agreement shall be governed by the laws of the State of <strong>{{State}}</strong>.</p>

<h2>Acceptance</h2>
<p>By signing below, the parties acknowledge that they have read, understood, and agree to the terms of this Agreement.</p>
<p>Consultant Signature: _______________________</p>
<p>Date: _______________________</p>
<p>Client Signature: _______________________</p>
<p>Date: _______________________</p>
<p>Parent/Guardian Signature (if applicable): _______________________</p>
<p>Date: _______________________</p>
`.trim();

export const DEFAULT_TEMPLATES: Record<string, string> = {
  hourly: HOURLY_TEMPLATE_HTML,
  package: PACKAGE_TEMPLATE_HTML,
  other: OTHER_TEMPLATE_HTML,
};
