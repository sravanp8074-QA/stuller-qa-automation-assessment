describe("Task 1 - E2E Workflow Automation", () => {

  // Test data required by the assessment
  const ITEM_NUMBER: string = "4196:4677:P";
  const SPECIAL_INSTRUCTION: string = "Task 1 - E2E Workflow Automation";


  before(() => {
    cy.loginStuller();
  });

  it("should complete the full E2E workflow successfully", () => {

    // -------------------------------------------------------------------------
    // STEP 1: Search and navigate to the target product page
    // -------------------------------------------------------------------------
    cy.searchFromHome(ITEM_NUMBER);

    // -------------------------------------------------------------------------
    // STEP 2: Validate the correct product is loaded (Item Number on UI)
    // -------------------------------------------------------------------------
    cy.get('[data-test="item-number"]:visible')
      .should("be.visible")
      .and("have.text", ITEM_NUMBER);

    // -------------------------------------------------------------------------
    // STEP 3: Capture the displayed item number (UI source) for later cart checks
    // -------------------------------------------------------------------------
    cy.get('[data-test="item-number"]:visible')
      .invoke('text')
      .then((text) => {
        cy.wrap(text.trim()).as('itemNumber');
      });

    // -------------------------------------------------------------------------
    // STEP 4: Enter Special Instructions (handles reactive UI / binding behavior)
    // -------------------------------------------------------------------------
    cy.get('[data-test="special-instructions-section"] textarea.form-control')
      .should('exist')
      .then(($textarea) => {
        const el = $textarea[0] as HTMLTextAreaElement;

        el.value = SPECIAL_INSTRUCTION;

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      });

    // -------------------------------------------------------------------------
    // STEP 5: Add product to cart with backend synchronization
    // -------------------------------------------------------------------------
    cy.intercept('POST', '**/addtocart/**').as('addToCart');

    cy.get('[data-test="add-to-cart"]')
      .should('be.enabled')
    cy.get('[data-test="add-to-cart"]')
      .click();

    cy.wait('@addToCart')
      .its('response.statusCode')
      .should('eq', 200);

    // -------------------------------------------------------------------------
    // STEP 6: Navigate to cart and validate cart state (data + UI)
    // -------------------------------------------------------------------------
    cy.intercept("GET", "**/cart/**").as("getCartData");

    cy.visit("/cart");

    cy.wait("@getCartData")
      .its('response.statusCode')
      .should('eq', 200);

    // Cart badge validation (ensures exactly one cart item in this flow)
    cy.contains('a.nav-link', 'Cart Items')
      .find('[data-test="cart-item-count-on-tab"]')
      .should('be.visible')
      .and('have.text', '1');

    // -------------------------------------------------------------------------
    // STEP 7: Validate item number consistency between product page and cart
    // -------------------------------------------------------------------------
    cy.get("@itemNumber").then((item) => {
      cy.get('[data-test="item-number"]').should("have.text", String(item));
    });

    // -------------------------------------------------------------------------
    // STEP 8: Validate Special Instructions persisted into cart
    // -------------------------------------------------------------------------
    cy.get('[data-test="special-instructions"]')
      .should("have.text", SPECIAL_INSTRUCTION);

    // -------------------------------------------------------------------------
    // CLEANUP: Clear cart to keep tests idempotent and independent across runs
    // -------------------------------------------------------------------------
    cy.clearCart();

  });

});
