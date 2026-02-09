describe('Packaging Product Page', () => {

  const SKU = '61-0089:100000:T';

  // ---------------------------------------------------------------------------
  // AUTHENTICATION: Use session caching to avoid repeated login execution
  // Ensures consistent authenticated state across all tests
  // ---------------------------------------------------------------------------
  beforeEach(() => {
    cy.session('stullerUser', () => {
      cy.loginStuller();
    });
  });

  // ---------------------------------------------------------------------------
  // NAVIGATION SETUP: Load product page before each test
  // Synchronizes on search results request to ensure page stability
  // ---------------------------------------------------------------------------
  beforeEach(() => {
    cy.intercept('GET', '**/search/results**').as('searchResults');
    cy.visit(`/search/results?query=${SKU}`);
    cy.wait('@searchResults');
    cy.url().should('include', '/products/');
  });

  // ===========================================================================
  // TEST 1: Product Page Rendering Validation
  // Validates identity, price visibility, and ship date availability
  // ===========================================================================
  it('should load and display product details', () => {

    cy.get('[data-test="item-number"]')
      .should('be.visible')
      .and('contain', SKU);

    cy.get('[data-test="main-price-container"]')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const numericPrice = parseFloat(text.replace(/[$,]/g, ''));
        expect(numericPrice).to.be.greaterThan(0);
      });

    cy.get('[data-test="ship-date"]')
      .should('be.visible')
      .invoke('text')
      .should('not.be.empty');
  });

  // ===========================================================================
  // TEST 2: Quantity Update and Cart Persistence Validation
  // Ensures quantity updates, backend processing, and cart state persistence
  // ===========================================================================
  it('should update quantity and add product to cart', () => {

    cy.get('[data-test="quantity"]').click();
    cy.get('[data-test="quantity"]').clear();
    cy.get('[data-test="quantity"]').type('5');
    cy.get('[data-test="quantity"]').should('have.value', '5');

    cy.intercept('POST', '**/addtocart/**').as('addToCart');

    cy.get('[data-test="add-to-cart"]')
      .should('be.enabled');

    cy.get('[data-test="add-to-cart"]')
      .click();

    cy.wait('@addToCart')
      .its('response.statusCode')
      .should('eq', 200);

    cy.intercept('GET', '**/cart').as('getCart');
    cy.visit('/cart');
    cy.wait('@getCart');

    cy.get('[data-test="item-quantity"]')
      .should('have.value', '5');

    // Cleanup to maintain test isolation
    cy.clearCart();
  });

  // ===========================================================================
  // TEST 3: Price Recalculation Validation
  // Confirms dynamic pricing updates when quantity changes
  // ===========================================================================
  it('should recalculate price when quantity changes', () => {

    const targetQty = '3';

    cy.get('[data-test="main-price-container"]:visible');
    cy.get('[data-test="main-price-container"]')
      .invoke('text')
      .then((initialText) => {

        const initialPrice: number = parseFloat(initialText.replace(/[$,]/g, ''));

        cy.intercept('**/price/**').as('priceUpdate');

        cy.get('[data-test="quantity"]').click();
        cy.get('[data-test="quantity"]').type('{selectall}{backspace}' + targetQty);
        cy.get('[data-test="quantity"]').should('have.value', targetQty);

        cy.wait('@priceUpdate');

        cy.get('[data-test="main-price-container"]')
          .invoke('text')
          .then((updatedText) => {

            const updatedPrice: number = parseFloat(updatedText.replace(/[$,]/g, ''));
            const expectedTotal = parseInt(targetQty) * initialPrice;

            expect(updatedPrice).to.be.closeTo(expectedTotal, 0.05);
          });
      });
  });

  // ===========================================================================
  // TEST 4: Inventory Boundary Validation
  // Verifies system behavior when requested quantity exceeds available stock
  // ===========================================================================
  it('should handle quantity greater than available inventory', () => {

    const excessiveQty = '99999';

    cy.intercept('**/price/**').as('priceUpdate');

    cy.get('[data-test="quantity"]').click();
    cy.get('[data-test="quantity"]').type('{selectall}{backspace}');
    cy.get('[data-test="quantity"]').then($input => {
      const input = $input[0] as HTMLInputElement;

      input.value = '99999';

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    cy.get('[data-test="quantity"]').should('have.value', excessiveQty);
    cy.get('.loadingIndicatorContainer').should('not.be.visible');

    cy.wait('@priceUpdate');

    cy.intercept('POST', '**/addtocart/**').as('addToCart');

    cy.get('[data-test="add-to-cart"]')
      .should('be.enabled')
      .click();

    cy.contains('Requested Quantity More than Available')
      .should('be.visible');

    cy.get('[data-test="available-quantity"]')
      .should('be.visible')
      .invoke('text')
      .then((text) => {

        const availableQty = text.replace(/\D/g, '');

        cy.get('[data-test="modal-button"]')
          .contains('Yes')
          .click();

        cy.wait('@addToCart')
          .its('response.statusCode')
          .should('eq', 200);

        cy.intercept("GET", "**/cart/**").as("getCartData");

        cy.visit("/cart");

        cy.wait("@getCartData")
          .its('response.statusCode')
          .should('eq', 200);

        cy.get('[data-test="item-quantity"]')
          .should('have.value', availableQty);

        // Cleanup to maintain independence
        cy.clearCart();
      });
  });
});
