# Stuller QA Automation Assessment

## Overview
This project contains automated test cases developed using Cypress and TypeScript for validating product workflows and API/UI integration.

---

## Tech Stack
- Cypress
- TypeScript
- Node.js
- Cypress Intercept (Network Synchronization)

---

## Project Structure
- Task 1 – End-to-End Workflow Automation
- Task 2 – API + UI Hybrid Validation
- Task 3 – Debugging & Refactor Challenge

---

## Setup Instructions

### Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
### in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"
### Download and install Node.js:
nvm install 24
### Verify the Node.js version:
node -v # Should print "v24.13.0".
### Verify npm version:
npm -v # Should print "11.6.2".

### Configure credentials in `cypress.env.json`:
{
  "stuller_username": "your_username",
  "stuller_password": "your_password"
}

### Run Cypress
npx cypress open

# Debugging Notes (Task 3)

### 1. What Was Wrong
The original test implementation contained several reliability and design issues that made it unstable and difficult to maintain, like:

Use of hard-coded waits (cy.wait(3000))
Index-based selectors (cy.get('input').eq(8))
No synchronization with backend network calls
Weak or superficial assertions (e.g., .should('not.be.empty'))
Direct navigation to the cart page without verifying Add to Cart API completion

These patterns made the tests timing-dependent and tightly coupled to the DOM structure rather than actual application behavior.

### 2. Why it was failing/flaky
First, the use of hard-coded waits like cy.wait(3000) made the test dependent on how fast or slow the application loaded. If the application responded slower than expected (for example in CI), the test would fail because assertions ran too early. If it loaded faster, the test just wasted time. This made the execution inconsistent across environments.

It also used index-based selectors like cy.get('input').eq(8), which are fragile because they depend on the DOM structure. Any small layout change could break the test even if the functionality was still correct.

Another issue was the lack of backend synchronization. The test did not wait for important API calls such as product search or Add to Cart, so it sometimes validated the UI before the server finished processing.

Finally, some assertions were too weak and only checked for element presence rather than validating correct business behavior. Together, these issues made the test unreliable and timing-dependent.

### About the Ship Date Availability cy.get('[data-test="ship-date"]')
The test was failing because it assumed that the ship date is always visible on the product page. In reality, the application only displays detailed shipping information (like “Ready to Ship Today”) for logged-in users. When the test ran without authentication, the UI correctly showed “Limited Availability” instead, and the ship-date element did not exist.
To fix this properly, the test should log in before validating shipping information. Adding a login step in the before() hook ensures that the correct UI state is loaded and that the ship-date element is rendered as expected.

## Added Test Cases

### Test Case 1 – Price Recalculation Validation
When I created the price recalculation test case, my main thought was around business risk. Pricing is directly tied to revenue, so even a small calculation issue can cause financial impact. I didn’t want to just verify that the price is displayed — I wanted to validate that when quantity changes, the total price updates correctly.

So I designed the test to capture the initial unit price, update the quantity, and then verify that the total reflects the expected calculation logic. This ensures that the UI and backend pricing logic are working together correctly. My focus was on validating real business behavior, not just checking UI elements.

Test Definition
This test verifies that when a user updates the product quantity:
The initial unit price is captured correctly.
The quantity field updates successfully.
The total price recalculates based on the updated quantity.
The recalculated price matches the expected mathematical logic (with appropriate tolerance).
The updated price remains consistent after backend processing.

This test validates pricing integrity, calculation accuracy, UI synchronization, and backend consistency. It ensures that quantity changes correctly impact total pricing and protects against revenue-impacting defects.

### Test Case 2 - Quantity Exceeds Available Inventory
While testing the quantity update functionality, I noticed that when a very large quantity is entered, the system displays a modal saying the requested quantity exceeds available stock. This revealed that the application has built-in inventory validation and partial fulfillment logic. Since inventory control directly impacts order accuracy and revenue integrity, I decided to create a dedicated negative test case for this scenario.

My goal was to validate not just the UI behavior, but also the business rule enforcement behind it. I wanted to ensure that the system prevents overselling, clearly informs the user, and correctly handles the user’s decision (accept remaining quantity or cancel).

Test Definition
This test verifies that when a user enters a quantity greater than available inventory:
The system displays a “Requested Quantity More than Available” modal.
The modal shows the correct available quantity.
Clicking “Yes” adds only the available quantity to the cart.
The cart reflects the correct adjusted quantity.
Backend response returns a successful status code.
This test validates inventory enforcement, modal handling, backend synchronization, and cart state persistence. It ensures that the system correctly prevents overselling while maintaining a consistent and predictable user experience.

## Framework design decisions
I kept the framework simple and maintainable, focusing on reliability over complexity. I used Cypress custom commands (loginStuller, searchFromHome, clearCart) to avoid duplication and keep test files readable. This also makes future updates easier because common logic lives in one place.

I prioritized stable selectors using data-test attributes instead of long CSS paths or index-based locators. To make tests deterministic, I avoided hard waits and synchronized with real application behavior using cy.intercept() and cy.wait() for key flows like search, add-to-cart, and cart loading. This reduced flakiness caused by async re-renders and slow network responses.

To keep tests independent, I added cleanup by clearing the cart after each test. This prevents test data pollution and allows the suite to run repeatedly with the same results. Overall, the design choices were made to maximize readability, reuse, and stability while keeping the structure easy to extend.

## Assumptions
The test environment is stable and representative of production behavior.
Authentication is required to view price and ship-date information.
Product inventory and pricing may change dynamically, so numeric comparisons allow small tolerances.
The cart starts in a clean state before each test (handled using clearCart()).