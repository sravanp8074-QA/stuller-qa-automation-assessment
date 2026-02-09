// Interface representing the API product contract used for validation
interface ApiProduct {
  SKU: string;
  Status: string;
  Description: string;
  Price: {
    Value: number;
  };
}

describe('Task 2 - API + UI Product Validation', () => {
  const SKU = '4196:4677:P';

  // ---------------------------------------------------------------------------
  // PRECONDITION: Fetch product data from API (Backend Source of Truth)
  // This ensures UI validation is compared against verified backend data.
  // ---------------------------------------------------------------------------
  before(() => {
    cy.request({
      method: 'GET',
      url: 'https://api.stuller.com/v2/products',
      qs: { SKU },
      auth: {
        user: Cypress.env('stuller_username'),
        pass: Cypress.env('stuller_password'),
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.Products).to.exist;
      expect(response.body.Products).to.have.length.greaterThan(0);

      const product = response.body.Products[0];
      cy.wrap(product).as('apiProduct');
    });
  });

  it('should validate product data between API and UI', () => {

    // -------------------------------------------------------------------------
    // STEP 1: Authenticate and navigate to product page
    // Ensures UI renders pricing and availability correctly for logged-in user.
    // -------------------------------------------------------------------------
    cy.loginStuller();
    cy.searchFromHome(SKU);

    cy.get('@apiProduct').then((api: any) => {
      const apiProduct = api as ApiProduct;

      // -----------------------------------------------------------------------
      // Defensive validation of API response structure before UI comparison
      // -----------------------------------------------------------------------
      expect(apiProduct.SKU).to.exist;
      expect(apiProduct.Status).to.exist;
      expect(apiProduct.Description).to.exist;
      expect(apiProduct.Price).to.exist;
      expect(apiProduct.Price.Value).to.exist;

      // -----------------------------------------------------------------------
      // STEP 2: SKU Validation
      // Verifies product identity matches between API and UI.
      // -----------------------------------------------------------------------
      cy.get('[data-test="item-number"]')
        .should('have.text', apiProduct.SKU);

      // -----------------------------------------------------------------------
      // STEP 3: Status Validation
      // Confirms availability status consistency between backend and UI.
      // -----------------------------------------------------------------------
      cy.get('[data-test="status-message"]')
        .should('be.visible')
        .invoke('text')
        .then((uiStatusText) => {
          expect(uiStatusText.trim())
            .to.equal(apiProduct.Status.trim());
        });

      // -----------------------------------------------------------------------
      // STEP 4: Price Validation
      // Normalizes UI currency formatting and compares numerically with tolerance
      // to account for rounding differences.
      // -----------------------------------------------------------------------
      cy.get('.lblPrice > .mainPriceContainer')
        .should('be.visible')
        .invoke('text')
        .then((uiText) => {
          const uiPrice = parseFloat(uiText.replace(/[$,]/g, ''));
          const apiPrice = Number(apiProduct.Price.Value);

          cy.log(`Comparing UI Price (${uiPrice}) vs API Price (${apiPrice})`);
          expect(uiPrice).to.be.closeTo(apiPrice, 0.01);
        });

      // -----------------------------------------------------------------------
      // STEP 5: Description Validation
      // Ensures product description rendered in UI matches backend response.
      // -----------------------------------------------------------------------
      cy.get('.productDescription')
        .invoke('text')
        .then((text) => {
          expect(text.trim())
            .to.contain(apiProduct.Description.trim());
        });

    });
  });
});
