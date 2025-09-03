// Simple script to view club applications stored in localStorage
// Run this in browser console to see submitted applications

console.log("=== CLUB APPLICATIONS ===");

// Get applications from localStorage
const applications = JSON.parse(
  localStorage.getItem("club_applications") || "[]"
);

if (applications.length === 0) {
  console.log("No applications found in localStorage");
} else {
  console.log(`Found ${applications.length} applications:`);
  applications.forEach((app, index) => {
    console.log(`\n--- Application ${index + 1} ---`);
    console.log(`Club: ${app.club_name} (${app.club_id})`);
    console.log(`Applicant: ${app.applicant_name} (${app.applicant_email})`);
    console.log(`Status: ${app.status}`);
    console.log(`Submitted: ${new Date(app.submitted_at).toLocaleString()}`);
    console.log(`Motivation: ${app.motivation}`);
    if (app.experience) console.log(`Experience: ${app.experience}`);
    if (app.skills) console.log(`Skills: ${app.skills}`);
    console.log(`Availability: ${app.availability}`);
    if (app.expectations) console.log(`Expectations: ${app.expectations}`);
    console.log(`Agreed to terms: ${app.agreed_to_terms}`);
  });
}

console.log("\n=== END APPLICATIONS ===");
