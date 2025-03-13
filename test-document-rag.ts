import { mastra } from "./mastra";

// Sample document text
const sampleDocument = `
Personal Information:
Name: John Smith
Date of Birth: January 15, 1985
Address: 123 Main Street, Anytown, CA 12345
Phone: (555) 123-4567
Email: john.smith@example.com
Social Security Number: 123-45-6789
Nationality: American
Marital Status: Married

Employment History:
Current Employer: ABC Corporation
Position: Senior Software Engineer
Start Date: March 2018
Address: 456 Tech Blvd, San Francisco, CA 94107
Previous Employer: XYZ Tech Solutions
Position: Software Engineer
Duration: January 2015 - February 2018
Address: 789 Innovation Way, San Jose, CA 95123

Education:
Degree: Master of Science in Computer Science
Institution: University of California, Berkeley
Graduation Year: 2014
GPA: 3.8/4.0

Degree: Bachelor of Science in Computer Engineering
Institution: Stanford University
Graduation Year: 2012
GPA: 3.7/4.0

Insurance Information:
Health Insurance Provider: HealthPlus Insurance
Policy Number: HP-12345678
Group Number: G-987654
Coverage Period: January 1, 2023 - December 31, 2023

Auto Insurance Provider: SafeDrive Insurance
Policy Number: SD-87654321
Vehicle: 2020 Toyota Camry
VIN: 1HGCM82633A123456
Coverage Period: June 15, 2023 - June 14, 2024

Financial Information:
Bank: First National Bank
Account Type: Checking
Account Number: 9876543210
Routing Number: 123456789

Bank: Savings & Trust
Account Type: Savings
Account Number: 0123456789
Routing Number: 987654321

Credit Card: Visa
Card Number: **** **** **** 1234
Expiration: 05/25
`;

async function testDocumentProcessing() {
  console.log("Testing document processing...");

  try {
    // Get the document processing workflow
    const { start } = mastra.getWorkflow("documentProcessingWorkflow").createRun();

    // Process the sample document
    const result = await start({
      triggerData: {
        text: sampleDocument,
        title: "John Smith Personal Information",
      },
    });

    console.log("Document processing result:", result);

    return true;
  } catch (error) {
    console.error("Error processing document:", error);
    return false;
  }
}

async function testDocumentQuery(query: string) {
  console.log(`Testing document query: "${query}"`);

  try {
    // Get the document query workflow
    const { start } = mastra.getWorkflow("documentQueryWorkflow").createRun();

    // Query the document
    const result = await start({
      triggerData: {
        query,
      },
    });

    console.log("Query result:");
    // Access the response from the query-document step
    // console.log(result.response || "No response found");

    return true;
  } catch (error) {
    console.error("Error querying document:", error);
    return false;
  }
}

async function main() {
  // First, process the document
  const processingSuccess = await testDocumentProcessing();

  if (processingSuccess) {
    // Then, test some queries
    await testDocumentQuery("What is John's date of birth?");
    await testDocumentQuery("Where did John go to college?");
    await testDocumentQuery("What is John's health insurance policy number?");
    await testDocumentQuery("What is John's current job?");
    await testDocumentQuery("What car does John drive?");
  }
}

main().catch(console.error);
