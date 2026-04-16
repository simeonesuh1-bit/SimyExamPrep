const fs = require('fs');

const trickyQuestions = [
    // PMG313 - Project Scope Management
    { id: 279, course: 'PMG313', topic: 'WBS Dictionary', type: 'objective', difficulty: 'hard', question: 'Which of the following is TYPICALLY found in a WBS Dictionary but NOT in the WBS itself?', options: ['A. The list of work packages','B. The control account codes','C. Detailed technical descriptions and acceptance criteria for each package','D. The project manager name'], answer: 'C', explanation: 'The WBS is a visual hierarchy; the Dictionary provides the detailed data for each component.' },
    { id: 280, course: 'PMG313', topic: 'Requirements Management Plan', type: 'objective', difficulty: 'hard', question: 'A project is experiencing frequent changes to requirements. Which document should the PM first review to understand how these changes should be handled?', options: ['A. Project Scope Statement','B. Requirements Management Plan','C. Scope Management Plan','D. Change Log'], answer: 'B', explanation: 'The Requirements Management Plan defines the process for collecting, analyzing, and documenting changes to requirements.' },
    
    // FIN313 - Financial Management
    { id: 281, course: 'FIN313', topic: 'Capital Rationing', type: 'objective', difficulty: 'hard', question: 'In a situation of Soft Capital Rationing, the primary constraint is usually:', options: ['A. Market interest rates are too high.','B. The bank refuses to lend more money.','C. Management-imposed limits on the total capital budget.','D. The government prevents new investments.'], answer: 'C', explanation: 'Soft rationing is internal (self-imposed); Hard rationing is external (market-imposed).' },
    { id: 282, course: 'FIN313', topic: 'Cost of Equity', type: 'objective', difficulty: 'hard', question: 'If a company has a higher Beta, what is the expected impact on its Cost of Equity and the project hurdle rate?', options: ['A. Both decrease as the stock is more stable.','B. Both increase as investors demand a higher risk premium.','C. Only the cost of equity increases; the hurdle rate remains constant.','D. They are unrelated.'], answer: 'B', explanation: 'Higher Beta = Higher Systematic Risk = Higher Required Return.' },
    
    // BUA399 - Research Methods
    { id: 283, course: 'BUA399', topic: 'Confounding Variables', type: 'objective', difficulty: 'hard', question: 'A researcher finds a strong correlation between ice cream sales and drowning incidents. However, ' + 'Temperature' + ' affects both. In this case, ' + 'Temperature' + ' is:', options: ['A. An Independent Variable','B. A Dependent Variable','C. A Confounding Variable','D. A Random Variable'], answer: 'C', explanation: 'A confounder creates a spurious relationship between two unrelated variables.' },
    { id: 284, course: 'BUA399', topic: 'Ethical Research', type: 'objective', difficulty: 'hard', question: 'The principle of ' + 'Beneficence' + ' in research ethics requires the researcher to:', options: ['A. Ensure participants stay anonymous.','B. Maximize benefits and minimize potential harms to participants.','C. Pay participants a fair wage.','D. Only study beneficial topics.'], answer: 'B', explanation: 'Beneficence is about the ethical obligation to do good.' },

    // BUA319 - E-Commerce
    { id: 285, course: 'BUA319', topic: 'Cyber-Mediaries', type: 'objective', difficulty: 'hard', question: 'Which of the following is an example of a Dis-intermediation in e-commerce?', options: ['A. A physical travel agent closing because of Expedia.','B. A manufacturer selling directly to customers online, bypassing the retailer.','C. A bank adding an online portal.','D. A customer using a price comparison site.'], answer: 'B', explanation: 'Disintermediation is the removal of middlemen in the supply chain.' },
    { id: 286, course: 'BUA319', topic: 'Channel Conflict', type: 'objective', difficulty: 'hard', question: 'Channel Conflict occurs when:', options: ['A. Two websites have similar designs.','B. A manufacturer online sales compete with its own physical distributors.','C. A customer is confused by different prices.','D. The website server goes down during a sale.'], answer: 'B', explanation: 'It happens when multiple distribution channels (e.g., online vs. offline) compete for the same customers.' },

    // BUS331 - Industrial Visit
    { id: 287, course: 'BUS331', topic: 'Plant Layout Analysis', type: 'objective', difficulty: 'hard', question: 'During a factory visit, a student notices that raw materials are stored at one end of the building and the primary assembly line is at the other end. This is a potential red flag for:', options: ['A. High electricity costs.','B. Material handling inefficiencies and waste (transportation).','C. Poor employee morale.','D. Inadequate security.'], answer: 'B', explanation: 'Long distances between related processes increase handling costs and waste.' },
    { id: 288, course: 'BUS331', topic: 'Quality Control Points', type: 'objective', difficulty: 'hard', question: 'At what stage of an industrial process is it MOST critical to perform quality checks to minimize the cost of scrap?', options: ['A. After the product is already shipped.','B. Before an irreversible or expensive operation.','C. Only at the very beginning when raw materials arrive.','D. At the very end of the line.'], answer: 'B', explanation: 'Catching defects before expensive processing saves significant labor and material costs.' },

    // PMG313 - More Tricky
    { id: 289, course: 'PMG313', topic: 'Inspection vs Testing', type: 'objective', difficulty: 'hard', question: 'In the context of ' + 'Validate Scope' + ', what is the primary role of Inspection?', options: ['A. To prove that the product works as intended technically.','B. To ensure that the business requirements were met from the customer point of view.','C. To calculate the total cost of the deliverable.','D. To find bugs in the software.'], answer: 'B', explanation: 'Inspection during Validate Scope is about customer acceptance of the business case.' },
    { id: 290, course: 'PMG313', topic: 'Product Analysis', type: 'objective', difficulty: 'hard', question: 'Which technique involves translating high-level descriptions into a detailed product breakdown to define scope?', options: ['A. Brainstorming','B. Product Analysis','C. Alternative Analysis','D. Expert Judgment'], answer: 'B', explanation: 'Product analysis converts requirements into technical deliverables.' },

    // Let's add more to reach 50 in this batch
    { id: 291, course: 'BUA303', topic: 'Span of Management', type: 'objective', difficulty: 'hard', question: 'A company decides to reduce its number of management layers (flattening). What is the likely impact on the ' + 'Span of Control' + ' for the remaining managers?', options: ['A. The span of control will decrease.','B. The span of control will increase.','C. The span of control will remain unchanged.','D. Managers will have no span of control.'], answer: 'B', explanation: 'Fewer layers mean more direct reports per manager.' },
    { id: 292, course: 'BUA303', topic: 'Centralization vs Decentralization', type: 'objective', difficulty: 'hard', question: 'In a highly volatile and fast-moving market, which organizational structure is generally more effective at responding to local customer needs?', options: ['A. Highly Centralized','B. Decentralized','C. Purely Bureaucratic','D. Geographic Isolation'], answer: 'B', explanation: 'Decentralization allows for faster local decision-making.' },

    { id: 293, course: 'EHR305', topic: 'Incentive Distortion', type: 'objective', difficulty: 'hard', question: 'A company rewards factory workers based solely on the ' + 'number of units produced' + '. This is most likely to cause:', options: ['A. Higher quality products.','B. A decrease in safety and quality.','C. Improved employee teamwork.','D. Lower overall production.'], answer: 'B', explanation: 'Quantity-only rewards often lead to cutting corners on quality and safety.' },
    { id: 294, course: 'EHR305', topic: 'Pareto Principle in HR', type: 'objective', difficulty: 'hard', question: 'The 80/20 rule in Compensation suggests that:', options: ['A. 80% of salary should be base pay.','B. 80% of performance is often driven by 20% of the employees.','C. 20% of employees deserve 100% of the bonuses.','D. 80% of workers are dissatisfied.'], answer: 'B', explanation: 'Rewarding the top 20% correctly is vital for retention.' },
];

const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

const trickyStr = trickyQuestions.map(q => JSON.stringify(q, null, 4)).join(',\n    ');

if (content.includes('id: 278')) {
    const endKey = 'id: 278';
    const insertionPoint = content.indexOf('};', content.indexOf(endKey)) + 2;
    if (insertionPoint !== -1) {
        content = content.substring(0, insertionPoint) + ',\n    ' + trickyStr + content.substring(insertionPoint);
        fs.writeFileSync(appPath, content);
        console.log('Injected batch 2: ' + trickyQuestions.length + ' questions');
    }
}
