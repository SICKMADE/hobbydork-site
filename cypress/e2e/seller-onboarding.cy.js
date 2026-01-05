describe('Seller Onboarding Flow', () => {
  it('should complete the seller onboarding process', () => {
    // Visit the onboarding start page
    cy.visit('/onboarding');

    // Example: Click through onboarding steps
    // Adjust selectors and steps as needed for your UI
    cy.contains('Become a Seller').click();
    cy.get('form').within(() => {
      cy.get('input[name="businessName"]').type('Test Seller');
      cy.get('input[name="email"]').type('test-seller@example.com');
      cy.get('button[type="submit"]').click();
    });

    // Wait for Stripe onboarding redirect or confirmation
    cy.url().should('include', '/onboarding/success');
    cy.contains('Your seller application is being reviewed').should('exist');
  });
});
