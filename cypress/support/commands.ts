// -----------------------------------------------------------------------------
// Custom Command: loginStuller
// Handles authentication flow and validates backend login success.
// Ensures authenticated state before executing protected test scenarios.
// -----------------------------------------------------------------------------
Cypress.Commands.add("loginStuller", () => {
  const username: string = Cypress.env("stuller_username");
  const password: string = Cypress.env("stuller_password");

  // Defensive check for required credentials
  if (!username || !password) {
    throw new Error("Credentials missing! Check cypress.env.json");
  }

  // Synchronize login request with backend
  cy.intercept("POST", "**/login**").as("loginRequest");

  cy.visit("/");
  cy.get('[data-test="Account"]').click();

  cy.get('[data-test="username"]')
    .should("be.visible")
    .type(username);

  cy.get('[data-test="password"]')
    .should("be.visible")
    .type(password, { log: false });

  cy.get('[data-test="log-in"]').click();

  // Validate successful authentication response
  cy.wait("@loginRequest")
    .its("response.statusCode")
    .should("eq", 200);
});


// -----------------------------------------------------------------------------
// Custom Command: searchFromHome
// Performs product search from homepage and validates navigation to product page.
// -----------------------------------------------------------------------------
Cypress.Commands.add("searchFromHome", (itemNumber: string) => {
  cy.get('[data-test="search-input"]:visible')
    .should("be.enabled")
    .clear()
    .type(`${itemNumber}{enter}`);

  // Ensure navigation to product details page
  cy.url().should("include", "/products/");
});


// -----------------------------------------------------------------------------
// Custom Command: clearCart
// Ensures test isolation by removing all cart items when present.
// Prevents test data pollution across runs.
// -----------------------------------------------------------------------------
Cypress.Commands.add('clearCart', () => {

  cy.get('body').then(($body) => {

    if ($body.find('[data-test="remove-all-button"]').length > 0) {

      cy.get('[data-test="remove-all-button"]')
        .should('be.visible')
        .click();

      // Confirm removal via modal
      cy.get('[data-test="remove-all-items"]')
        .should('be.visible')
        .click();

      // Validate cart is fully cleared
      cy.contains('Your cart is empty')
        .should('be.visible');
    }

  });

});
